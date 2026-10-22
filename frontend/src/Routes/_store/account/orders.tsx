import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, MapPin, Package, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import { useAuth } from "@/lib/auth";
import { cancelOrder, listMyOrders } from "@/lib/endpoints";
import { formatDate, formatPKR } from "@/lib/format";
import type { Order } from "@/lib/types";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/_store/account/orders")({
  head: () => ({
    meta: [
      { title: "My orders — TechCart" },
      { name: "description", content: "View and manage your TechCart orders." },
      { property: "og:title", content: "My orders — TechCart" },
      { property: "og:description", content: "View and manage your TechCart orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  const s = status.toLowerCase();
  if (s === "pending") return "warning";
  if (s === "paid" || s === "delivered") return "success";
  if (s === "cancelled" || s === "expired") return "destructive";
  return "secondary";
}

function OrdersPage() {
  const { user, initializing } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const orders = useQuery({
    queryKey: ["orders", page],
    queryFn: () => listMyOrders(page, PAGE_SIZE),
    enabled: !!user,
  });

  const cancel = useMutation({
    mutationFn: (orderId: number) => cancelOrder(orderId),
    onSuccess: () => {
      toast.success("Order cancelled");
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (initializing) return <LoadingState />;
  if (!user)
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Sign in to view your orders"
        hint="Sign in to see order history and tracking."
        action={
          <Button asChild>
            <Link to="/account/login">Sign in</Link>
          </Button>
        }
      />
    );
  if (orders.isLoading) return <LoadingState label="Loading orders…" />;
  if (orders.isError) return <ErrorState message={orders.error.message} onRetry={() => orders.refetch()} />;

  const items = orders.data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        hint="Orders you place will appear here."
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

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Account</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold">My orders</h1>
      </header>

      <div className="space-y-3">
        {items.map((order: Order) => {
          const isPending = order.status.toLowerCase() === "pending";
          return (
            <Card key={order.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Package className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold">Order #{order.id}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{formatDate(order.createdAt)}</span>
                      {order.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden />
                          {order.city}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariant(order.status)} className="capitalize">
                    {order.status}
                  </Badge>
                  <span className="font-display text-sm font-bold">{formatPKR(order.total)}</span>
                  {isPending ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancel.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Cancel pending order #${order.id}? Reserved stock will be released.`,
                          )
                        )
                          cancel.mutate(order.id);
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PaginationControls page={page} limit={PAGE_SIZE} total={orders.data?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
