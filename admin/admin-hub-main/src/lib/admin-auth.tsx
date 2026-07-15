import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { adminApi, clearAdminToken, getAdminToken, setAdminToken, AdminApiError } from "./admin-api";

export interface AdminUser {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
}

interface AdminAuthState {
  user: AdminUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AdminAuthState["status"]>("loading");

  const loadMe = async () => {
    const fakeUser: AdminUser = {
      id: 1,
      name: "Admin",
      email: "admin@allstag.com",
      role: "Super Admin",
    };

    setUser(fakeUser);
    setStatus("authenticated");
  };

  useEffect(() => {
    void loadMe();
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({
      user,
      status,
      async login(email, password, remember) {
        const fakeUser: AdminUser = {
          id: 1,
          name: "Admin",
          email: email,
          role: "Super Admin",
        };

        setAdminToken("demo-token", remember);
        setUser(fakeUser);
        setStatus("authenticated");
      },
      async logout() {
        try {
          await adminApi.post("/auth/logout");
        } catch {
          /* ignore */
        }
        clearAdminToken();
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
