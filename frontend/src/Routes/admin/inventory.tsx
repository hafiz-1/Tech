import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import { adminAdjustBatch, adminGetVariantStock, adminListStock } from "@/lib/endpoints";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — TechCart Admin" },
      { name: "description", content: "View stock levels and adjust batches." },
      { property: "og:title", content: "Inventory — TechCart Admin" },
      { property: "og:description", content: "View stock levels and adjust batches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const stock = useQuery({ queryKey: ["admin", "stock", page], queryFn: () => adminListStock(page, 25) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory</h1>
      {stock.isLoading ? (
        <LoadingState label="Loading stock…" />
      ) : stock.isError ? (
        <ErrorState message={stock.error.message} onRetry={() => stock.refetch()} />
      ) : !stock.data || stock.data.items.length === 0 ? (
        <EmptyState title="No stock yet" hint="Receive a purchase order to add stock." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.data.items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.sku ?? `#${s.id}`}</TableCell>
                    <TableCell>{s.product?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">{s.onHand ?? 0}</TableCell>
                    <TableCell className="text-right">{s.reserved ?? 0}</TableCell>
                    <TableCell className="text-right">{s.available ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(s.id)}>
                        Batches
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {stock.data ? (
        <PaginationControls page={page} total={stock.data.total} limit={25} onPageChange={setPage} />
      ) : null}
      {selected !== null ? <BatchPanel variantId={selected} /> : null}
    </div>
  );
}

function BatchPanel({ variantId }: { variantId: number }) {
  const qc = useQueryClient();
  const detail = useQuery({ queryKey: ["admin", "variant-stock", variantId], queryFn: () => adminGetVariantStock(variantId) });
  const [change, setChange] = useState<Record<number, string>>({});
  const [reason, setReason] = useState<Record<number, string>>({});
  const adjust = useMutation({
    mutationFn: (batchId: number) =>
      adminAdjustBatch(batchId, { change: Number(change[batchId] ?? 0), reason: reason[batchId] || "manual" }),
    onSuccess: () => {
      toast.success("Batch adjusted");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h2 className="font-semibold">Batches for variant #{variantId}</h2>
        {detail.isLoading ? (
          <LoadingState label="Loading batches…" />
        ) : detail.isError ? (
          <ErrorState message={detail.error.message} onRetry={() => detail.refetch()} />
        ) : !detail.data?.batches?.length ? (
          <EmptyState title="No batches" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Adjust (+/-)</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.data.batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.batchReference ?? `#${b.id}`}</TableCell>
                  <TableCell className="text-right">{b.quantityOnHand ?? 0}</TableCell>
                  <TableCell className="text-right">{b.quantityAvailable ?? 0}</TableCell>
                  <TableCell>
                    <Input type="number" className="w-24" value={change[b.id] ?? ""} onChange={(e) => setChange({ ...change, [b.id]: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={reason[b.id] ?? ""} onChange={(e) => setReason({ ...reason, [b.id]: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" disabled={adjust.isPending || !change[b.id]} onClick={() => adjust.mutate(b.id)}>
                      Apply
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
