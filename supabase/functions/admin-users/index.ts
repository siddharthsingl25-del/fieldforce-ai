import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getSecretKey();
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server is not configured" }, 500);
  }

  if (!token) {
    return json({ error: "Missing auth token" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const adminCheck = await requireAdmin(adminClient, token);
  if ("error" in adminCheck) return json({ error: adminCheck.error }, adminCheck.status);

  if (req.method === "GET") {
    const { data, error } = await adminClient.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 400);
    return json({ users: data || [] });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "mr").trim();

    if (!fullName || !email || password.length < 6 || !["admin", "manager", "mr"].includes(role)) {
      return json({ error: "Invalid user details" }, 400);
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role }
    });

    if (createError || !createdUser.user) {
      return json({ error: createError?.message || "User creation failed" }, 400);
    }

    const { data: savedProfile, error: saveError } = await adminClient
      .from("profiles")
      .upsert({
        id: createdUser.user.id,
        full_name: fullName,
        email,
        role,
        status: "active"
      })
      .select()
      .single();

    if (saveError) return json({ error: saveError.message }, 400);
    return json({ user: savedProfile }, 200);
  }

  if (req.method === "PATCH") {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "").trim();
    const status = String(body.status || "").trim();
    const password = String(body.password || "");

    if (!id) return json({ error: "Missing user id" }, 400);
    if (id === adminCheck.userId && status === "inactive") {
      return json({ error: "You cannot deactivate your own account" }, 400);
    }

    const update: Record<string, string> = {};
    if (fullName) update.full_name = fullName;
    if (["admin", "manager", "mr"].includes(role)) update.role = role;
    if (["active", "inactive"].includes(status)) update.status = status;
    if (password && password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

    if (!Object.keys(update).length && !password) return json({ error: "No changes provided" }, 400);

    if (password) {
      const { error: passwordError } = await adminClient.auth.admin.updateUserById(id, { password });
      if (passwordError) return json({ error: passwordError.message }, 400);
    }

    if (!Object.keys(update).length) {
      const { data, error } = await adminClient.from("profiles").select("*").eq("id", id).single();
      if (error) return json({ error: error.message }, 400);
      return json({ user: data }, 200);
    }

    const { data, error } = await adminClient.from("profiles").update(update).eq("id", id).select().single();
    if (error) return json({ error: error.message }, 400);
    return json({ user: data }, 200);
  }

  return json({ error: "Method not allowed" }, 405);
});

async function requireAdmin(adminClient: ReturnType<typeof createClient>, token: string) {
  const {
    data: { user },
    error: userError
  } = await adminClient.auth.getUser(token);

  if (userError || !user) return { error: "Invalid auth token", status: 401 };

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin" || profile?.status === "inactive") {
    return { error: "Access denied", status: 403 };
  }

  return { userId: user.id };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function getSecretKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return null;

  try {
    const parsed = JSON.parse(secretKeys);
    return parsed.default || Object.values(parsed)[0] || null;
  } catch {
    return null;
  }
}
