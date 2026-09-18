import { createContext, useContext, useState, ReactNode } from "react";
import type { Profile } from "@/types";

interface AuthContextValue {
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  return <AuthContext.Provider value={{ profile, setProfile }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
