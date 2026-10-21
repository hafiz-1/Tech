import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toLowerCase();
  if (s === "pending") return "secondary";
  if (s === "cancelled" || s === "expired") return "destructive";
  return "default";
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
  if (!user) return <EmptyState title="Sign in to view your orders" />;
  if (orders.isLoading) return <LoadingState label="Loading orders…" />;
  if (orders.isError) return <ErrorState message={orders.error.message} onRetry={() => orders.refetch()} />;

  const items = orders.data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState title="No orders yet" hint="Orders you place will appear here." />
        <div className="flex justify-center">
          <Button asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My orders</h1>
      <div className="space-y-3">
        {items.map((order: Order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">Order #{order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt)}
                  {order.city ? ` · ${order.city}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                <span className="font-semibold">{formatPKR(order.total)}</span>
                {order.status.toLowerCase() === "pending" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancel.isPending}
                    onClick={() => {
                      if (window.confirm(`Cancel pending order #${order.id}? Reserved stock will be released.`))
                        cancel.mutate(order.id);
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <PaginationControls page={page} limit={PAGE_SIZE} total={orders.data?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
