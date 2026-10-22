import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { useAuth } from "@/lib/auth";
import { clearCart, getCart, removeCartItem, updateCartItem } from "@/lib/endpoints";
import { formatPKR } from "@/lib/format";

export const Route = createFileRoute("/_store/cart")({
  head: () => ({
    meta: [
      { title: "Cart — TechCart" },
      { name: "description", content: "Review your TechCart cart before checkout." },
      { property: "og:title", content: "Cart — TechCart" },
      { property: "og:description", content: "Review your TechCart cart before checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user, initializing } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: !!user });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["cart"] });

  const updateQty = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => updateCartItem(id, quantity),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<typeof cart.data>(["cart"]);
      if (previousCart) {
        const items = previousCart.items.map((item) => {
          if (item.id !== id) return item;
          const unitPrice = Number(item.unitPrice ?? item.variant?.sellingPrice ?? 0);
          return { ...item, quantity, lineTotal: unitPrice * quantity };
        });
        const subtotal = items.reduce(
          (sum, item) =>
            sum +
            Number(item.lineTotal ?? (item.unitPrice ?? item.variant?.sellingPrice ?? 0) * item.quantity),
          0,
        );
        queryClient.setQueryData(["cart"], {
          ...previousCart,
          items,
          total: subtotal + Number(previousCart.shippingFee ?? 0),
        });
      }
      return { previousCart };
    },
    onError: (error, _variables, context) => {
      if (context?.previousCart) queryClient.setQueryData(["cart"], context.previousCart);
      toast.error(error.message);
    },
    onSuccess: invalidate,
  });
  const removeItem = useMutation({
    mutationFn: (id: number) => removeCartItem(id),
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });
  const clear = useMutation({
    mutationFn: clearCart,
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  if (initializing) return <LoadingState />;
  if (!user) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Sign in to view your cart"
        hint="Your cart is tied to your TechCart account."
        action={
          <Button asChild>
            <Link to="/account/login">Sign in</Link>
          </Button>
        }
      />
    );
  }
  if (cart.isLoading) return <LoadingState label="Loading cart…" />;
  if (cart.isError) return <ErrorState message={cart.error.message} onRetry={() => cart.refetch()} />;

  const items = cart.data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        hint="Browse products and add something you like."
        action={
          <Button asChild>
            <Link to="/products">
              Browse products
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />
    );
  }

  const busy = updateQty.isPending || removeItem.isPending || clear.isPending;
  const fallbackTotal = items.reduce(
    (sum, item) =>
      sum + (item.lineTotal ?? (item.unitPrice ?? item.variant?.sellingPrice ?? 0) * item.quantity),
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Your bag</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold">
            Cart <span className="text-muted-foreground">({itemCount})</span>
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Remove all items from your cart?")) clear.mutate();
          }}
        >
          Clear cart
        </Button>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {items.map((item) => {
            const name = item.product?.name ?? item.variant?.sku ?? `Item #${item.id}`;
            const unit = item.unitPrice ?? item.variant?.sellingPrice;
            const image = item.product?.images?.[0];
            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
                    {image ? (
                      <img src={image} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-grid">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/40" aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold">{name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatPKR(unit)} each</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="success" className="text-[10px]">
                        In stock
                      </Badge>
                      {item.variant?.sku ? (
                        <span className="truncate text-[10px] text-muted-foreground">{item.variant.sku}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Decrease quantity"
                      disabled={busy || item.quantity <= 1}
                      onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium" aria-live="polite">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Increase quantity"
                      disabled={busy}
                      onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="w-24 text-right font-display text-sm font-bold">
                      {formatPKR(item.lineTotal ?? (unit != null ? unit * item.quantity : null))}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${name}`}
                      disabled={busy}
                      onClick={() => removeItem.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="lg:sticky lg:top-24">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-base font-semibold">Order summary</h2>
            <dl className="space-y-2.5 text-sm">
              {cart.data?.subtotal != null ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatPKR(cart.data.subtotal)}</dd>
                </div>
              ) : null}
              {cart.data?.shippingFee != null ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="font-medium">{formatPKR(cart.data.shippingFee)}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border pt-2.5 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-lg font-bold text-primary">
                  {formatPKR(cart.data?.total ?? fallbackTotal)}
                </dd>
              </div>
            </dl>
            <Button size="lg" className="w-full" onClick={() => void navigate({ to: "/checkout" })}>
              Proceed to checkout
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link to="/products">Continue shopping</Link>
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Payment is collected outside this demo checkout.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
