# TechCart Backend

## Customer cart, checkout, and orders

Customer endpoints require a verified authenticated session. Login with `POST /api/auth/login`; subsequent calls send the `auth_token` cookie. GET endpoints have no request body.

- `GET /api/shipping-rates` — active city shipping fees.
- `GET /api/cart` — current customer's cart with current prices and available stock.
- `POST /api/cart/items` — JSON `{ "variantId": 1, "quantity": 1 }` adds a quantity to the cart.
- `PATCH /api/cart/items/:itemId` — JSON `{ "quantity": 2 }` sets the line quantity.
- `DELETE /api/cart/items/:itemId` — remove a line; `DELETE /api/cart` clears the cart.
- `POST /api/checkout` — JSON `{ "recipientName": "...", "contactNumber": "...", "address": "...", "city": "...", "postalCode": "..." }` creates a pending order and reserves its stock for 15 minutes.
- `GET /api/orders?page=1&limit=10` — current customer's paginated order history.
- `GET /api/orders/:orderId` — one of the current customer's orders.
- `POST /api/orders/:orderId/cancel` — cancel a pending order and release its reservations.

Checkout uses current database prices and an active shipping rate for the submitted city. It creates order-item snapshots, reserves the stock, and clears the cart in one serializable transaction. If validation or reservation fails, the transaction rolls back and leaves the cart intact. Payment provider integration and payment confirmation are not part of this module; orders remain pending until a payment/order workflow is implemented.

### Shipping-rate administration (Super Admin)

- `GET /api/admin/shipping-rates` — active rates.
- `GET /api/admin/shipping-rates?includeInactive=true` — all rates.
- `POST /api/admin/shipping-rates` — JSON `{ "city": "Lahore", "fee": 250 }`.
- `PATCH /api/admin/shipping-rates/:shippingRateId` — update `city`, `fee`, and/or `isActive`; set `isActive` to `false` to deactivate.

The server periodically releases expired stock reservations and cancels their still-pending orders.

## Stock module

The stock module follows the backend's layer split:

- `src/routes/stock.routes.js` wires admin inventory endpoints.
- `src/controllers/stock.controller.js` handles HTTP input and responses.
- `src/services/stock.service.js` owns stock rules and transaction coordination.
- `src/queries/stock.queries.js` owns Prisma and tagged-template SQL access.

Admin endpoints (Super Admin only):

- `GET /api/admin/stock` — paginated inventory, searchable by product, brand, or SKU.
- `GET /api/admin/stock/variants/:variantId` — variant batches and active reservations.
- `GET /api/admin/stock/batches/:batchId` — batch, allocation, and adjustment history.
- `POST /api/admin/stock/batches/:batchId/adjust` — audited stock adjustment. JSON body: `{ "change": 2, "reason": "found", "note": "..." }`.

Purchasing and receiving endpoints (Super Admin only):

- `GET/POST /api/admin/suppliers`; `PATCH/DELETE /api/admin/suppliers/:supplierId`.
- `GET/POST /api/admin/purchase-orders`; `GET/PATCH /api/admin/purchase-orders/:purchaseOrderId`.
- `POST /api/admin/purchase-orders/:purchaseOrderId/place` places a draft order.
- `POST /api/admin/purchase-orders/:purchaseOrderId/receive` receives one or more lines and creates inventory batches. JSON body: `{ "items": [{ "purchaseOrderItemId": 1, "quantity": 5, "batchReference": "LOT-1" }] }`.
- `POST /api/admin/purchase-orders/:purchaseOrderId/cancel` cancels an order with no received units.

Creating a purchase order requires an active supplier and active product variants. Receiving is the only API in this module that creates stock batches.

Stock mutation methods accept a transaction client. The caller must keep stock
changes and the related order, payment, or return state change in the same
transaction. Use `runStockTransaction` for serializable isolation and retries;
its callback must not perform external side effects.
