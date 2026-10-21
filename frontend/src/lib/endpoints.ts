/**
 * Typed wrappers for every TechCart endpoint in the Postman collection.
 * Paths, methods, and request bodies match the collection exactly.
 */
import { apiFetch, unwrap, unwrapList } from "./api";
import type {
  Brand,
  Cart,
  Category,
  CheckoutInput,
  Order,
  Product,
  ProductSort,
  ProductVariant,
  PurchaseOrder,
  PurchaseOrderItem,
  ShippingRate,
  StockBatch,
  Supplier,
  VariantStock,
} from "./types";

// ---------- Public catalog ----------

export async function listCategories(): Promise<Category[]> {
  return unwrapList<Category>(await apiFetch("/api/categories")).items;
}

export async function listBrands(): Promise<Brand[]> {
  return unwrapList<Brand>(await apiFetch("/api/brands")).items;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  sort?: ProductSort;
  search?: string;
  categoryId?: number;
  brandId?: number;
}

export async function listProducts(params: ProductListParams = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 12));
  qs.set("sort", params.sort ?? "newest");
  if (params.search) qs.set("search", params.search);
  if (params.categoryId) qs.set("categoryId", String(params.categoryId));
  if (params.brandId) qs.set("brandId", String(params.brandId));
  return unwrapList<Product>(await apiFetch(`/api/products?${qs.toString()}`));
}

/** Load all active catalog products for admin variant selection. */
export async function listAllProducts(): Promise<Product[]> {
  const products: Product[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const qs = new URLSearchParams({ page: String(page), limit: "100", sort: "newest" });
    const response = await apiFetch<{
      data?: Product[];
      pagination?: { totalPages?: number };
    }>(`/api/products?${qs.toString()}`);
    const pageProducts = Array.isArray(response?.data) ? response.data : [];
    products.push(...pageProducts);
    totalPages = response?.pagination?.totalPages ?? page;
    page += 1;
  } while (page <= totalPages);

  return products;
}

export async function getProduct(id: number | string): Promise<Product> {
  return unwrap<Product>(await apiFetch(`/api/products/${id}`));
}

export async function listActiveShippingRates(): Promise<ShippingRate[]> {
  return unwrapList<ShippingRate>(await apiFetch("/api/shipping-rates")).items;
}

// ---------- Customer cart & orders (login required) ----------

export async function getCart(): Promise<Cart> {
  const data = unwrap<Cart | Cart["items"]>(await apiFetch("/api/cart"));
  if (Array.isArray(data)) return { items: data };
  return { items: data?.items ?? [], subtotal: data?.subtotal, shippingFee: data?.shippingFee, total: data?.total };
}

export async function addCartItem(variantId: number, quantity: number) {
  return apiFetch("/api/cart/items", { method: "POST", body: { variantId, quantity } });
}

export async function updateCartItem(cartItemId: number, quantity: number) {
  return apiFetch(`/api/cart/items/${cartItemId}`, { method: "PATCH", body: { quantity } });
}

export async function removeCartItem(cartItemId: number) {
  return apiFetch(`/api/cart/items/${cartItemId}`, { method: "DELETE" });
}

export async function clearCart() {
  return apiFetch("/api/cart", { method: "DELETE" });
}

export async function checkout(input: CheckoutInput): Promise<Order> {
  return unwrap<Order>(await apiFetch("/api/checkout", { method: "POST", body: input }));
}

export async function listMyOrders(page = 1, limit = 10) {
  return unwrapList<Order>(await apiFetch(`/api/orders?page=${page}&limit=${limit}`));
}

export async function getMyOrder(orderId: number | string): Promise<Order> {
  return unwrap<Order>(await apiFetch(`/api/orders/${orderId}`));
}

export async function cancelOrder(orderId: number | string) {
  return apiFetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
}

// ---------- Admin: catalog management ----------

export async function adminCreateCategory(input: { name: string; description?: string }) {
  return apiFetch("/api/admin/categories", { method: "POST", body: input });
}

export async function adminUpdateCategory(id: number, input: { name?: string; description?: string }) {
  return apiFetch(`/api/admin/categories/${id}`, { method: "PATCH", body: input });
}

