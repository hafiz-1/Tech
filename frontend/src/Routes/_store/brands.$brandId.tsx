import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { EmptyState, ErrorState, ProductGridSkeleton } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { listBrands, listProducts } from "@/lib/endpoints";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/_store/brands/$brandId")({
  head: () => ({
    meta: [
      { title: "Brand — TechCart" },
      { name: "description", content: "Browse TechCart products from this brand." },
      { property: "og:title", content: "Brand — TechCart" },
      { property: "og:description", content: "Browse TechCart products from this brand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrandPage,
});

function BrandPage() {
  const { brandId } = Route.useParams();
  const [page, setPage] = useState(1);

  const brands = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const brand = (brands.data ?? []).find((b) => String(b.id) === brandId);

  const products = useQuery({
    queryKey: ["products", "brand", brandId, page],
    queryFn: () => listProducts({ page, limit: PAGE_SIZE, sort: "newest", brandId: Number(brandId) }),
  });

  return (
    <div className="space-y-7">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3 h-8 gap-1.5 px-2">
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All products
          </Link>
        </Button>
        <div className="flex items-start gap-4">
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted font-display text-xl font-bold text-muted-foreground sm:flex">
            {(brand?.name ?? "B").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Brand</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{brand?.name ?? "Brand"}</h1>
            {brand?.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {brand.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {products.isLoading ? (
        <ProductGridSkeleton count={PAGE_SIZE} />
      ) : products.isError ? (
        <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
      ) : !products.data || products.data.items.length === 0 ? (
        <EmptyState
          title="No products from this brand"
          hint="Try another brand or browse the full catalog."
          action={
            <Button asChild variant="outline">
              <Link to="/products">Browse all products</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <PaginationControls page={page} limit={PAGE_SIZE} total={products.data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
