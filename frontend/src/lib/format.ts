import type { Product, ProductVariant } from "./types";

const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

/** Shared PKR price formatter. Always display API-provided totals as-is. */
export function formatPKR(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "\u2014";
  return pkr.format(amount);
}

/**
 * Public pages may only say "Available" or "Out of Stock" - never numeric
 * stock, reserved, or on-hand quantities.
 */
export function availabilityLabel(source: Product | ProductVariant | null | undefined): string {
  if (!source) return "Out of Stock";
  if (typeof source.inStock === "boolean") return source.inStock ? "Available" : "Out of Stock";
  const qty = source.available ?? source.stock;
  if (typeof qty === "number") return qty > 0 ? "Available" : "Out of Stock";
  if ("availability" in source && typeof source.availability === "string") {
    return source.availability.trim().toLowerCase() === "available" ? "Available" : "Out of Stock";
  }
  if ("variants" in source && Array.isArray(source.variants)) {
    return source.variants.some((variant) => availabilityLabel(variant) === "Available")
      ? "Available"
      : "Out of Stock";
  }
  // Stock unknown from the API: do not claim availability.
  return "Out of Stock";
}

/** Lowest active variant price, for list cards. */
export function displayPrice(product: Product): number | null {
  if (typeof product.price === "number") return product.price;
  const prices = (product.variants ?? [])
    .filter((v) => v.isActive !== false)
    .map((variant) => Number(variant.sellingPrice))
    .filter((price) => Number.isFinite(price));
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "\u2014";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "\u2014"
    : d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}
