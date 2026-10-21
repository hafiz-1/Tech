import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { ProductCard } from "@/components/store/ProductCard";
import { listBrands, listCategories, listProducts } from "@/lib/endpoints";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "TechCart — Tech retail in Pakistan" },
      {
        name: "description",
        content:
          "Shop mobiles, laptops and accessories at TechCart. Browse categories and brands, with prices in PKR.",
      },
      { property: "og:title", content: "TechCart — Tech retail in Pakistan" },
      {
        property: "og:description",
        content: "Shop mobiles, laptops and accessories at TechCart, with prices in PKR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const products = useQuery({
    queryKey: ["products", "home"],
    queryFn: () => listProducts({ page: 1, limit: 8, sort: "newest" }),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  return (
    <div className="space-y-12">
      <section className="rounded-xl bg-primary px-6 py-16 text-center text-primary-foreground">
        <h1 className="text-3xl font-bold sm:text-4xl">Tech, delivered across Pakistan</h1>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Mobiles, laptops and accessories with transparent PKR pricing and city-based shipping.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link to="/products">
            Browse products <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-4 text-xl font-semibold">
          Shop by category
        </h2>
        {categories.isLoading ? (
          <LoadingState label="Loading categories…" />
        ) : categories.isError ? (
          <ErrorState message={categories.error.message} onRetry={() => categories.refetch()} />
        ) : !categories.data || categories.data.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.data.map((c) => (
              <Button key={c.id} asChild variant="outline">
                <Link to="/categories/$categoryId" params={{ categoryId: String(c.id) }}>
                  {c.name}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="products-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="products-heading" className="text-xl font-semibold">
            Newest products
          </h2>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {products.isLoading ? (
          <LoadingState label="Loading products…" />
        ) : products.isError ? (
          <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
        ) : !products.data || products.data.items.length === 0 ? (
          <EmptyState title="No products yet" hint="Check back soon." />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="brands-heading">
        <h2 id="brands-heading" className="mb-4 text-xl font-semibold">
          Shop by brand
        </h2>
        {brands.isLoading ? (
          <LoadingState label="Loading brands…" />
        ) : brands.isError ? (
          <ErrorState message={brands.error.message} onRetry={() => brands.refetch()} />
        ) : !brands.data || brands.data.length === 0 ? (
          <EmptyState title="No brands yet" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {brands.data.map((b) => (
              <Button key={b.id} asChild variant="outline">
                <Link to="/brands/$brandId" params={{ brandId: String(b.id) }}>
                  {b.name}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
