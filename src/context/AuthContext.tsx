import * as React from "react";
import { mockTherapist } from "@/lib/mockData";
import type { TherapistProfile, TherapistStatus } from "@/types";

interface AuthState {
  user: TherapistProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (payload: Partial<TherapistProfile> & { password: string }) => Promise<void>;
  setStatus: (status: TherapistStatus) => void;
}

const AuthContext = React.createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "umatter.therapist.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<TherapistProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as TherapistProfile) : null;
    } catch {
      return null;
    }
  });

  const persist = (u: TherapistProfile | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login: AuthState["login"] = async (email) => {
    await new Promise((r) => setTimeout(r, 400));
    persist({ ...mockTherapist, email });
  };

  const logout = () => persist(null);

  const register: AuthState["register"] = async (payload) => {
    await new Promise((r) => setTimeout(r, 600));
    persist({
      ...mockTherapist,
      ...payload,
      status: "PENDING_LICENSE_VERIFICATION",
    } as TherapistProfile);
  };

  const setStatus = (status: TherapistStatus) => {
    if (!user) return;
    persist({ ...user, status });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        setStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
