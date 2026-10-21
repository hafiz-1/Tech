import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import { ProductCard } from "@/components/store/ProductCard";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{brand?.name ?? "Brand"}</h1>
        {brand?.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{brand.description}</p>
        ) : null}
      </div>

      {products.isLoading ? (
        <LoadingState label="Loading products…" />
      ) : products.isError ? (
        <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
      ) : !products.data || products.data.items.length === 0 ? (
        <EmptyState title="No products from this brand" />
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
