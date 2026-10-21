import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Package, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { isAdminRole, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function StoreHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      void navigate({ to: "/" });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          Tech<span className="text-primary">Cart</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Main">
          <Link to="/" className="text-foreground hover:text-primary">
            Home
          </Link>
          <Link to="/products" className="text-foreground hover:text-primary">
            Products
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user && isAdminRole(user.role) ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/admin" aria-label="Admin dashboard">
                <LayoutDashboard className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Admin dashboard</span>
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="mr-1 h-4 w-4" /> Cart
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/account/orders">
                  <Package className="mr-1 h-4 w-4" /> Orders
                </Link>
              </Button>
              <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                <User className="h-4 w-4" /> {user.name ?? user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={signingOut}>
                <LogOut className="mr-1 h-4 w-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/account/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          <span className="font-semibold text-foreground">TechCart</span> — tech retail, Pakistan.
        </p>
        <p>Prices in PKR. Payment is collected outside this demo checkout.</p>
      </div>
    </footer>
  );
}
