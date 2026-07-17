import * as React from "react";
import {
  clearSession,
  getMe,
  getStoredProfileId,
  login as loginApi,
  logoutApi,
  register as registerApi,
  storeSession,
  type LicenseStatus,
  type RegisterRequest,
  type UserResponse,
} from "@/lib/api/auth";
import { getStoredToken } from "@/lib/api/http";
import type { TherapistProfile, TherapistStatus } from "@/types";

interface AuthState {
  user: TherapistProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: Partial<TherapistProfile> & { password: string }) => Promise<void>;
  setStatus: (status: TherapistStatus) => void;
  refreshUser: () => Promise<void>;
  updateUser: (patch: Partial<TherapistProfile>) => void;
}

const AuthContext = React.createContext<AuthState | undefined>(undefined);

const PROFILE_CACHE_KEY = "umatter.therapist.profileCache";

function loadCachedProfile(): TherapistProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as TherapistProfile) : null;
  } catch {
    return null;
  }
}

function persistCachedProfile(profile: TherapistProfile | null) {
  if (profile) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  else localStorage.removeItem(PROFILE_CACHE_KEY);
}

function mapLicenseStatusToTherapistStatus(
  licenseStatus: LicenseStatus | undefined,
): TherapistStatus {
  switch (licenseStatus) {
    case "VERIFIED":
      return "ACTIVE";
    case "REJECTED":
      return "SUSPENDED";
    case "EXPIRED":
      return "LICENSE_EXPIRED";
    case "PENDING_VERIFICATION":
      return "PENDING_LICENSE_VERIFICATION";
    case undefined:
    default:
      return "ACTIVE";
  }
}

function mapUserToTherapist(u: UserResponse, prev?: TherapistProfile | null): TherapistProfile {
  // `/auth/me` returns the profile_id in `id` (the single identity since the
  // users/profiles merge), which is what every therapist/social/notification
  // endpoint is keyed by. Fall back to the stored id only if `id` is missing.
  const profileId = u.id ?? getStoredProfileId();
  return {
    id: profileId,
    fullName: u.fullName,
    email: u.email,
    phone: u.phoneNumber ?? prev?.phone ?? "",
    dob: u.dob ?? prev?.dob ?? "",
    avatarUrl: u.avatarUrl ?? prev?.avatarUrl,
    role: u.role,
    specialization: u.specialization ?? prev?.specialization ?? "",
    bio: u.bio ?? prev?.bio ?? "",
    yearsOfExperience: u.yearsOfExperience ?? prev?.yearsOfExperience ?? 0,
    consultationFee: u.consultationFee ?? prev?.consultationFee ?? 0,
    licenseNumber: u.licenseNumber ?? prev?.licenseNumber ?? "",
    licenseAuthority: u.licenseAuthority ?? prev?.licenseAuthority ?? "",
    licenseExpiresAt: u.licenseExpiresAt ?? prev?.licenseExpiresAt ?? "",
    status: u.licenseStatus
      ? mapLicenseStatusToTherapistStatus(u.licenseStatus)
      : prev?.status ?? "ACTIVE",
    languages: u.languages ?? prev?.languages ?? ["vi", "en"],
  } as TherapistProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<TherapistProfile | null>(() => loadCachedProfile());
  const [loading, setLoading] = React.useState<boolean>(() => !!getStoredToken());

  const persist = React.useCallback((u: TherapistProfile | null) => {
    setUser(u);
    persistCachedProfile(u);
  }, []);

  const refreshUser = React.useCallback(async () => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    try {
      const me = await getMe();
      const mapped = mapUserToTherapist(me, loadCachedProfile());
      persist(mapped);
    } catch {
      clearSession();
      persist(null);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login: AuthState["login"] = async (email, password) => {
    const auth = await loginApi(email, password);
    storeSession(auth.token, auth.profileId);
    try {
      const me = await getMe();
      const mapped = mapUserToTherapist(me, loadCachedProfile());
      persist(mapped);
    } catch {
      persist({
        id: auth.profileId,
        fullName: "",
        email: auth.email,
        phone: "",
        dob: "",
        specialization: "",
        bio: "",
        yearsOfExperience: 0,
        consultationFee: 0,
        licenseNumber: "",
        licenseAuthority: "",
        licenseExpiresAt: "",
        status: "ACTIVE",
        languages: [],
      });
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearSession();
    persist(null);
  };

  const register: AuthState["register"] = async (payload) => {
    const req: RegisterRequest = {
      fullName: payload.fullName ?? "",
      email: payload.email ?? "",
      password: payload.password,
      phoneNumber: payload.phone,
      dob: payload.dob,
      role: "THERAPIST",
      avatarUrl: payload.avatarUrl,
      specialization: payload.specialization,
      bio: payload.bio,
      yearsOfExperience: payload.yearsOfExperience,
      consultationFee: payload.consultationFee,
    };
    const auth = await registerApi(req);
    storeSession(auth.token, auth.profileId);
    try {
      const me = await getMe();
      const mapped = mapUserToTherapist(me, loadCachedProfile());
      persist(mapped);
    } catch {
      persist({
        id: auth.profileId,
        fullName: req.fullName,
        email: auth.email,
        phone: req.phoneNumber ?? "",
        dob: req.dob ?? "",
        specialization: req.specialization ?? "",
        bio: req.bio ?? "",
        yearsOfExperience: req.yearsOfExperience ?? 0,
        consultationFee: req.consultationFee ?? 0,
        licenseNumber: payload.licenseNumber ?? "",
        licenseAuthority: payload.licenseAuthority ?? "",
        licenseExpiresAt: payload.licenseExpiresAt ?? "",
        status: "PENDING_LICENSE_VERIFICATION",
        languages: payload.languages ?? ["vi", "en"],
      });
    }
  };

  const setStatus = (status: TherapistStatus) => {
    if (!user) return;
    persist({ ...user, status });
  };

  const updateUser = (patch: Partial<TherapistProfile>) => {
    if (!user) return;
    persist({ ...user, ...patch });
  };

  React.useEffect(() => {
    if (!user && getStoredProfileId()) {
      // token present but profile missing — refreshUser will handle on mount
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        register,
        setStatus,
        refreshUser,
        updateUser,
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
