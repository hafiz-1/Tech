/**
 * Types for the TechCart API, derived from the Postman collection.
 * Response bodies were not included in the collection, so fields beyond the
 * request shapes are optional and normalized defensively in src/lib/api.ts.
 */

export type UserRole = "customer" | "admin" | "super_admin" | string;

export interface AuthUser {
  id?: number | string;
  name?: string;
  email: string;
  role?: UserRole;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface Brand {
  id: number;
  name: string;
  description?: string | null;
}

export interface ProductVariant {
  id: number;
  productId?: number;
  sku: string;
  sellingPrice: number;
  specifications?: Record<string, string>;
  availability?: string;
  product?: { name?: string };
  isActive?: boolean;
  /** Stock fields may appear on public responses; only ever render them as Available / Out of Stock. */
  stock?: number | null;
  available?: number | null;
  inStock?: boolean | null;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  images?: string[];
  specifications?: Record<string, string>;
  categoryId?: number;
  brandId?: number;
  category?: Category | null;
  brand?: Brand | null;
  variants?: ProductVariant[];
  availability?: string;
  price?: number | null;
  stock?: number | null;
  available?: number | null;
  inStock?: boolean | null;
  createdAt?: string;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

export interface CartItem {
  id: number;
  variantId: number;
  quantity: number;
  variant?: ProductVariant | null;
  product?: Product | null;
  unitPrice?: number;
  lineTotal?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal?: number;
  shippingFee?: number;
  total?: number;
}

export interface CheckoutInput {
  recipientName: string;
  contactNumber: string;
  address: string;
  city: string;
  postalCode: string;
}

export type OrderStatus = "pending" | "paid" | "cancelled" | "expired" | string;

export interface Order {
  id: number;
  status: OrderStatus;
  items?: Array<{
    id: number;
    variantId?: number;
    quantity: number;
    unitPrice?: number;
    productName?: string;
    sku?: string;
  }>;
  recipientName?: string;
  contactNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  subtotal?: number;
  shippingFee?: number;
  total?: number;
  createdAt?: string;
  expiresAt?: string | null;
}

export interface ShippingRate {
  id: number;
  city: string;
  fee: number;
  isActive?: boolean;
}

export interface Supplier {
  id: number;
  companyName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  licenseNumber?: string | null;
  isActive?: boolean;
}

export type PurchaseOrderStatus =
  | "draft"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled"
  | string;

export interface PurchaseOrderItem {
  id: number;
  variantId: number;
  quantity: number;
  purchasePrice: number;
  receivedQuantity?: number;
  variant?: ProductVariant | null;
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  supplier?: Supplier | null;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  total?: number;
  createdAt?: string;
}

export interface StockBatch {
  id: number;
  variantId?: number;
  batchReference?: string | null;
  quantityOnHand?: number;
  quantityReserved?: number;
  quantityAvailable?: number;
  purchasePrice?: number;
  createdAt?: string;
}

export interface VariantStock {
  id: number;
  sku?: string;
  productName?: string;
  product?: { name?: string };
  onHand?: number;
  reserved?: number;
  available?: number;
  batches?: StockBatch[];
}
