/**
 * Supabase client — STUB.
 * Per Rules.md #29 and Phases.md Phase 0, this project has not been given
 * a real Supabase URL/anon key yet. Do NOT hardcode credentials here.
 * Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local once
 * you provide them, then this client becomes live — no code changes needed.
 */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Intentionally not thrown at import time to allow the UI to render in
  // demo mode without a backend connected yet.
  console.warn(
    "[SkillX] Supabase env vars are missing. Auth/data calls will fail until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local."
  );
}

export const supabase = createClient(url ?? "https://placeholder.supabase.co", anonKey ?? "placeholder-anon-key");
