import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MILESTONES = [15, 7, 2];

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  d.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + 16);

    // 1) Actions à échéance
    const { data: actions } = await supabase
      .from("action_plans")
      .select("id, title, due_date, company_id, owner_id, status")
      .gte("due_date", today.toISOString().slice(0, 10))
      .lte("due_date", horizon.toISOString().slice(0, 10))
      .not("status", "in", "(conforme,non_applicable,fait)");

    // 2) Événements calendrier
    const { data: events } = await supabase
      .from("calendar_events")
      .select("id, title, start_at, company_id, owner_id")
      .gte("start_at", today.toISOString())
      .lte("start_at", horizon.toISOString());

    type Item = { source: "action" | "event"; id: string; title: string; date: string; company_id: string; owner_id: string };
    const items: Item[] = [
      ...(actions || []).map((a: any) => ({ source: "action" as const, id: a.id, title: a.title, date: a.due_date, company_id: a.company_id, owner_id: a.owner_id })),
      ...(events || []).map((e: any) => ({ source: "event" as const, id: e.id, title: e.title, date: e.start_at, company_id: e.company_id, owner_id: e.owner_id })),
    ];

    let sent = 0, skipped = 0, errors = 0;

    for (const item of items) {
      const days = daysUntil(item.date);
      if (!MILESTONES.includes(days)) continue;

      // Récupérer destinataires : admin/owner + clients de l'entreprise
      const recipients = new Set<string>();

      // Owner email
      const { data: ownerProfile } = await supabase.from("profiles").select("email").eq("id", item.owner_id).maybeSingle();
      if (ownerProfile?.email) recipients.add(ownerProfile.email);

      // Admins
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (admins?.length) {
        const { data: adminProfiles } = await supabase.from("profiles").select("email").in("id", admins.map((a: any) => a.user_id));
        adminProfiles?.forEach((p: any) => p.email && recipients.add(p.email));
      }

      // Clients de l'entreprise
      const { data: clients } = await supabase.from("company_users").select("user_id").eq("company_id", item.company_id);
      if (clients?.length) {
        const { data: clientProfiles } = await supabase.from("profiles").select("email").in("id", clients.map((c: any) => c.user_id));
        clientProfiles?.forEach((p: any) => p.email && recipients.add(p.email));
      }

      const { data: company } = await supabase.from("companies").select("name").eq("id", item.company_id).maybeSingle();

      for (const email of recipients) {
        // Idempotence : check log
        const { data: existing } = await supabase
          .from("notification_log")
          .select("id")
          .eq("source_type", item.source).eq("source_id", item.id).eq("milestone", days).eq("recipient_email", email)
          .maybeSingle();
        if (existing) { skipped++; continue; }

        // Tenter d'envoyer via send-transactional-email (si configuré)
        try {
          const { error: emailError } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "deadline-reminder",
              recipientEmail: email,
              idempotencyKey: `deadline-${item.source}-${item.id}-${days}-${email}`,
              templateData: {
                title: item.title,
                daysLeft: days,
                dueDate: item.date,
                companyName: company?.name || "",
                kind: item.source === "action" ? "Action corrective" : "Événement",
              },
            },
          });
          if (emailError) { errors++; continue; }

          await supabase.from("notification_log").insert({
            source_type: item.source, source_id: item.id, milestone: days, recipient_email: email,
          });
          sent++;
        } catch (e) {
          errors++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, skipped, errors, total_items: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});