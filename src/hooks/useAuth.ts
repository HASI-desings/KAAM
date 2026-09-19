import { supabase } from "@/lib/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { session, profile, loading, refreshProfile } = useAuthContext();

  async function sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  }

  async function verifyOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
    // First sign-in: create the profile row (RLS: profiles_insert_own requires auth.uid() = id).
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id }, { onConflict: "id" });
      await supabase.from("wallets").upsert({ user_id: data.user.id }, { onConflict: "user_id" });
    }
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    sendOtp,
    verifyOtp,
    signOut,
    refreshProfile
  };
}
