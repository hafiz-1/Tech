import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { useAuth } from "@/lib/auth";
import { checkout, getCart } from "@/lib/endpoints";
import { formatDate, formatPKR } from "@/lib/format";
import type { Order } from "@/lib/types";

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

  if (initializing || (user && cart.isLoading)) return <LoadingState />;
  if (!user) {
    return <EmptyState title="Sign in to check out" hint="Your cart is tied to your TechCart account." />;
  }
  if (cart.isError) return <ErrorState message={cart.error.message} onRetry={() => cart.refetch()} />;

  if (placedOrder) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-bold">Order #{placedOrder.id} created</h1>
          <p className="text-sm text-muted-foreground">
            Your order is <span className="font-semibold text-foreground">pending</span> and stock has
            been reserved. Payment is not handled in this demo checkout — please arrange payment
            with TechCart to confirm the order.
            {placedOrder.expiresAt
              ? ` The reservation expires on ${formatDate(placedOrder.expiresAt)} if it remains unpaid.`
              : ""}
          </p>
          {placedOrder.total != null ? (
            <p className="text-lg font-bold">Total: {formatPKR(placedOrder.total)}</p>
          ) : null}
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/account/orders">View my orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/products">Continue shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = cart.data?.items ?? [];
  if (items.length === 0) {
    return <EmptyState title="Your cart is empty" hint="Add products before checking out." />;
  }

  const set = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-sm text-muted-foreground">
        Checkout creates a pending order and reserves stock. Payment is collected separately — this
        demo does not process payments.
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          placeOrder.mutate();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="recipientName">Recipient name</Label>
          <Input id="recipientName" required value={form.recipientName} onChange={set("recipientName")} />
        </div>
        <div className="space-y-1">
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
        <div className="space-y-1">
          <Label htmlFor="address">Address</Label>
          <Input id="address" required value={form.address} onChange={set("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="city">City</Label>
            <Input id="city" required value={form.city} onChange={set("city")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input id="postalCode" required value={form.postalCode} onChange={set("postalCode")} />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={placeOrder.isPending}>
          {placeOrder.isPending ? "Placing order…" : "Place pending order"}
        </Button>
      </form>
    </div>
  );
}
