import { supabase } from "@/integrations/supabase/client";
import { getAdminToken, setAdminToken, clearAdminToken } from "@/lib/nickname";

interface AdminActionParams {
  action: "insert" | "update" | "delete";
  table: string;
  payload?: Record<string, any>;
  id?: string;
}

export async function adminAction({ action, table, payload, id }: AdminActionParams) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    throw new Error("Ikke pålogget som admin. Logg inn i admin-panelet først.");
  }

  const { data, error } = await supabase.functions.invoke("admin-action", {
    body: { action, table, payload, id },
    headers: { "x-admin-token": adminToken },
  });

  if (error) {
    // Session expired or invalid → force re-login
    if ((error as any)?.context?.status === 401) {
      clearAdminToken();
      throw new Error("Admin-økten er utløpt. Logg inn på nytt.");
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function isAdmin(): boolean {
  return !!getAdminToken();
}

/** Validates the stored session token against the server. */
export async function verifyAdmin(token?: string | null): Promise<boolean> {
  const adminToken = token ?? getAdminToken();
  if (!adminToken) return false;

  try {
    const { data, error } = await supabase.functions.invoke("verify-admin", {
      headers: { "x-admin-token": adminToken },
    });
    if (error) return false;
    return data?.valid === true;
  } catch {
    return false;
  }
}

/** Exchanges the admin code for a short-lived session token. */
export async function adminLogin(
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-admin", {
      body: { code },
    });
    if (data?.valid === true && data?.token) {
      setAdminToken(data.token, data.expiresAt);
      return { ok: true };
    }
    const message =
      data?.error ||
      (error as any)?.context?.status === 429
        ? "For mange mislykkede forsøk. Prøv igjen senere."
        : undefined;
    return { ok: false, error: message };
  } catch {
    return { ok: false };
  }
}
