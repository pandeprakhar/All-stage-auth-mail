import { Bell, Search, Sun, Moon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminUser } from "@/lib/admin-auth";

export function AdminTopbar({ user }: { user: AdminUser | null }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const saved = window.localStorage.getItem("allstag_admin_theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("allstag_admin_theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search orders, products, customers…"
          className="h-10 w-full rounded-md border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-foreground/40 focus:bg-background"
        />
      </div>

      <button
        className="hidden md:inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background hover:bg-foreground/90"
        type="button"
      >
        <Plus className="h-4 w-4" /> Quick add
      </button>

      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="grid h-10 w-10 place-items-center rounded-md hover:bg-muted"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <button
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-muted"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      </button>

      <div className="flex items-center gap-2 border-l border-border pl-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold">
          {user?.name?.[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="hidden md:block leading-tight">
          <div className="text-sm font-medium">{user?.name ?? "Admin"}</div>
          <div className="text-xs text-muted-foreground">{user?.role ?? "Administrator"}</div>
        </div>
      </div>
    </header>
  );
}
