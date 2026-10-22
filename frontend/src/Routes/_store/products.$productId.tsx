import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ImageOff,
  PackageCheck,
  ShoppingCart,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { addCartItem, getProduct } from "@/lib/endpoints";
import { availabilityLabel, formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/products/$productId")({
  head: () => ({
    meta: [
      { title: "Product — TechCart" },
      { name: "description", content: "Product details, variants and pricing at TechCart." },
      { property: "og:title", content: "Product — TechCart" },
      { property: "og:description", content: "Product details, variants and pricing at TechCart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const product = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
  });

  const activeVariants = (product.data?.variants ?? []).filter((v) => v.isActive !== false);
  const selectedVariant =
    activeVariants.find((v) => String(v.id) === selectedVariantId) ??
    activeVariants.find((variant) => availabilityLabel(variant) === "Available") ??
    activeVariants[0] ??
    null;

  const addToCart = useMutation({
    mutationFn: () => addCartItem(selectedVariant!.id, 1),
    onSuccess: () => {
      toast.success("Added to cart");
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void navigate({
          to: "/account/login",
          search: { redirect: `/products/${productId}` },
        });
        return;
      }
      toast.error(error.message);
    },
  });

  if (product.isLoading) return <LoadingState label="Loading product…" />;
  if (product.isError)
    return <ErrorState message={product.error.message} onRetry={() => product.refetch()} />;
  const p = product.data;
  if (!p) return <EmptyState title="Product not found" />;

  const available = availabilityLabel(selectedVariant ?? p) === "Available";
  const images = p.images ?? [];
  const currentImage = images[activeImage] ?? images[0];
  const specs = Object.entries(p.specifications ?? {});

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="-ml-3 h-8 gap-1.5 px-2">
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Products
          </Link>
        </Button>
        <span aria-hidden>/</span>
        {p.category ? (
          <>
            <Link to="/categories/$categoryId" params={{ categoryId: String(p.category.id) }} className="hover:text-primary">
              {p.category.name}
            </Link>
            <span aria-hidden>/</span>
          </>
        ) : null}
        <span className="truncate font-medium text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted">
            <div className="aspect-square">
              {currentImage ? (
                <img src={currentImage} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-grid">
                  <ImageOff className="h-12 w-12 text-muted-foreground/40" aria-hidden />
                  <span className="font-display text-5xl font-bold text-muted-foreground/30" aria-hidden>
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-5 gap-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeImage}
                  className={cn(
                    "aspect-square overflow-hidden rounded-xl border-2 bg-muted transition-colors",
                    index === activeImage ? "border-primary" : "border-transparent hover:border-border",
                  )}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {[p.category?.name, p.brand?.name].filter(Boolean).join(" · ") || "TechCart"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{p.name}</h1>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <span className="font-display text-3xl font-bold text-foreground">
              {formatPKR(selectedVariant?.sellingPrice ?? p.price)}
            </span>
            <Badge variant={available ? "success" : "secondary"} className="mb-1">
              {available ? "In stock" : "Out of stock"}
            </Badge>
            <span className="mb-1 text-xs text-muted-foreground">Prices in PKR</span>
          </div>

          {activeVariants.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="variant-select">Choose a variant</Label>
              <Select
                value={selectedVariant ? String(selectedVariant.id) : undefined}
                onValueChange={setSelectedVariantId}
              >
                <SelectTrigger id="variant-select" className="max-w-sm">
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  {activeVariants.map((v) => {
                    const spec = Object.values(v.specifications ?? {}).join(" / ");
                    return (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {spec ? `${spec} — ${v.sku}` : v.sku}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedVariant ? (
                <p className="text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              disabled={!available || !selectedVariant || addToCart.isPending}
              onClick={() => {
                if (!user) {
                  void navigate({
                    to: "/account/login",
                    search: { redirect: `/products/${productId}` },
                  });
                  return;
                }
                addToCart.mutate();
              }}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              {addToCart.isPending ? "Adding…" : available ? "Add to cart" : "Out of stock"}
            </Button>
            {!user ? (
              <Button asChild size="lg" variant="outline" className="sm:w-auto">
                <Link to="/account/login" search={{ redirect: `/products/${productId}` }}>
                  Sign in to buy
                </Link>
              </Button>
            ) : null}
          </div>

          <ul className="grid gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:grid-cols-3">
            {[
              { icon: Truck, label: "City-based delivery" },
              { icon: ShieldCheck, label: "Genuine product" },
              { icon: PackageCheck, label: "Stock reserved" },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>

          {p.description ? (
            <section aria-labelledby="description-heading" className="rounded-2xl border border-border/70 bg-card p-5">
              <h2 id="description-heading" className="font-display text-base font-semibold">
                Description
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </section>
          ) : null}

          {specs.length > 0 ? (
            <section aria-labelledby="specs-heading" className="rounded-2xl border border-border/70 bg-card p-5">
              <h2 id="specs-heading" className="font-display text-base font-semibold">
                Specifications
              </h2>
              <dl className="mt-3 divide-y divide-border/70">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="flex items-center gap-1.5 text-right font-medium">
                      <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