export async function adminDeleteCategory(id: number) {
  return apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export async function adminCreateBrand(input: { name: string; description?: string }) {
  return apiFetch("/api/admin/brands", { method: "POST", body: input });
}

export async function adminUpdateBrand(id: number, input: { name?: string; description?: string }) {
  return apiFetch(`/api/admin/brands/${id}`, { method: "PATCH", body: input });
}

export async function adminDeleteBrand(id: number) {
  return apiFetch(`/api/admin/brands/${id}`, { method: "DELETE" });
}

export interface AdminProductInput {
  name: string;
  categoryId: number;
  brandId: number;
  description?: string;
  images?: string[];
  specifications?: Record<string, string>;
}

export async function adminCreateProduct(input: AdminProductInput) {
  return apiFetch("/api/admin/products", { method: "POST", body: input });
}

export async function adminUpdateProduct(id: number, input: Partial<AdminProductInput>) {
  return apiFetch(`/api/admin/products/${id}`, { method: "PATCH", body: input });
}

export async function adminDeleteProduct(id: number) {
  return apiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
}

export interface AdminVariantInput {
  sku: string;
  sellingPrice: number;
  specifications?: Record<string, string>;
  isActive?: boolean;
}

export async function adminCreateVariant(productId: number, input: AdminVariantInput) {
  return apiFetch(`/api/admin/products/${productId}/variants`, { method: "POST", body: input });
}

export async function adminUpdateVariant(id: number, input: Partial<AdminVariantInput>) {
  return apiFetch(`/api/admin/variants/${id}`, { method: "PATCH", body: input });
}

export async function adminDeleteVariant(id: number) {
  return apiFetch(`/api/admin/variants/${id}`, { method: "DELETE" });
}

// ---------- Admin: stock ----------

export async function adminListStock(page = 1, limit = 25) {
  return unwrapList<VariantStock>(await apiFetch(`/api/admin/stock?page=${page}&limit=${limit}`));
}

export async function adminGetVariantStock(variantId: number | string): Promise<VariantStock> {
  if (!Number.isSafeInteger(Number(variantId)) || Number(variantId) < 1) {
    throw new Error("A valid variant ID is required to load stock batches.");
  }
  return unwrap<VariantStock>(await apiFetch(`/api/admin/stock/variants/${variantId}`));
}

export async function adminGetBatchHistory(batchId: number | string) {
  return unwrap<StockBatch>(await apiFetch(`/api/admin/stock/batches/${batchId}`));
}

export async function adminAdjustBatch(
  batchId: number | string,
  input: { change: number; reason: string; note?: string },
) {
  return apiFetch(`/api/admin/stock/batches/${batchId}/adjust`, { method: "POST", body: input });
}

// ---------- Admin: shipping rates ----------

export async function adminListShippingRates(includeInactive = false): Promise<ShippingRate[]> {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return unwrapList<ShippingRate>(await apiFetch(`/api/admin/shipping-rates${qs}`)).items;
}

export async function adminCreateShippingRate(input: { city: string; fee: number }) {
  return apiFetch("/api/admin/shipping-rates", { method: "POST", body: input });
}

export async function adminUpdateShippingRate(
  id: number,
  input: { city?: string; fee?: number; isActive?: boolean },
) {
  return apiFetch(`/api/admin/shipping-rates/${id}`, { method: "PATCH", body: input });
}

// ---------- Admin: purchasing ----------

export async function adminListSuppliers(includeInactive = false): Promise<Supplier[]> {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return unwrapList<Supplier>(await apiFetch(`/api/admin/suppliers${qs}`)).items;
}

export interface AdminSupplierInput {
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  isActive?: boolean;
}

export async function adminCreateSupplier(input: AdminSupplierInput) {
  return apiFetch("/api/admin/suppliers", { method: "POST", body: input });
}

export async function adminUpdateSupplier(id: number, input: Partial<AdminSupplierInput>) {
  return apiFetch(`/api/admin/suppliers/${id}`, { method: "PATCH", body: input });
}

export async function adminDeactivateSupplier(id: number) {
  return apiFetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
}

export async function adminListPurchaseOrders(params: { page?: number; limit?: number; status?: string } = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 25));
  if (params.status) qs.set("status", params.status);
  return unwrapList<PurchaseOrder>(await apiFetch(`/api/admin/purchase-orders?${qs.toString()}`));
}

export interface AdminPurchaseOrderItemInput {
  variantId: number;
  quantity: number;
  purchasePrice: number;
}

export interface AdminPurchaseOrderInput {
  supplierId: number;
  items: AdminPurchaseOrderItemInput[];
}

export async function adminCreatePurchaseOrder(input: AdminPurchaseOrderInput) {
  return apiFetch("/api/admin/purchase-orders", { method: "POST", body: input });
}

export async function adminGetPurchaseOrder(id: number | string): Promise<PurchaseOrder> {
  return unwrap<PurchaseOrder>(await apiFetch(`/api/admin/purchase-orders/${id}`));
}

export async function adminUpdateDraftPurchaseOrder(id: number, input: AdminPurchaseOrderInput) {
  return apiFetch(`/api/admin/purchase-orders/${id}`, { method: "PATCH", body: input });
}

export async function adminPlacePurchaseOrder(id: number) {
  return apiFetch(`/api/admin/purchase-orders/${id}/place`, { method: "POST" });
}

export interface AdminReceiveItemInput {
  purchaseOrderItemId: number;
  quantity: number;
  batchReference?: string;
}

export async function adminReceivePurchaseOrder(id: number, items: AdminReceiveItemInput[]) {
  return apiFetch(`/api/admin/purchase-orders/${id}/receive`, { method: "POST", body: { items } });
}

export async function adminCancelPurchaseOrder(id: number) {
  return apiFetch(`/api/admin/purchase-orders/${id}/cancel`, { method: "POST" });
}
