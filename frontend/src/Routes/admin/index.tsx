import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { adminListPurchaseOrders, adminListStock, adminListSuppliers, listBrands, listCategories, listProducts } from "@/lib/endpoints";

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
  const products = useQuery({ queryKey: ["products", "admin-count"], queryFn: () => listProducts({ page: 1, limit: 1 }) });
  const suppliers = useQuery({ queryKey: ["admin", "suppliers"], queryFn: () => adminListSuppliers() });
  const purchaseOrders = useQuery({ queryKey: ["admin", "purchase-orders", 1], queryFn: () => adminListPurchaseOrders({ page: 1, limit: 1 }) });
  const stock = useQuery({ queryKey: ["admin", "stock", 1], queryFn: () => adminListStock(1, 1) });

  const stats = [
    { label: "Categories", value: categories.data?.length, to: "/admin/categories" },
    { label: "Brands", value: brands.data?.length, to: "/admin/brands" },
    { label: "Products", value: products.data?.total, to: "/admin/products" },
    { label: "Suppliers", value: suppliers.data?.length, to: "/admin/suppliers" },
    { label: "Purchase orders", value: purchaseOrders.data?.total, to: "/admin/purchase-orders" },
    { label: "Stocked variants", value: stock.data?.total, to: "/admin/inventory" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value ?? "—"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
