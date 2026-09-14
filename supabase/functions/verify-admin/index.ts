import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  createSessionToken,
  hashIp,
  verifyPassword,
  verifySessionToken,
} from "../_shared/adminAuth.ts";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // Session check: an existing token is validated without touching the password.
    const sessionToken = req.headers.get("x-admin-token");
    let code: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        code = typeof body?.code === "string" ? body.code : null;
      } catch {
        code = null;
      }
    }

    if (!code) {
      const valid = await verifySessionToken(sessionToken);
      return json({ valid });
    }

    if (code.length > 200) return json({ valid: false, error: "Ugyldig kode." }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const ipHash = await hashIp(req);
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("success", false)
      .gte("created_at", since);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return json(
        {
          valid: false,
          error: `For mange mislykkede forsøk. Prøv igjen om ${WINDOW_MINUTES} minutter.`,
        },
        429,
      );
    }

    const storedHash = Deno.env.get("ADMIN_PASSWORD_HASH");
    const sessionSecret = Deno.env.get("ADMIN_SESSION_SECRET");
    if (!storedHash || !sessionSecret) {
      return json({ valid: false, error: "Admin-pålogging er ikke konfigurert." }, 500);
    }

    const ok = await verifyPassword(code, storedHash);

    await supabase.from("admin_login_attempts").insert({ ip_hash: ipHash, success: ok });
    // Opportunistic cleanup of old rows
    await supabase
      .from("admin_login_attempts")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!ok) {
      console.warn("Failed admin login attempt");
      return json({ valid: false }, 401);
    }

    const { token, expiresAt } = await createSessionToken(sessionSecret);
    return json({ valid: true, token, expiresAt });
  } catch (e) {
    console.error("verify-admin error:", e);
    return json({ valid: false, error: "Uventet feil." }, 500);
  }
});
