import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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

  const product = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
  });

  const activeVariants = useMemo(
    () => (product.data?.variants ?? []).filter((v) => v.isActive !== false),
    [product.data],
  );
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
  const image = p.images?.[0];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted">
        {image ? (
          <img src={image} alt={p.name} className="h-full w-full rounded-xl object-cover" />
        ) : (
          <span className="text-6xl font-bold text-muted-foreground/40" aria-hidden>
            {p.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">
            {[p.category?.name, p.brand?.name].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{p.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary">
            {formatPKR(selectedVariant?.sellingPrice ?? p.price)}
          </span>
          <Badge variant={available ? "default" : "secondary"}>
            {available ? "Available" : "Out of Stock"}
          </Badge>
        </div>

        {activeVariants.length > 0 ? (
          <div className="max-w-xs space-y-1">
            <Label htmlFor="variant-select">Variant</Label>
            <Select
              value={selectedVariant ? String(selectedVariant.id) : undefined}
              onValueChange={setSelectedVariantId}
            >
              <SelectTrigger id="variant-select">
                <SelectValue placeholder="Choose a variant" />
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
          </div>
        ) : null}

        <Button
          size="lg"
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
          {addToCart.isPending ? "Adding…" : "Add to cart"}
        </Button>

        {p.description ? (
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="mb-1 font-semibold">
              Description
            </h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{p.description}</p>
          </section>
        ) : null}

        {p.specifications && Object.keys(p.specifications).length > 0 ? (
          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="mb-1 font-semibold">
              Specifications
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {Object.entries(p.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-border py-1">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
