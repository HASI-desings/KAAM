import { useAuthContext } from "@/context/AuthContext";

// Placeholder auth hook. Real OTP sign-in wires to supabase.auth in Phase 1.
export function useAuth() {
  const { profile, setProfile } = useAuthContext();
  return { profile, setProfile, isAuthenticated: !!profile };
}
