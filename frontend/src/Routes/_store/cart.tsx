import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
          (sum, item) => sum + Number(item.lineTotal ?? (item.unitPrice ?? item.variant?.sellingPrice ?? 0) * item.quantity),
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
        title="Sign in to view your cart"
        hint="Your cart is tied to your TechCart account."
      />
    );
  }
  if (cart.isLoading) return <LoadingState label="Loading cart…" />;
  if (cart.isError) return <ErrorState message={cart.error.message} onRetry={() => cart.refetch()} />;

  const items = cart.data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState title="Your cart is empty" hint="Browse products and add something you like." />
        <div className="flex justify-center">
          <Button asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const busy = updateQty.isPending || removeItem.isPending || clear.isPending;
  const fallbackTotal = items.reduce(
    (sum, item) => sum + (item.lineTotal ?? (item.unitPrice ?? item.variant?.sellingPrice ?? 0) * item.quantity),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your cart</h1>
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
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const name = item.product?.name ?? item.variant?.sku ?? `Item #${item.id}`;
          const unit = item.unitPrice ?? item.variant?.sellingPrice;
          return (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">{formatPKR(unit)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Decrease quantity"
                    disabled={busy || item.quantity <= 1}
                    onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center" aria-live="polite">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Increase quantity"
                    disabled={busy}
                    onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${name}`}
                    disabled={busy}
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <p className="w-28 text-right font-semibold">
                  {formatPKR(item.lineTotal ?? (unit != null ? unit * item.quantity : null))}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="space-y-1 text-sm">
            {cart.data?.subtotal != null ? (
              <p className="text-muted-foreground">Subtotal: {formatPKR(cart.data.subtotal)}</p>
            ) : null}
            {cart.data?.shippingFee != null ? (
              <p className="text-muted-foreground">Shipping: {formatPKR(cart.data.shippingFee)}</p>
            ) : null}
            <p className="text-lg font-bold">Total: {formatPKR(cart.data?.total ?? fallbackTotal)}</p>
          </div>
          <Button size="lg" onClick={() => void navigate({ to: "/checkout" })}>
            Proceed to checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
