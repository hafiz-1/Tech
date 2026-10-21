import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import { ProductCard } from "@/components/store/ProductCard";
import { listBrands, listCategories, listProducts } from "@/lib/endpoints";
import type { ProductSort } from "@/lib/types";

const PAGE_SIZE = 12;

type ProductsSearch = {
  page?: number;
  sort?: ProductSort;
  search?: string;
  categoryId?: number;
  brandId?: number;
};

export const Route = createFileRoute("/_store/products")({
  validateSearch: (search: Record<string, unknown>): ProductsSearch => ({
    page: Number(search.page) > 0 ? Number(search.page) : 1,
    sort: typeof search.sort === "string" ? (search.sort as ProductSort) : "newest",
    search: typeof search.search === "string" && search.search ? search.search : undefined,
    categoryId: Number(search.categoryId) > 0 ? Number(search.categoryId) : undefined,
    brandId: Number(search.brandId) > 0 ? Number(search.brandId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Products — TechCart" },
      { name: "description", content: "Browse all TechCart products with filters, sorting and PKR pricing." },
      { property: "og:title", content: "Products — TechCart" },
      { property: "og:description", content: "Browse all TechCart products with filters, sorting and PKR pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [searchInput, setSearchInput] = useState(search.search ?? "");

  const products = useQuery({
    queryKey: ["products", search],
    queryFn: () =>
      listProducts({
        page: search.page,
        limit: PAGE_SIZE,
        sort: search.sort,
        search: search.search,
        categoryId: search.categoryId,
        brandId: search.brandId,
      }),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  const setSearch = (patch: Partial<ProductsSearch>) =>
    void navigate({ search: (prev: ProductsSearch) => ({ ...prev, page: 1, ...patch }) });

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch({ search: searchInput || undefined });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      <form onSubmit={applySearch} className="flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-48 flex-1">
          <Label htmlFor="product-search">Search</Label>
          <Input
            id="product-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
          />
        </div>
        <div>
          <Label htmlFor="category-filter">Category</Label>
          <Select
            value={search.categoryId ? String(search.categoryId) : "all"}
            onValueChange={(v) => setSearch({ categoryId: v === "all" ? undefined : Number(v) })}
          >
            <SelectTrigger id="category-filter" className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="brand-filter">Brand</Label>
          <Select
            value={search.brandId ? String(search.brandId) : "all"}
            onValueChange={(v) => setSearch({ brandId: v === "all" ? undefined : Number(v) })}
          >
            <SelectTrigger id="brand-filter" className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(brands.data ?? []).map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sort-select">Sort</Label>
          <Select value={search.sort} onValueChange={(v) => setSearch({ sort: v as ProductSort })}>
            <SelectTrigger id="sort-select" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
              <SelectItem value="name_asc">Name: A–Z</SelectItem>
              <SelectItem value="name_desc">Name: Z–A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Search</Button>
      </form>

      {products.isLoading ? (
        <LoadingState label="Loading products…" />
      ) : products.isError ? (
        <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
      ) : !products.data || products.data.items.length === 0 ? (
        <EmptyState title="No products found" hint="Try a different search or filter." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <PaginationControls
            page={search.page ?? 1}
            limit={PAGE_SIZE}
            total={products.data.total}
            onPageChange={(page) => void navigate({ search: (prev: ProductsSearch) => ({ ...prev, page }) })}
          />
        </>
      )}
    </div>
  );
}
