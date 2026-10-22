import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import {
  adminCancelPurchaseOrder,
  adminCreatePurchaseOrder,
  adminListPurchaseOrders,
  adminListSuppliers,
  adminPlacePurchaseOrder,
  adminReceivePurchaseOrder,
  listAllProducts,
} from "@/lib/endpoints";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant, PurchaseOrder, PurchaseOrderItem } from "@/lib/types";

export const Route = createFileRoute("/admin/purchase-orders")({
  head: () => ({
    meta: [
      { title: "Purchase orders — TechCart Admin" },
      { name: "description", content: "Create, place and receive purchase orders." },
      { property: "og:title", content: "Purchase orders — TechCart Admin" },
      { property: "og:description", content: "Create, place and receive purchase orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PurchaseOrdersPage,
});

type Line = { variantId: string; quantity: string; purchasePrice: string };
type ReceiptInput = { quantity: string; batchReference: string };
const emptyLine: Line = { variantId: "", quantity: "1", purchasePrice: "" };

function formatVariant(product: Product, variant: ProductVariant) {
  const specifications = Object.entries(variant.specifications ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
  return [product.name, variant.sku, specifications, `ID #${variant.id}`].filter(Boolean).join(" · ");
}

function ProductVariantPicker({
  products,
  value,
  disabledIds,
  disabled,
  placeholder,
  onChange,
}: {
  products: Product[];
  value: string;
  disabledIds: Set<number>;
  disabled?: boolean;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const variants = useMemo(
    () => products.flatMap((product) => (product.variants ?? []).map((variant) => ({ product, variant }))),
    [products],
  );
  const selected = variants.find(({ variant }) => String(variant.id) === value);
  const selectedLabel = selected ? formatVariant(selected.product, selected.variant) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(32rem,calc(100vw-2rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search product, SKU, or variant ID..." />
          <CommandList>
            <CommandEmpty>No matching variants.</CommandEmpty>
            <CommandGroup>
              {variants.map(({ product, variant }) => {
                const label = formatVariant(product, variant);
                const isSelected = String(variant.id) === value;
                return (
                  <CommandItem
                    key={variant.id}
                    value={`${product.name} ${variant.sku} ${label} ${variant.id}`}
                    disabled={!isSelected && disabledIds.has(variant.id)}
                    onSelect={() => {
                      onChange(String(variant.id));
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PurchaseOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const orders = useQuery({
    queryKey: ["admin", "purchase-orders", page],
    queryFn: () => adminListPurchaseOrders({ page, limit: 20 }),
  });
  const suppliers = useQuery({ queryKey: ["admin", "suppliers"], queryFn: () => adminListSuppliers() });
  const products = useQuery({ queryKey: ["admin", "purchase-order-products"], queryFn: listAllProducts });
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receiptInputs, setReceiptInputs] = useState<Record<number, ReceiptInput>>({});

  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin"] });
  const onErr = (e: Error) => toast.error(e.message);
  const productList = products.data ?? [];

  const create = useMutation({
    mutationFn: () =>
      adminCreatePurchaseOrder({
        supplierId: Number(supplierId),
        items: lines.map((line) => ({
          variantId: Number(line.variantId),
          quantity: Number(line.quantity),
          purchasePrice: Number(line.purchasePrice),
        })),
      }),
    onSuccess: () => {
      toast.success("Draft purchase order created");
      setLines([{ ...emptyLine }]);
      refresh();
    },
    onError: onErr,
  });
  const place = useMutation({
    mutationFn: adminPlacePurchaseOrder,
    onSuccess: () => { toast.success("Purchase order placed"); refresh(); },
    onError: onErr,
  });
  const cancel = useMutation({
    mutationFn: adminCancelPurchaseOrder,
    onSuccess: () => { toast.success("Purchase order cancelled"); refresh(); },
    onError: onErr,
  });
  const receive = useMutation({
    mutationFn: ({ order, items }: { order: PurchaseOrder; items: { purchaseOrderItemId: number; quantity: number; batchReference?: string }[] }) =>
      adminReceivePurchaseOrder(order.id, items),
    onSuccess: () => {
      toast.success("Received quantities added to inventory");
      setReceivingOrder(null);
      setReceiptInputs({});
      refresh();
    },
    onError: onErr,
  });

  const updateLine = (idx: number, key: keyof Line, value: string) =>
    setLines((current) => current.map((line, i) => (i === idx ? { ...line, [key]: value } : line)));
  const addLine = () => setLines((current) => [...current, { ...emptyLine }]);
  const removeLine = (idx: number) => setLines((current) => current.filter((_, i) => i !== idx));
  const invalidLines = lines.some((line) =>
    !line.variantId ||
    !Number.isSafeInteger(Number(line.quantity)) || Number(line.quantity) < 1 ||
    !/^\d+(\.\d{1,2})?$/.test(line.purchasePrice),
  );

  const beginReceiving = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setReceiptInputs({});
  };
  const updateReceipt = (itemId: number, key: keyof ReceiptInput, value: string) => {
    setReceiptInputs((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? { quantity: "", batchReference: "" }),
        [key]: value,
      },
    }));
  };
  const receiptItems = (receivingOrder?.items ?? []).flatMap((item) => {
    const input = receiptInputs[item.id];
    const quantity = Number(input?.quantity ?? 0);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return [];
    return [{
      purchaseOrderItemId: item.id,
      quantity,
      ...(input?.batchReference?.trim() ? { batchReference: input.batchReference.trim() } : {}),
    }];
  });
  const hasInvalidReceipt = (receivingOrder?.items ?? []).some((item) => {
    const raw = receiptInputs[item.id]?.quantity ?? "";
    if (!raw) return false;
    const quantity = Number(raw);
    const remaining = item.quantity - (item.receivedQuantity ?? 0);
    return !Number.isSafeInteger(quantity) || quantity < 0 || quantity > remaining;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Purchase orders</h1>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h2 className="font-semibold">New draft order</h2>
          <div className="space-y-1">
            <Label htmlFor="supplier">Supplier</Label>
            <select
              id="supplier"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">Select supplier...</option>
              {suppliers.data?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.companyName}</option>
              ))}
            </select>
          </div>

          {products.isError ? (
            <ErrorState message={`Could not load product variants: ${products.error.message}`} onRetry={() => products.refetch()} />
          ) : null}
          {products.isLoading ? <LoadingState label="Loading product variants..." /> : null}

          {lines.map((line, idx) => {
            const usedIds = new Set(
              lines.flatMap((other, otherIdx) =>
                otherIdx !== idx && other.variantId ? [Number(other.variantId)] : [],
              ),
            );
            return (
              <div key={idx} className="grid gap-2 sm:grid-cols-[minmax(14rem,2fr)_1fr_1fr_auto]">
                <ProductVariantPicker
                  products={productList}
                  value={line.variantId}
                  disabledIds={usedIds}
                  disabled={products.isLoading || products.isError}
                  placeholder="Search and select a product variant..."
                  onChange={(value) => updateLine(idx, "variantId", value)}
                />
                <Input
                  aria-label="Quantity ordered"
                  placeholder="Quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={(event) => updateLine(idx, "quantity", event.target.value)}
                />
                <Input
                  aria-label="Unit cost in PKR"
                  placeholder="Unit cost (PKR)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.purchasePrice}
                  onChange={(event) => updateLine(idx, "purchasePrice", event.target.value)}
                />
                <Button type="button" variant="ghost" disabled={lines.length === 1} onClick={() => removeLine(idx)}>
                  Remove
                </Button>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addLine}>Add line</Button>
            <Button
              type="button"
              disabled={create.isPending || !supplierId || invalidLines || products.isLoading || products.isError}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Creating..." : "Create draft"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {orders.isLoading ? (
        <LoadingState label="Loading purchase orders..." />
      ) : orders.isError ? (
        <ErrorState message={orders.error.message} onRetry={() => orders.refetch()} />
      ) : !orders.data || orders.data.items.length === 0 ? (
        <EmptyState title="No purchase orders yet" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.data.items.map((order) => {
                  const status = String(order.status).toLowerCase();
                  const canReceive = status === "ordered" || status === "partially_received";
                  return (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.supplier?.companyName ?? `#${order.supplierId}`}</TableCell>
                      <TableCell><Badge variant="secondary">{order.status.replaceAll("_", " ")}</Badge></TableCell>
                      <TableCell className="text-right">{order.items?.length ?? 0}</TableCell>
                      <TableCell className="text-right">{order.total != null ? formatPKR(order.total) : "—"}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        {status === "draft" ? (
                          <Button size="sm" disabled={place.isPending} onClick={() => place.mutate(order.id)}>Place</Button>
                        ) : null}
                        {canReceive ? (
                          <Button size="sm" variant={status === "partially_received" ? "outline" : "default"} onClick={() => beginReceiving(order)}>
                            {status === "partially_received" ? "Receive remaining" : "Receive stock"}
                          </Button>
                        ) : null}
                        {status === "draft" || status === "ordered" ? (
                          <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(order.id)}>Cancel</Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {receivingOrder ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">Receive purchase order #{receivingOrder.id}</h2>
                <p className="text-sm text-muted-foreground">Enter only the quantities that arrived. Each receipt creates inventory batches and updates available stock.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setReceivingOrder(null)}>Close</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product / variant</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Receive now</TableHead>
                  <TableHead>Batch reference (optional)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivingOrder.items.map((item) => (
                  <ReceivingRow
                    key={item.id}
                    item={item}
                    input={receiptInputs[item.id] ?? { quantity: "", batchReference: "" }}
                    onChange={updateReceipt}
                  />
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={receive.isPending || receiptItems.length === 0 || hasInvalidReceipt}
                onClick={() => receive.mutate({ order: receivingOrder, items: receiptItems })}
              >
                {receive.isPending ? "Recording receipt..." : "Record received quantities"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {orders.data ? <PaginationControls page={page} total={orders.data.total} limit={20} onPageChange={setPage} /> : null}
    </div>
  );
}

function ReceivingRow({
  item,
  input,
  onChange,
}: {
  item: PurchaseOrderItem;
  input: ReceiptInput;
  onChange: (itemId: number, key: keyof ReceiptInput, value: string) => void;
}) {
  const received = item.receivedQuantity ?? 0;
  const remaining = item.quantity - received;
  const productName = item.variant?.product?.name ?? "Product";
  const sku = item.variant?.sku ?? `Variant #${item.variantId}`;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{productName}</div>
        <div className="text-xs text-muted-foreground">{sku}</div>
      </TableCell>
      <TableCell className="text-right">{item.quantity}</TableCell>
      <TableCell className="text-right">{received}</TableCell>
      <TableCell className="text-right">{remaining}</TableCell>
      <TableCell>
        <Input
          aria-label={`Quantity received for ${sku}`}
          type="number"
          min="0"
          max={remaining}
          step="1"
          className="w-28"
          disabled={remaining === 0}
          value={input.quantity}
          onChange={(event) => onChange(item.id, "quantity", event.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          aria-label={`Batch reference for ${sku}`}
          placeholder="Optional"
          value={input.batchReference}
          disabled={remaining === 0}
          onChange={(event) => onChange(item.id, "batchReference", event.target.value)}
        />
      </TableCell>
    </TableRow>
  );
}
