import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { adminFetch, AdminApiError, AUTH_API_BASE } from "./admin-api";

export interface AdminUser {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
}

/** Data returned from POST /api/auth/login on success. */
export interface LoginOtpData {
  otpRequired: boolean;
  adminId: number;
  email: string;
}

interface AdminAuthState {
  user: AdminUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<LoginOtpData>;
  verifyOtp: (adminId: number, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AdminAuthState["status"]>("loading");

  /** Check existing PHP session via GET /api/auth/me. */
  const loadMe = async () => {
    try {
      const me = await adminFetch<AdminUser>(`${AUTH_API_BASE}/me`, {
        method: "GET",
      });
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    void loadMe();
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({
      user,
      status,

      async login(email, password) {
        // POST /api/auth/login → returns { otpRequired, adminId, email }
        const data = await adminFetch<LoginOtpData>(`${AUTH_API_BASE}/login`, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        // Do NOT set user or navigate — caller must show OTP form.
        return data;
      },

      async verifyOtp(adminId, otp) {
        // POST /api/auth/verify-otp → backend creates PHP session
        await adminFetch(`${AUTH_API_BASE}/verify-otp`, {
          method: "POST",
          body: JSON.stringify({ adminId, otp }),
        });
        // Session is now established — fetch current user.
        await loadMe();
      },

      async logout() {
        try {
          await adminFetch(`${AUTH_API_BASE}/logout`, { method: "POST" });
        } catch {
          /* ignore */
        }
        setUser(null);
        setStatus("unauthenticated");
      },

      refresh: loadMe,
    }),
    [user, status],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
