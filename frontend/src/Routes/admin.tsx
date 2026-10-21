import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Boxes, LayoutDashboard, LogOut, Package, ShoppingBag, Tags, Truck, Users } from "lucide-react";
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
  { to: "/admin/purchase-orders", label: "Purchase Orders", icon: Truck },
  { to: "/admin/shipping-rates", label: "Shipping Rates", icon: Truck },
] as const;

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
      <div className="flex min-h-screen items-center justify-center bg-background">
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

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-background">
        <div className="border-b border-border p-4">
          <Link to="/admin" className="text-lg font-bold">
            Tech<span className="text-primary">Cart</span> Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
          {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
            <Link
              key={to}
              to={to}
              {...("exact" in rest ? { activeOptions: { exact: true } } : {})}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border p-4">
          <p className="text-sm font-medium">{user.name ?? user.email}</p>
          <p className="text-xs text-muted-foreground">
            {user.email} · {user.role ?? "admin"}
          </p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout} disabled={signingOut}>
            <LogOut className="mr-1 h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/">View storefront</Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
