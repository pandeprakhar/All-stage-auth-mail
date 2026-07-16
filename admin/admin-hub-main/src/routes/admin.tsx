import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Allstag" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminShell />
      <Toaster position="top-right" richColors />
    </AdminAuthProvider>
  );
}

function AdminShell() {
  const { status, user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/admin/login";
  const isAuthRoute = isLoginRoute || pathname.startsWith("/admin/forgot-password");

  // Redirect to login when unauthenticated and not already there.
  useEffect(() => {
    if (status === "unauthenticated" && !isAuthRoute) {
      void navigate({ to: "/admin/login", replace: true });
    }
    if (status === "authenticated" && isAuthRoute) {
      void navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [status, isAuthRoute, navigate]);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Loading admin…</div>
      </div>
    );
  }

  // Auth routes (login/forgot password): render without shell.
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    );
  }

  if (status !== "authenticated") {
    // Redirect effect is in-flight
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar
        onLogout={() => {
          void logout().then(() => navigate({ to: "/admin/login", replace: true }));
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
