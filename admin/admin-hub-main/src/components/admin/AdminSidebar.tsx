import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Layers,
  Tag,
  Users,
  MessageSquareQuote,
  FileText,
  Image as ImageIcon,
  BarChart3,
  LineChart,
  Settings,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Catalog",
    items: [
      { label: "Products", to: "/admin/products", icon: Package },
      { label: "Categories", to: "/admin/categories", icon: FolderTree },
      { label: "Subcategories", to: "/admin/subcategories", icon: Layers },
      { label: "Brands", to: "/admin/brands", icon: Tag },
    ],
  },
  {
    section: "Sales",
    items: [
      { label: "Orders", to: "/admin/orders", icon: ShoppingBag },
      { label: "Customers", to: "/admin/customers", icon: Users },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Banners", to: "/admin/banners", icon: ImageIcon },
      { label: "CMS Pages", to: "/admin/cms", icon: FileText },
      { label: "Testimonials", to: "/admin/testimonials", icon: MessageSquareQuote },
    ],
  },
  {
    section: "Insights",
    items: [
      { label: "Reports", to: "/admin/reports", icon: BarChart3 },
      { label: "Analytics", to: "/admin/analytics", icon: LineChart },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Settings", to: "/admin/settings", icon: Settings },
      { label: "Profile", to: "/admin/profile", icon: UserCircle },
    ],
  },
];

export function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="grid h-8 w-8 place-items-center bg-foreground text-background font-bold">
          A
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold uppercase tracking-widest">Allstag</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Admin
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.section}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(`${item.to}/`);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-foreground text-background font-medium"
                          : "text-foreground/80 hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
