import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, MapPin, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { useAuth } from "@/lib/auth";
import { checkout, getCart } from "@/lib/endpoints";
import { formatDate, formatPKR } from "@/lib/format";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — TechCart" },
      { name: "description", content: "Enter delivery details to place a pending TechCart order." },
      { property: "og:title", content: "Checkout — TechCart" },
      { property: "og:description", content: "Enter delivery details to place a pending TechCart order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

const initialForm = {
  recipientName: "",
  contactNumber: "",
  address: "",
  city: "",
  postalCode: "",
};

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Cart", "Delivery", "Confirmation"];
  return (
    <ol className="flex items-center gap-2 text-xs font-medium text-muted-foreground" aria-label="Checkout progress">
      {steps.map((step, index) => {
        const number = (index + 1) as 1 | 2 | 3;
        const done = number < current;
        const active = number === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                active && "border-primary bg-primary text-primary-foreground",
                done && "border-primary/30 bg-primary/10 text-primary",
                !active && !done && "border-border",
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : number}
            </span>
            <span className={cn(active && "text-foreground", done && "text-primary")}>{step}</span>
            {index < steps.length - 1 ? <span className="mx-1 h-px w-6 bg-border" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function CheckoutPage() {
  const { user, initializing } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: !!user });

  const placeOrder = useMutation({
    mutationFn: () => checkout(form),
    onSuccess: (order) => {
      setPlacedOrder(order);
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (initializing || (user && cart.isLoading)) return <LoadingState label="Preparing checkout…" />;
  if (!user) {
    return (
      <EmptyState
        icon={User}
        title="Sign in to check out"
        hint="Your cart is tied to your TechCart account."
        action={
          <Button asChild>
            <Link to="/account/login">Sign in</Link>
          </Button>
        }
      />
    );
  }
  if (cart.isError) return <ErrorState message={cart.error.message} onRetry={() => cart.refetch()} />;

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="overflow-hidden">
          <div className="flex flex-col items-center gap-3 border-b border-border/70 bg-success/5 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/12">
              <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
            </span>
            <h1 className="font-display text-2xl font-bold">Order #{placedOrder.id} created</h1>
            <p className="text-sm text-muted-foreground">We've reserved your stock.</p>
          </div>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your order is <span className="font-semibold text-foreground">pending</span> and stock has
              been reserved. Payment is not handled in this demo checkout — please arrange payment with
              TechCart to confirm the order.
              {placedOrder.expiresAt
                ? ` The reservation expires on ${formatDate(placedOrder.expiresAt)} if it remains unpaid.`
                : ""}
            </p>
            {placedOrder.total != null ? (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Order total</span>
                <span className="font-display text-lg font-bold">{formatPKR(placedOrder.total)}</span>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/account/orders">View my orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/products">Continue shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = cart.data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Your cart is empty"
        hint="Add products before checking out."
        action={
          <Button asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        }
      />
    );
  }

  const set = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const fallbackTotal = items.reduce(
    (sum, item) =>
      sum + (item.lineTotal ?? (item.unitPrice ?? item.variant?.sellingPrice ?? 0) * item.quantity),
    0,
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Checkout</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold">Delivery details</h1>
        </div>
        <Steps current={2} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="p-6">
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                placeOrder.mutate();
              }}
            >
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" aria-hidden />
                  <h2 className="font-display text-sm font-semibold">Contact</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="recipientName">Recipient name</Label>
                    <Input id="recipientName" required value={form.recipientName} onChange={set("recipientName")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactNumber">Contact number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      required
                      placeholder="+923001234567"
                      value={form.contactNumber}
                      onChange={set("contactNumber")}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-border/70 pt-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden />
                  <h2 className="font-display text-sm font-semibold">Delivery address</h2>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required value={form.address} onChange={set("address")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required value={form.city} onChange={set("city")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">Postal code</Label>
                    <Input id="postalCode" required value={form.postalCode} onChange={set("postalCode")} />
                  </div>
                </div>
              </section>

              <Button type="submit" size="lg" className="w-full" disabled={placeOrder.isPending}>
                {placeOrder.isPending ? "Placing order…" : "Place pending order"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                This creates a pending order and reserves stock. Payment is collected separately.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-base font-semibold">Your order</h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {item.product?.name ?? item.variant?.sku ?? `Item #${item.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatPKR(item.lineTotal ?? (item.unitPrice ?? item.variant?.sellingPrice ?? 0) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-border pt-3 text-sm">
              {cart.data?.subtotal != null ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPKR(cart.data.subtotal)}</span>
                </div>
              ) : null}
              {cart.data?.shippingFee != null ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{formatPKR(cart.data.shippingFee)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-display text-lg font-bold text-primary">
                  {formatPKR(cart.data?.total ?? fallbackTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
