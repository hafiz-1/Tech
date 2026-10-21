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
import { adminCreateCategory, adminDeleteCategory, adminUpdateCategory, listCategories } from "@/lib/endpoints";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories — TechCart Admin" },
      { name: "description", content: "Manage TechCart product categories." },
      { property: "og:title", content: "Categories — TechCart Admin" },
      { property: "og:description", content: "Manage TechCart product categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["categories"] });

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminUpdateCategory(editing.id, { name, description })
        : adminCreateCategory({ name, description }),
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      setEditing(null);
      setName("");
      setDescription("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminDeleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

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
              <Label htmlFor="category-name">Name</Label>
              <Input id="category-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="min-w-56 flex-1 space-y-1">
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Update category" : "Add category"}
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

      {categories.isLoading ? (
        <LoadingState label="Loading categories…" />
      ) : categories.isError ? (
        <ErrorState message={categories.error.message} onRetry={() => categories.refetch()} />
      ) : !categories.data || categories.data.length === 0 ? (
        <EmptyState title="No categories yet" hint="Add your first category above." />
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
            {categories.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.description ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      setEditing(c);
                      setName(c.name);
                      setDescription(c.description ?? "");
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete category "${c.name}"? This is a soft delete.`))
                        remove.mutate(c.id);
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
