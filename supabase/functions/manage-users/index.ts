// Edge function: manage admin / auditor accounts. Admin only.
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
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roleRow } = await admin.from("user_roles").select("role")
      .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Accès refusé : réservé aux administrateurs" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "list";

    if (action === "list") {
      const { data: roles } = await admin.from("user_roles").select("user_id, role").in("role", ["admin", "auditor"]);
      const ids = [...new Set((roles ?? []).map((r: any) => r.user_id))];
      const { data: profiles } = ids.length
        ? await admin.from("profiles").select("id, email, full_name").in("id", ids)
        : { data: [] as any[] };
      const users = ids.map((id) => ({
        user_id: id,
        email: profiles?.find((p: any) => p.id === id)?.email ?? null,
        full_name: profiles?.find((p: any) => p.id === id)?.full_name ?? null,
        roles: (roles ?? []).filter((r: any) => r.user_id === id).map((r: any) => r.role),
      }));
      return json({ users });
    }

    if (action === "create") {
      const { email, password, full_name, role } = body ?? {};
      if (!email || !password) return json({ error: "Email et mot de passe requis" }, 400);
      if (String(password).length < 8) return json({ error: "Mot de passe : 8 caractères minimum" }, 400);
      const wanted = role === "auditor" ? "auditor" : "admin";

      const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = existing?.users?.find((x: any) => x.email?.toLowerCase() === String(email).toLowerCase());
      let userId: string;
      if (found) {
        userId = found.id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { full_name: full_name || email },
        });
        if (createErr || !created.user) return json({ error: createErr?.message || "Création impossible" }, 400);
        userId = created.user.id;
      }
      await admin.from("user_roles").delete().eq("user_id", userId);
      const { error: rErr } = await admin.from("user_roles").insert({ user_id: userId, role: wanted });
      if (rErr) return json({ error: rErr.message }, 400);
      return json({ ok: true, user_id: userId, existed: !!found });
    }

    if (action === "update") {
      const { user_id, email, full_name, password, role } = body ?? {};
      if (!user_id) return json({ error: "user_id requis" }, 400);
      if (password && String(password).length < 8) return json({ error: "Mot de passe : 8 caractères minimum" }, 400);

      const attrs: Record<string, unknown> = {};
      if (email) attrs.email = email;
      if (password) attrs.password = password;
      if (full_name !== undefined) attrs.user_metadata = { full_name: full_name || email };
      if (Object.keys(attrs).length) {
        const { error: uErr } = await admin.auth.admin.updateUserById(user_id, attrs as any);
        if (uErr) return json({ error: uErr.message }, 400);
      }

      const profilePatch: Record<string, unknown> = {};
      if (email) profilePatch.email = email;
      if (full_name !== undefined) profilePatch.full_name = full_name || null;
      if (Object.keys(profilePatch).length) {
        await admin.from("profiles").update(profilePatch).eq("id", user_id);
      }

      if (role && ["admin", "auditor"].includes(role)) {
        if (user_id === u.user.id) return json({ error: "Vous ne pouvez pas modifier votre propre rôle" }, 400);
        await admin.from("user_roles").delete().eq("user_id", user_id);
        const { error: rErr } = await admin.from("user_roles").insert({ user_id, role });
        if (rErr) return json({ error: rErr.message }, 400);
      }
      return json({ ok: true });
    }

    if (action === "delete") {
      const { user_id } = body ?? {};
      if (!user_id) return json({ error: "user_id requis" }, 400);
      if (user_id === u.user.id) return json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, 400);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_role") {
      const { user_id, role } = body ?? {};
      if (!user_id || !["admin", "auditor"].includes(role)) return json({ error: "Paramètres invalides" }, 400);
      if (user_id === u.user.id) return json({ error: "Vous ne pouvez pas modifier votre propre rôle" }, 400);
      await admin.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await admin.from("user_roles").insert({ user_id, role });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
