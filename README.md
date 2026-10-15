# TechCart Backend

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
