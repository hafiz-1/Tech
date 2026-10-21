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
  adminCreateShippingRate,
  adminListShippingRates,
  adminUpdateShippingRate,
} from "@/lib/endpoints";
import { formatPKR } from "@/lib/format";
import type { ShippingRate } from "@/lib/types";

export const Route = createFileRoute("/admin/shipping-rates")({
  head: () => ({
    meta: [
      { title: "Shipping rates — TechCart Admin" },
      { name: "description", content: "Manage TechCart city shipping rates." },
      { property: "og:title", content: "Shipping rates — TechCart Admin" },
      { property: "og:description", content: "Manage TechCart city shipping rates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminShippingRatesPage,
});

function AdminShippingRatesPage() {
  const queryClient = useQueryClient();
  const [includeInactive, setIncludeInactive] = useState(false);
  const rates = useQuery({
    queryKey: ["admin", "shipping-rates", includeInactive],
    queryFn: () => adminListShippingRates(includeInactive),
  });

  const [city, setCity] = useState("");
  const [fee, setFee] = useState("");
  const [editing, setEditing] = useState<ShippingRate | null>(null);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "shipping-rates"] });

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminUpdateShippingRate(editing.id, { city, fee: Number(fee) })
        : adminCreateShippingRate({ city, fee: Number(fee) }),
    onSuccess: () => {
      toast.success(editing ? "Rate updated" : "Rate created");
      setEditing(null);
      setCity("");
      setFee("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: (rate: ShippingRate) => adminUpdateShippingRate(rate.id, { isActive: !(rate.isActive !== false) }),
    onSuccess: () => {
      toast.success("Rate updated");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipping rates</h1>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={includeInactive}
            onCheckedChange={(v) => setIncludeInactive(v === true)}
            id="include-inactive"
          />
          Include inactive
        </label>
      </div>

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
              <Label htmlFor="rate-city">City</Label>
              <Input id="rate-city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rate-fee">Fee (PKR)</Label>
              <Input
                id="rate-fee"
                type="number"
                min={0}
                required
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Update rate" : "Add rate"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setCity("");
                  setFee("");
                }}
              >
                Cancel
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {rates.isLoading ? (
        <LoadingState label="Loading shipping rates…" />
      ) : rates.isError ? (
        <ErrorState message={rates.error.message} onRetry={() => rates.refetch()} />
      ) : !rates.data || rates.data.length === 0 ? (
        <EmptyState title="No shipping rates" hint="Add a city rate above." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.data.map((r) => {
              const active = r.isActive !== false;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.city}</TableCell>
                  <TableCell>{formatPKR(r.fee)}</TableCell>
                  <TableCell>
                    <Badge variant={active ? "default" : "secondary"}>{active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setEditing(r);
                        setCity(r.city);
                        setFee(String(r.fee));
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={active ? "destructive" : "default"}
                      size="sm"
                      disabled={toggleActive.isPending}
                      onClick={() => {
                        if (
                          !active ||
                          window.confirm(`Deactivate the ${r.city} shipping rate? Customers will no longer see it.`)
                        )
                          toggleActive.mutate(r);
                      }}
                    >
                      {active ? "Deactivate" : "Activate"}
                    </Button>
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
