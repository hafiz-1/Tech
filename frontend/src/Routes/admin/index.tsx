import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Boxes,
  Package,
  ShoppingBag,
  Tags,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  adminListPurchaseOrders,
  adminListStock,
  adminListSuppliers,
  listBrands,
  listCategories,
  listProducts,
} from "@/lib/endpoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — TechCart" },
      { name: "description", content: "TechCart admin overview." },
      { property: "og:title", content: "Admin dashboard — TechCart" },
      { property: "og:description", content: "TechCart admin overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const products = useQuery({
    queryKey: ["products", "admin-count"],
    queryFn: () => listProducts({ page: 1, limit: 1 }),
  });
  const suppliers = useQuery({ queryKey: ["admin", "suppliers"], queryFn: () => adminListSuppliers() });
  const purchaseOrders = useQuery({
    queryKey: ["admin", "purchase-orders", 1],
    queryFn: () => adminListPurchaseOrders({ page: 1, limit: 1 }),
  });
  const stock = useQuery({ queryKey: ["admin", "stock", 1], queryFn: () => adminListStock(1, 1) });

  const stats: Array<{
    label: string;
    value: number | undefined;
    to: string;
    icon: LucideIcon;
    tone: string;
    loading: boolean;
  }> = [
    {
      label: "Categories",
      value: categories.data?.length,
      to: "/admin/categories",
      icon: Tags,
      tone: "bg-primary/10 text-primary",
      loading: categories.isLoading,
    },
    {
      label: "Brands",
      value: brands.data?.length,
      to: "/admin/brands",
      icon: ShoppingBag,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      loading: brands.isLoading,
    },
    {
      label: "Products",
      value: products.data?.total,
      to: "/admin/products",
      icon: Package,
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      loading: products.isLoading,
    },
    {
      label: "Suppliers",
      value: suppliers.data?.length,
      to: "/admin/suppliers",
      icon: Users,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      loading: suppliers.isLoading,
    },
    {
      label: "Purchase orders",
      value: purchaseOrders.data?.total,
      to: "/admin/purchase-orders",
      icon: Truck,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      loading: purchaseOrders.isLoading,
    },
    {
      label: "Stocked variants",
      value: stock.data?.total,
      to: "/admin/inventory",
      icon: Boxes,
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      loading: stock.isLoading,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Overview</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Catalog and operations at a glance. Select a card to manage that area.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="group">
            <Card className="h-full p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.tone)}>
                  <stat.icon className="h-5 w-5" aria-hidden />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              {stat.loading ? (
                <div className="skeleton mt-2 h-8 w-16 rounded-md" aria-hidden />
              ) : (
                <p className="mt-1 font-display text-2xl font-bold">{stat.value ?? "—"}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div>
          <h2 className="font-display text-base font-semibold">Need to restock?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a purchase order or review current inventory levels.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/purchase-orders"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Purchase orders
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/admin/inventory"
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Inventory
          </Link>
        </div>
      </Card>
    </div>
  );
}
