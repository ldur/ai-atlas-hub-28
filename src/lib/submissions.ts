import { supabase } from "@/integrations/supabase/client";
import { getAdminToken } from "@/lib/nickname";

/**
 * Survey submissions are not readable directly from the client.
 * This helper reads them through the `read-submissions` edge function, which
 * returns full rows for admins and only aggregate-safe columns otherwise.
 */
export async function fetchSubmissions(surveyId?: string): Promise<any[]> {
  const token = getAdminToken();
  const { data, error } = await supabase.functions.invoke("read-submissions", {
    body: { surveyId: surveyId ?? "all" },
    ...(token ? { headers: { "x-admin-token": token } } : {}),
  });
  if (error) {
    console.error("Failed to load submissions:", error);
    return [];
  }
  return (data?.submissions as any[]) || [];
}
