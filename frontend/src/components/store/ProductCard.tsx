import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { addCartItem } from "@/lib/endpoints";
import { availabilityLabel, displayPrice, formatPKR } from "@/lib/format";
import type { Product } from "@/lib/types";

export function AvailabilityBadge({ product }: { product: Product }) {
  const available = availabilityLabel(product) === "Available";
  return (
    <Badge variant={available ? "success" : "secondary"}>
      {available ? "Available" : "Out of Stock"}
    </Badge>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const variants = useMemo(
    () => (product.variants ?? []).filter((variant) => variant.isActive !== false),
    [product.variants],
  );
  const availableVariants = variants.filter((variant) => availabilityLabel(variant) === "Available");
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const selectedVariant =
    variants.find((variant) => String(variant.id) === selectedVariantId) ??
    availableVariants[0] ??
    variants[0] ??
    null;
  const price = selectedVariant?.sellingPrice ?? displayPrice(product);
  const image = product.images?.[0];

  const addToCart = useMutation({
    mutationFn: (variantId: number) => addCartItem(variantId, 1),
    onSuccess: () => {
      toast.success(`${product.name} added to cart`);
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.status === 401) {
        void navigate({ to: "/account/login", search: { redirect: "/" } });
        return;
      }
      toast.error(error.message);
    },
  });

  const available = selectedVariant ? availabilityLabel(selectedVariant) === "Available" : false;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/70 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="relative block overflow-hidden"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <div className="absolute inset-0 flex items-center justify-center bg-grid" aria-hidden>
            <span className="font-display text-5xl font-bold text-muted-foreground/30">
              {product.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="relative h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          {!available ? (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-xs backdrop-blur">
              Out of stock
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {[product.category?.name, product.brand?.name].filter(Boolean).join(" · ") ||
              "TechCart product"}
          </p>
          <Link
            to="/products/$productId"
            params={{ productId: String(product.id) }}
            className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="line-clamp-2 min-h-8 text-xs leading-relaxed text-muted-foreground">
            {product.description?.trim() || "View product details and specifications."}
          </p>
        </div>

        {variants.length > 1 ? (
          <Select
            value={selectedVariant ? String(selectedVariant.id) : undefined}
            onValueChange={setSelectedVariantId}
          >
            <SelectTrigger aria-label={`Choose ${product.name} variant`} className="h-8 text-xs">
              <SelectValue placeholder="Choose variant" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => {
                const specs = Object.values(variant.specifications ?? {}).join(" / ");
                const optionLabel = [
                  specs,
                  variant.sku,
                  availabilityLabel(variant) === "Available" ? "Available" : "Out of stock",
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <SelectItem key={variant.id} value={String(variant.id)}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : null}

        <div className="mt-auto space-y-3 pt-1">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Price
              </span>
              <span className="font-display text-base font-bold text-foreground">{formatPKR(price)}</span>
            </div>
            <Badge variant={available ? "success" : "secondary"} className="mb-0.5">
              {available ? "Available" : "Out of Stock"}
            </Badge>
          </div>

          <Button
            type="button"
            className="w-full"
            variant={available ? "default" : "secondary"}
            disabled={!available || !selectedVariant || addToCart.isPending}
            onClick={() => {
              if (!user) {
                void navigate({ to: "/account/login", search: { redirect: `/products/${product.id}` } });
                return;
              }
              if (user.role !== "customer") {
                toast.error("Sign in with a customer account to add items to your cart.");
                return;
              }
              addToCart.mutate(selectedVariant.id);
            }}
          >
            {addToCart.isPending ? (
              "Adding…"
            ) : available ? (
              <>
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Add to cart
              </>
            ) : (
              "Out of stock"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
