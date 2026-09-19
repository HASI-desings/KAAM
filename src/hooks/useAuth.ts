import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { session, profile, loading, refreshProfile } = useAuthContext();

  async function sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, profile, loading, isAuthenticated: !!session, sendMagicLink, signOut, refreshProfile };
}
