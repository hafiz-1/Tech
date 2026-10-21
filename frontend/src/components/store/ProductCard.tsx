import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { addCartItem } from "@/lib/endpoints";
import { availabilityLabel, displayPrice, formatPKR } from "@/lib/format";
import type { Product } from "@/lib/types";

export function AvailabilityBadge({ product }: { product: Product }) {
  const available = availabilityLabel(product) === "Available";
  return <Badge variant={available ? "default" : "secondary"}>{available ? "Available" : "Out of Stock"}</Badge>;
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
    <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="group block"
        aria-label={`View ${product.name}`}
      >
        <div className="flex aspect-square items-center justify-center bg-muted">
          {image ? (
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-muted-foreground/40" aria-hidden>
              {product.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      </Link>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <Link
            to="/products/$productId"
            params={{ productId: String(product.id) }}
            className="line-clamp-1 font-semibold text-foreground hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {[product.category?.name, product.brand?.name].filter(Boolean).join(" · ") || "TechCart product"}
          </p>
          <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
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
                const optionLabel = [specs, variant.sku, availabilityLabel(variant) === "Available" ? "Available" : "Out of stock"]
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

        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-primary">{formatPKR(price)}</span>
          <Badge variant={available ? "default" : "secondary"}>
            {available ? "Available" : "Out of Stock"}
          </Badge>
        </div>

        <Button
          type="button"
          className="w-full"
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
          {addToCart.isPending ? "Adding..." : available ? "Add to cart" : "Out of stock"}
        </Button>
      </CardContent>
    </Card>
  );
}
