import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import { adminCreateBrand, adminDeleteBrand, adminUpdateBrand, listBrands } from "@/lib/endpoints";
import type { Brand } from "@/lib/types";

export const Route = createFileRoute("/admin/brands")({
  head: () => ({
    meta: [
      { title: "Brands — TechCart Admin" },
      { name: "description", content: "Manage TechCart brands." },
      { property: "og:title", content: "Brands — TechCart Admin" },
      { property: "og:description", content: "Manage TechCart brands." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBrandsPage,
});

function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const brands = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Brand | null>(null);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["brands"] });

  const save = useMutation({
    mutationFn: () =>
      editing ? adminUpdateBrand(editing.id, { name, description }) : adminCreateBrand({ name, description }),
    onSuccess: () => {
      toast.success(editing ? "Brand updated" : "Brand created");
      setEditing(null);
      setName("");
      setDescription("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteBrand(id),
    onSuccess: () => {
      toast.success("Brand deleted");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brands</h1>

      <Card>
        <CardContent className="p-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="brand-name">Name</Label>
              <Input id="brand-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="min-w-56 flex-1 space-y-1">
              <Label htmlFor="brand-description">Description</Label>
              <Input id="brand-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Update brand" : "Add brand"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setDescription("");
                }}
              >
                Cancel
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {brands.isLoading ? (
        <LoadingState label="Loading brands…" />
      ) : brands.isError ? (
        <ErrorState message={brands.error.message} onRetry={() => brands.refetch()} />
      ) : !brands.data || brands.data.length === 0 ? (
        <EmptyState title="No brands yet" hint="Add your first brand above." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.data.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="text-muted-foreground">{b.description ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      setEditing(b);
                      setName(b.name);
                      setDescription(b.description ?? "");
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete brand "${b.name}"? This is a soft delete.`)) remove.mutate(b.id);
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
    </div>
  );
}
