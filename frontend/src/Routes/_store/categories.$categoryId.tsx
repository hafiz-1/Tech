import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { listCategories, listProducts } from "@/lib/endpoints";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/_store/categories/$categoryId")({
  head: () => ({
    meta: [
      { title: "Category — TechCart" },
      { name: "description", content: "Browse TechCart products in this category." },
      { property: "og:title", content: "Category — TechCart" },
      { property: "og:description", content: "Browse TechCart products in this category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useParams();
  const [page, setPage] = useState(1);

  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const category = (categories.data ?? []).find((c) => String(c.id) === categoryId);

  const products = useQuery({
    queryKey: ["products", "category", categoryId, page],
    queryFn: () => listProducts({ page, limit: PAGE_SIZE, sort: "newest", categoryId: Number(categoryId) }),
  });

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" /> Home
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{category?.name ?? "Category"}</h1>
        {category?.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        ) : null}
      </div>

      {products.isLoading ? (
        <LoadingState label="Loading products…" />
      ) : products.isError ? (
        <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
      ) : !products.data || products.data.items.length === 0 ? (
        <EmptyState title="No products in this category" />
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
