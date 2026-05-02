// Edge function: create a client account and link it to a company
// Only the company owner (auditor) or an admin can create clients.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Non authentifié" }, 401);

    const body = await req.json();
    const { company_id, email, password, full_name } = body ?? {};
    if (!company_id || !email || !password) return json({ error: "Champs manquants" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Check caller is owner of company OR admin
    const { data: company } = await admin.from("companies").select("id, owner_id").eq("id", company_id).maybeSingle();
    if (!company) return json({ error: "Entreprise introuvable" }, 404);

    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!roleRow;
    if (!isAdmin && company.owner_id !== u.user.id) return json({ error: "Accès refusé" }, 403);

    // Try to find existing user by email
    let userId: string | null = null;
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = existing?.users?.find((x: any) => x.email?.toLowerCase() === String(email).toLowerCase());
    if (found) {
      userId = found.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });
      if (createErr || !created.user) return json({ error: createErr?.message || "Création impossible" }, 400);
      userId = created.user.id;
      // Override default 'auditor' role with 'client'
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.from("user_roles").insert({ user_id: userId, role: "client" });
    }

    // Link to company
    const { error: linkErr } = await admin.from("company_users").upsert({
      company_id, user_id: userId, created_by: u.user.id,
    }, { onConflict: "company_id,user_id" });
    if (linkErr) return json({ error: linkErr.message }, 400);

    return json({ ok: true, user_id: userId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
}