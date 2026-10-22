import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, SESSION_EXPIRED_EVENT, unwrap } from "./api";
import type { AuthUser, RegisterInput } from "./types";

function normalizeUser(body: unknown): AuthUser | null {
  const data = unwrap<Record<string, unknown> | null>(body);
  if (!data || typeof data !== "object") return null;
  const user = (data.user ?? data) as Record<string, unknown>;
  if (typeof user.email !== "string") return null;
  return {
    id: user.id as AuthUser["id"],
    name: typeof user.name === "string" ? user.name : undefined,
    email: user.email,
    role: typeof user.role === "string" ? user.role : undefined,
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the initial session restore attempt finishes. */
  initializing: boolean;
  sessionExpiredMessage: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  clearSessionExpiredMessage: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function isAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "super_admin" || r === "superadmin";
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    return normalizeUser(await apiFetch("/api/auth/session", { retryOn401: false }));
  } catch {
    // A missing or expired session is an anonymous user.
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Keep the server and first browser render identical. The cookie session is
  // restored after hydration by refreshUser; localStorage is not authoritative.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const persist = useCallback((next: AuthUser | null) => {
    setUser(next);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const current = await fetchCurrentUser();
    persist(current);
    return current;
  }, [persist]);

  useEffect(() => {
    void refreshUser().finally(() => setInitializing(false));
  }, [refreshUser]);

  useEffect(() => {
    const onExpired = () => {
      persist(null);
      setSessionExpiredMessage("Your session expired. Please sign in again.");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [persist]);

  const login = useCallback(
    async (email: string, password: string) => {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
        retryOn401: false,
      });
      // Only expose authenticated state after verifying that the browser sent
      // the session cookie back successfully.
      const confirmed = await fetchCurrentUser();
      if (!confirmed) {
        throw new Error("Login succeeded, but the session could not be verified. Please sign in again.");
      }
      persist(confirmed);
      return confirmed;
    },
    [persist],
  );

  const register = useCallback(async (input: RegisterInput) => {
    await apiFetch("/api/auth/register", { method: "POST", body: input, retryOn401: false });
  }, []);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    await apiFetch("/api/auth/verify-email", {
      method: "POST",
      body: { email, otp },
      retryOn401: false,
    });
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await apiFetch("/api/auth/resend-otp", { method: "POST", body: { email }, retryOn401: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", retryOn401: false });
    } finally {
      persist(null);
    }
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      sessionExpiredMessage,
      login,
      register,
      verifyEmail,
      resendOtp,
      logout,
      refreshUser,
      clearSessionExpiredMessage: () => setSessionExpiredMessage(null),
      isAdmin: isAdminRole(user?.role),
    }),
    [
      user,
      initializing,
      sessionExpiredMessage,
      login,
      register,
      verifyEmail,
      resendOtp,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
