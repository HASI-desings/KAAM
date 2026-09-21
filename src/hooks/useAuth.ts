import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { session, profile, loading, refreshProfile } = useAuthContext();

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  }

  return {
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    signOut,
    sendMagicLink,
    refreshProfile,
  };
}
