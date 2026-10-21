import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { PaginationControls } from "@/components/PaginationControl";
import {
  adminCreateProduct,
  adminCreateVariant,
  adminDeleteProduct,
  adminDeleteVariant,
  adminUpdateProduct,
  adminUpdateVariant,
  getProduct,
  listBrands,
  listCategories,
  listProducts,
} from "@/lib/endpoints";
import { formatPKR } from "@/lib/format";
import type { Product, ProductVariant } from "@/lib/types";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "Products — TechCart Admin" },
      { name: "description", content: "Manage TechCart products and variants." },
      { property: "og:title", content: "Products — TechCart Admin" },
      { property: "og:description", content: "Manage TechCart products and variants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const products = useQuery({
    queryKey: ["products", "admin", page],
    queryFn: () => listProducts({ page, limit: PAGE_SIZE }),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [description, setDescription] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const resetForm = () => {
    setEditing(null);
    setName("");
    setCategoryId("");
    setBrandId("");
    setDescription("");
  };

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminUpdateProduct(editing.id, { name, description })
        : adminCreateProduct({
            name,
            categoryId: Number(categoryId),
            brandId: Number(brandId),
            description,
            images: [],
            specifications: {},
          }),
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      resetForm();
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      <Card>
        <CardContent className="p-4">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="product-name">Name</Label>
                <Input id="product-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required={!editing}>
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-brand">Brand</Label>
                <Select value={brandId} onValueChange={setBrandId} required={!editing}>
                  <SelectTrigger id="product-brand">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(brands.data ?? []).map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {editing ? (
              <p className="text-xs text-muted-foreground">
                Category and brand are set at creation; the update endpoint only changes name and
                description.
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={save.isPending || (!editing && (!categoryId || !brandId))}
              >
                {save.isPending ? "Saving…" : editing ? "Update product" : "Add product"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {products.isLoading ? (
        <LoadingState label="Loading products…" />
      ) : products.isError ? (
        <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
      ) : !products.data || products.data.items.length === 0 ? (
        <EmptyState title="No products yet" hint="Add your first product above." />
      ) : (
        <>
          <div className="space-y-3">
            {products.data.items.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[p.category?.name, p.brand?.name].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      >
                        {expandedId === p.id ? "Hide variants" : "Variants"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(p);
                          setName(p.name);
                          setDescription(p.description ?? "");
                          setCategoryId(p.categoryId ? String(p.categoryId) : "");
                          setBrandId(p.brandId ? String(p.brandId) : "");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete product "${p.name}"? This is a soft delete.`))
                            remove.mutate(p.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {expandedId === p.id ? <VariantsPanel productId={p.id} /> : null}
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls page={page} limit={PAGE_SIZE} total={products.data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function VariantsPanel({ productId }: { productId: number }) {
  const queryClient = useQueryClient();
  const product = useQuery({ queryKey: ["product", String(productId)], queryFn: () => getProduct(productId) });

  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [specs, setSpecs] = useState("");
  const [isActive, setIsActive] = useState(true);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["product", String(productId)] });

  const parseSpecs = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const pair of specs.split(",")) {
      const [k, ...rest] = pair.split(":");
      if (k?.trim() && rest.length) out[k.trim()] = rest.join(":").trim();
    }
    return out;
  };

  const resetForm = () => {
    setEditing(null);
    setSku("");
    setPrice("");
    setSpecs("");
    setIsActive(true);
  };

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminUpdateVariant(editing.id, {
            sellingPrice: Number(price),
            specifications: parseSpecs(),
            isActive,
          })
        : adminCreateVariant(productId, {
            sku,
            sellingPrice: Number(price),
            specifications: parseSpecs(),
            isActive,
          }),
    onSuccess: () => {
      toast.success(editing ? "Variant updated" : "Variant created");
      resetForm();
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteVariant(id),
    onSuccess: () => {
      toast.success("Variant deleted");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const variants = product.data?.variants ?? [];

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {product.isLoading ? (
        <LoadingState label="Loading variants…" />
      ) : variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No variants yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Specifications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.sku}</TableCell>
                <TableCell>{formatPKR(v.sellingPrice)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {Object.entries(v.specifications ?? {})
                    .map(([k, val]) => `${k}: ${val}`)
                    .join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={v.isActive !== false ? "default" : "secondary"}>
                    {v.isActive !== false ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      setEditing(v);
                      setSku(v.sku);
                      setPrice(String(v.sellingPrice));
                      setSpecs(
                        Object.entries(v.specifications ?? {})
                          .map(([k, val]) => `${k}: ${val}`)
                          .join(", "),
                      );
                      setIsActive(v.isActive !== false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete variant ${v.sku}? This is a soft delete.`)) remove.mutate(v.id);
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor={`sku-${productId}`}>SKU</Label>
          <Input id={`sku-${productId}`} required value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`price-${productId}`}>Price (PKR)</Label>
          <Input
            id={`price-${productId}`}
            type="number"
            min={0}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="min-w-56 flex-1 space-y-1">
          <Label htmlFor={`specs-${productId}`}>Specs (color: Black, storage: 128GB)</Label>
          <Input id={`specs-${productId}`} value={specs} onChange={(e) => setSpecs(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          Active
        </label>
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending ? "Saving…" : editing ? "Update variant" : "Add variant"}
        </Button>
        {editing ? (
          <Button type="button" variant="outline" size="sm" onClick={resetForm}>
            Cancel
          </Button>
        ) : null}
      </form>
    </div>
  );
}
