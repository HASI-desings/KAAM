import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { session, profile, loading, refreshProfile } = useAuthContext();

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, profile, loading, isAuthenticated: !!session, signOut, refreshProfile };
}
