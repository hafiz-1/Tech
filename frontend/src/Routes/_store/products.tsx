import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, ProductGridSkeleton } from "@/components/StatusState";
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
    setSearch({ search: searchInput.trim() || undefined });
  };

  const activeCategory = categories.data?.find((category) => category.id === search.categoryId);
  const activeBrand = brands.data?.find((brand) => brand.id === search.brandId);
  const hasFilters =
    Boolean(search.search) ||
    Boolean(search.categoryId) ||
    Boolean(search.brandId) ||
    (search.sort && search.sort !== "newest");

  const clearFilters = () => {
    setSearchInput("");
    void navigate({ search: {} });
  };

  const total = products.data?.total ?? 0;
  const page = search.page ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Catalog</p>
        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">All products</h1>
          {!products.isLoading && !products.isError ? (
            <p className="text-sm text-muted-foreground">
              {total === 0 ? "No results" : `${rangeStart}–${rangeEnd} of ${total} products`}
            </p>
          ) : null}
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        <form onSubmit={applySearch} className="space-y-4" role="search">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="product-search">Search</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="product-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for a phone, laptop, accessory…"
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit">Search</Button>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-border/70 pt-4">
            <div className="flex items-center gap-2 self-center text-sm font-medium text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-filter" className="text-xs text-muted-foreground">
                Category
              </Label>
              <Select
                value={search.categoryId ? String(search.categoryId) : "all"}
                onValueChange={(v) => setSearch({ categoryId: v === "all" ? undefined : Number(v) })}
              >
                <SelectTrigger id="category-filter" className="h-9 w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-filter" className="text-xs text-muted-foreground">
                Brand
              </Label>
              <Select
                value={search.brandId ? String(search.brandId) : "all"}
                onValueChange={(v) => setSearch({ brandId: v === "all" ? undefined : Number(v) })}
              >
                <SelectTrigger id="brand-filter" className="h-9 w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {(brands.data ?? []).map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort-select" className="text-xs text-muted-foreground">
                Sort by
              </Label>
              <Select value={search.sort} onValueChange={(v) => setSearch({ sort: v as ProductSort })}>
                <SelectTrigger id="sort-select" className="h-9 w-44">
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
            {hasFilters ? (
              <Button type="button" variant="ghost" size="sm" className="mb-0.5" onClick={clearFilters}>
                <X className="h-4 w-4" aria-hidden />
                Clear
              </Button>
            ) : null}
          </div>
        </form>

        {hasFilters ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
            <span className="text-xs text-muted-foreground">Active:</span>
            {search.search ? <FilterChip label={`“${search.search}”`} onClear={() => { setSearchInput(""); setSearch({ search: undefined }); }} /> : null}
            {activeCategory ? (
              <FilterChip label={activeCategory.name} onClear={() => setSearch({ categoryId: undefined })} />
            ) : null}
            {activeBrand ? (
              <FilterChip label={activeBrand.name} onClear={() => setSearch({ brandId: undefined })} />
            ) : null}
            {search.sort && search.sort !== "newest" ? (
              <FilterChip label={`Sorted: ${search.sort.replace("_", " ")}`} onClear={() => setSearch({ sort: "newest" })} />
            ) : null}
          </div>
        ) : null}
      </Card>

      {products.isLoading ? (
        <ProductGridSkeleton count={PAGE_SIZE} />
      ) : products.isError ? (
        <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
      ) : !products.data || products.data.items.length === 0 ? (
        <EmptyState
          title="No products found"
          hint="Try a different search term or clear your filters."
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <PaginationControls
            page={page}
            limit={PAGE_SIZE}
            total={products.data.total}
            onPageChange={(next) => void navigate({ search: (prev: ProductsSearch) => ({ ...prev, page: next }) })}
          />
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground transition-colors hover:border-primary/30"
    >
      {label}
      <X className="h-3 w-3" aria-hidden />
      <span className="sr-only">Remove filter</span>
    </button>
  );
}
