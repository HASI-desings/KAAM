import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfileAndWallet(userId: string) {
    await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
    await supabase.from("wallets").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  }

  async function loadProfile(userId: string) {
    await ensureProfileAndWallet(userId);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, address, education, occupation, is_profile_complete, is_verified, is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        fullName: data.full_name ?? "",
        address: data.address ?? "",
        education: data.education ?? "",
        occupation: data.occupation ?? "",
        isProfileComplete: data.is_profile_complete,
        isVerified: data.is_verified,
        isAdmin: data.is_admin
      });
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) loadProfile(newSession.user.id);
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
