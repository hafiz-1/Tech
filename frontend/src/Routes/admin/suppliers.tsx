import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusState";
import {
  adminCreateSupplier,
  adminDeactivateSupplier,
  adminListSuppliers,
  adminUpdateSupplier,
} from "@/lib/endpoints";
import type { Supplier } from "@/lib/types";

export const Route = createFileRoute("/admin/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — TechCart Admin" },
      { name: "description", content: "Manage TechCart suppliers." },
      { property: "og:title", content: "Suppliers — TechCart Admin" },
      { property: "og:description", content: "Manage TechCart suppliers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSuppliersPage,
});

const emptyForm = {
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  licenseNumber: "",
};

function AdminSuppliersPage() {
  const queryClient = useQueryClient();
  const [includeInactive, setIncludeInactive] = useState(false);
  const suppliers = useQuery({
    queryKey: ["admin", "suppliers", includeInactive],
    queryFn: () => adminListSuppliers(includeInactive),
  });

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = useMutation({
    mutationFn: () => (editing ? adminUpdateSupplier(editing.id, form) : adminCreateSupplier(form)),
    onSuccess: () => {
      toast.success(editing ? "Supplier updated" : "Supplier created");
      setEditing(null);
      setForm(emptyForm);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => adminDeactivateSupplier(id),
    onSuccess: () => {
      toast.success("Supplier deactivated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reactivate = useMutation({
    mutationFn: (id: number) => adminUpdateSupplier(id, { isActive: true }),
    onSuccess: () => {
      toast.success("Supplier activated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            id="include-inactive"
            checked={includeInactive}
            onCheckedChange={(v) => setIncludeInactive(v === true)}
          />
          Include inactive
        </label>
      </div>

      <Card>
        <CardContent className="p-4">
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" required value={form.companyName} onChange={set("companyName")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input id="contactPerson" value={form.contactPerson} onChange={set("contactPerson")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={set("address")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="licenseNumber">License number</Label>
              <Input id="licenseNumber" value={form.licenseNumber} onChange={set("licenseNumber")} />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : editing ? "Update supplier" : "Add supplier"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {suppliers.isLoading ? (
        <LoadingState label="Loading suppliers…" />
      ) : suppliers.isError ? (
        <ErrorState message={suppliers.error.message} onRetry={() => suppliers.refetch()} />
      ) : !suppliers.data || suppliers.data.length === 0 ? (
        <EmptyState title="No suppliers yet" hint="Add your first supplier above." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.data.map((s) => {
              const active = s.isActive !== false;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.companyName}</TableCell>
                  <TableCell>{s.contactPerson ?? "—"}</TableCell>
                  <TableCell>{s.phone ?? "—"}</TableCell>
                  <TableCell>{s.licenseNumber ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={active ? "default" : "secondary"}>{active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setEditing(s);
                        setForm({
                          companyName: s.companyName,
                          contactPerson: s.contactPerson ?? "",
                          phone: s.phone ?? "",
                          email: s.email ?? "",
                          address: s.address ?? "",
                          licenseNumber: s.licenseNumber ?? "",
                        });
                      }}
                    >
                      Edit
                    </Button>
                    {active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deactivate.isPending}
                        onClick={() => {
                          if (window.confirm(`Deactivate supplier "${s.companyName}"?`)) deactivate.mutate(s.id);
                        }}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" disabled={reactivate.isPending} onClick={() => reactivate.mutate(s.id)}>
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
