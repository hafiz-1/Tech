import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Truck,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { isAdminRole, useAuth } from "@/lib/auth";
import { getCart } from "@/lib/endpoints";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-soft">
        <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Tech<span className="text-primary">Cart</span>
      </span>
    </span>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
    </Button>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function StoreHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: !!user });
  const cartCount = cart.data?.items?.reduce((total, item) => total + (item.quantity ?? 0), 0) ?? 0;
  const displayName = user?.name?.trim() || user?.email || "";

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      setMenuOpen(false);
      void navigate({ to: "/" });
    } finally {
      setSigningOut(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    setMenuOpen(false);
    void navigate({ to: "/products", search: term ? { search: term } : {} });
  };

  const navLinkClass =
    "relative py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100 [&[data-status=active]]:text-foreground [&[data-status=active]]:after:scale-x-100";

  return (
    <>
      <div className="border-b border-border/60 bg-foreground text-background">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-center text-[11px] font-medium tracking-wide sm:text-xs">
          <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            Free delivery over PKR 50,000 · Cash on delivery available across Pakistan
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Link to="/" className="shrink-0 transition-transform hover:scale-[1.02]">
            <BrandMark />
          </Link>

          <nav className="ml-4 hidden items-center gap-7 md:flex" aria-label="Main">
            <Link to="/" activeOptions={{ exact: true }} className={navLinkClass}>
              Home
            </Link>
            <Link to="/products" className={navLinkClass}>
              Products
            </Link>
            {user ? (
              <Link to="/account/orders" className={navLinkClass}>
                Orders
              </Link>
            ) : null}
          </nav>

          <form onSubmit={handleSearch} className="ml-auto hidden max-w-xs flex-1 lg:block" role="search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="h-9 bg-muted/60 pl-9"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            {user && isAdminRole(user.role) ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/admin" aria-label="Admin dashboard">
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              </Button>
            ) : null}

            <ThemeToggle className="hidden sm:inline-flex" />

            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Cart">
              <Link to="/cart">
                <ShoppingCart className="h-[18px] w-[18px]" aria-hidden />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </Button>

            {user ? (
              <div className="hidden items-center gap-1 sm:flex">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/account/orders">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {initialsOf(displayName) || <User className="h-3.5 w-3.5" aria-hidden />}
                    </span>
                    <span className="hidden max-w-24 truncate md:inline">{displayName.split("@")[0]}</span>
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={signingOut}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-[18px] w-[18px]" aria-hidden />
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/account/login">
                  Sign in
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div id="mobile-menu" className="border-t border-border/70 bg-background px-4 pb-6 pt-4 md:hidden">
            <form onSubmit={handleSearch} role="search" className="mb-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="pl-9"
                />
              </div>
            </form>

            <nav className="grid gap-1" aria-label="Mobile">
              {[
                { to: "/", label: "Home" },
                { to: "/products", label: "Products" },
                ...(user ? [{ to: "/account/orders", label: "My orders" }] : []),
                ...(user && isAdminRole(user.role) ? [{ to: "/admin", label: "Admin dashboard" }] : []),
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Link>
              ))}
            </nav>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </Button>
              {user ? (
                <Button type="button" variant="ghost" size="sm" onClick={handleLogout} disabled={signingOut}>
                  <LogOut className="h-4 w-4" aria-hidden />
                  {signingOut ? "Signing out…" : "Sign out"}
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/account/login">
                    Sign in
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}

export function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border/70 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandMark />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Mobiles, laptops and accessories with transparent PKR pricing and city-based shipping
              across Pakistan.
            </p>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Package className="h-3.5 w-3.5 text-primary" aria-hidden />
              Prices in PKR
            </p>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Shop</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { to: "/products", label: "All products" },
                { to: "/cart", label: "Your cart" },
                { to: "/account/orders", label: "Order tracking" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Account</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { to: "/account/login", label: "Sign in" },
                { to: "/account/register", label: "Create account" },
                { to: "/admin/login", label: "Admin portal" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">Why TechCart</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Nationwide delivery with city-based rates
              </li>
              <li className="flex items-start gap-2">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Genuine stock, reserved the moment you order
              </li>
              <li className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Real support from a team that knows tech
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} TechCart. All rights reserved.</p>
          <p>Payment is collected outside this demo checkout.</p>
        </div>
      </div>
    </footer>
  );
}
