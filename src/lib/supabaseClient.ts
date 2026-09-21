/**
 * Supabase client. Uses a manual cast for import.meta.env instead of relying
 * on vite/client ambient types alone — avoids TS2339 build failures on
 * environments where vite-env.d.ts isn't picked up for any reason.
 */
import { createClient } from "@supabase/supabase-js";

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[SkillX] Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Vercel: Settings -> Environment Variables) and redeploy."
  );
}

export const supabase = createClient(url ?? "https://placeholder.supabase.co", anonKey ?? "placeholder-anon-key");
