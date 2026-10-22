import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/StatusState";
import { Button } from "@/components/ui/button";
import { isAdminRole, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/brands", label: "Brands", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/suppliers", label: "Suppliers", icon: Users },
  { to: "/admin/purchase-orders", label: "Purchase orders", icon: Truck },
  { to: "/admin/shipping-rates", label: "Shipping rates", icon: Truck },
] as const;

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AdminLayout() {
  const { user, initializing, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // The browser cannot read the httpOnly cookie or prove the role by itself,
  // so re-verify the session and role against the backend on entry.
  useEffect(() => {
    if (initializing) return;
    let cancelled = false;
    void refreshUser().then((fresh) => {
      if (cancelled) return;
      if (!fresh || !isAdminRole(fresh.role)) {
        void navigate({ to: "/admin/login" });
      } else {
        setVerified(true);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing]);

  if (initializing || !verified || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <LoadingState label="Verifying admin access…" />
      </div>
    );
  }

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      void navigate({ to: "/admin/login" });
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = user.name?.trim() || user.email;
  const navClass =
    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&[data-status=active]]:bg-primary [&[data-status=active]]:text-primary-foreground [&[data-status=active]]:shadow-soft";

  return (
    <div className="min-h-screen bg-muted/30">
      <a
        href="#admin-content"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Skip to content
      </a>

      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/70 bg-card md:flex">
          <div className="border-b border-border/70 p-4">
            <Link to="/admin" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-soft">
                <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="font-display text-base font-bold tracking-tight">
                Tech<span className="text-primary">Cart</span>
                <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Manage
            </p>
            {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
              <Link
                key={to}
                to={to}
                {...("exact" in rest ? { activeOptions: { exact: true } } : {})}
                className={navClass}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>

          <div className="space-y-2 border-t border-border/70 p-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {initialsOf(displayName) || <Users className="h-4 w-4" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{displayName}</p>
                <p className="truncate text-[10px] capitalize text-muted-foreground">
                  {user.role ?? "admin"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout} disabled={signingOut}>
              <LogOut className="h-4 w-4" aria-hidden />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link to="/">
                <Store className="h-4 w-4" aria-hidden />
                View storefront
              </Link>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-display text-sm font-bold">TechCart Admin</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} disabled={signingOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" aria-hidden />
            </Button>
          </header>

          <nav
            className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border/70 bg-card px-3 py-2 md:hidden"
            aria-label="Admin mobile"
          >
            {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
              <Link
                key={to}
                to={to}
                {...("exact" in rest ? { activeOptions: { exact: true } } : {})}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground [&[data-status=active]]:bg-primary [&[data-status=active]]:text-primary-foreground"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>

          <main id="admin-content" className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
