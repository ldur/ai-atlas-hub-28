import { supabase } from "@/integrations/supabase/client";
import { getAdminToken } from "@/lib/nickname";

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

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function isAdmin(): boolean {
  return getAdminToken() === "atlas-admin-2024";
}
