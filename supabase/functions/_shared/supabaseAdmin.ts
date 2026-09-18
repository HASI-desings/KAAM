/**
 * Service-role client for Edge Functions only. SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are injected automatically by the Supabase Edge
 * Runtime — never set these from frontend code, and this file is never
 * imported by anything under src/.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

export function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

/** Client scoped to the calling user's own JWT, for permission-checked reads. */
export function getUserClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader ?? "" } },
    auth: { persistSession: false }
  });
}
