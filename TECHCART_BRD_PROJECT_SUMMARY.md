# TechCart E-Commerce Backend — BRD-Style Project Summary

**Document date:** 16 October 2026  
**Project:** TechCart B2C Electronics E-Commerce Platform  
**Document type:** Current-state business requirements and implementation summary

## 1. Executive summary

TechCart is a backend for a business-to-consumer electronics store. The current codebase provides customer account registration and authentication, a public product catalog, Super Admin catalog management, supplier and purchase-order workflows, and inventory tracking with auditable stock adjustments. The backend uses Node.js/Express, Prisma, and PostgreSQL, with route, controller, service, and query layers.

The database schema also models carts, orders, payments, deliveries, returns, refunds, and related stock reservations. Customer cart, checkout, and basic order-history/cancellation APIs are now implemented. Payment provider integration, admin fulfillment, deliveries, and return/refund HTTP workflows remain future work.

## 2. Business purpose

Provide the foundation for selling electronics online while allowing a Super Admin to maintain the catalog, buy stock from suppliers, receive inventory, and monitor or correct stock levels. The current API supports catalog browsing and core admin inventory operations, and establishes authentication/session infrastructure for protected administration.

## 3. Stakeholders and actors

- **Customer:** can register, verify an email address, log in, browse the public catalog, manage a cart, check out with a configured shipping city, review their orders, and cancel eligible pending orders. Payment, delivery tracking, and return APIs are not currently implemented.
- **Super Admin:** can manage categories, brands, products, variants, suppliers, purchase orders, and stock. Protected admin operations require a valid authenticated Super Admin session.
- **System:** validates business rules, persists state, tracks audit activity for purchasing and inventory operations, and sends verification email when configured.

## 4. Current functional scope

### 4.1 Identity and session management

- Customer registration with name, email, phone, password, and confirmation.
- Email verification using a time-limited one-time code; resend endpoint is available.
- Login accepts customer or seeded Super Admin credentials.
- Access token is issued in an `auth_token` HTTP-only cookie with a 15-minute lifetime.
- Refresh token is issued in an HTTP-only cookie and rotated when `POST /api/auth/refresh` is called. The refresh session lasts up to seven days, with a 30-day absolute session limit.
- Logout revokes the session and clears the cookies.
- Protected requests validate the access token, session state, user status, and token version.
- Refresh is an API action; a frontend or Postman workflow must call it when appropriate. The server does not independently refresh tokens in the background.

### 4.2 Public catalog browsing

- Public endpoints list categories and brands.
- Product list supports pagination and filters including category, brand, price, availability, search, and sorting.
- Product detail returns product information with its category, brand, and active variants, including SKU, variant specifications, price, and availability.
- Availability is calculated from remaining inventory batches less active, unexpired reservations.

### 4.3 Super Admin catalog maintenance

- Create, update, and soft-delete categories and brands.
- Create, update, and soft-delete products.
- Create variants under products; update or soft-delete variants.
- Product records link to one category and one brand. Product variants carry SKU, price, specifications, and active state.
- Category/brand deletion is blocked while active products reference the record. Soft deletion preserves historical records.

### 4.4 Supplier and purchasing operations

- List, create, update, and deactivate suppliers.
- Create and edit draft purchase orders containing product variants, quantities, and purchase prices.
- Place draft purchase orders.
- Receive all or part of an order. Each received line creates an inventory batch and updates the received quantity and purchase-order status.
- Cancel an order only when it is eligible and has no received units.
- Purchasing changes are transactionally coordinated and audit entries are written for key operations.

### 4.5 Inventory and stock operations

- Paginated inventory list with search/filter support.
- Variant inventory detail includes inventory batches and active reservations for administrative inspection.
- Batch history includes supplier/purchase-order context, allocations, and adjustments.
- Admin can make audited batch quantity adjustments using an adjustment reason and note.
- Stock service contains reusable operations for FIFO allocation, reservation, confirmation, release, return restoration/write-off, replacement allocation, and stock adjustment. These are service-level capabilities; customer order/return HTTP workflows are not currently present.
- Stock operations that change stock and corresponding business state need to execute within the same serializable transaction. The service includes retry handling for retryable transaction failures.

### 4.6 Customer cart, checkout, and orders

- Authenticated customers can view, add to, update, remove items from, or clear their own cart.
- Cart responses use current variant prices and report current available quantity. Cart contents do not reserve inventory.
- Customers can list their active shipping rates and check out using a configured city rate.
- Checkout creates a pending order and immutable order-item product/SKU/price snapshots, reserves the requested quantities for 15 minutes, and clears the cart in the same serializable transaction.
- If checkout validation or reservation fails, the transaction rolls back and the cart remains intact.
- Customers can view only their own paginated order history and order details. They can cancel pending orders; cancellation releases active reservations.
- A server-side expiry sweep runs on startup and every minute. It expires overdue reservations and cancels pending orders that no longer have active reservations.
- No payment provider is configured. Orders remain pending until payment confirmation is implemented.

### 4.7 Shipping-rate management

- Public users can list active city shipping rates.
- Super Admin can list rates, create a city fee, update a rate, and deactivate it. Rate changes are audit logged.
- Checkout requires an active rate matching the submitted city, case-insensitively.

## 5. Main business workflows

### 5.1 Catalog setup

1. Super Admin creates categories and brands.
2. Super Admin creates a product referencing an active category and brand.
3. Super Admin creates one or more variants under that product, each with a unique SKU, price, and variant-specific specifications.
4. Customers browse product records; the product response includes its variants and availability.

### 5.2 Purchasing and stock receipt

1. Super Admin creates or selects an active supplier.
2. Super Admin creates a draft purchase order with active variants, quantities, and purchase prices.
3. Super Admin places the purchase order.
4. Super Admin receives some or all ordered quantities.
5. Each receipt creates an inventory batch linked to its variant, supplier, purchase order, and purchase-order line.
6. Inventory totals and catalog availability reflect remaining batch quantities.

### 5.3 Customer checkout

1. Customer logs in and adds available product variants to their cart.
2. Customer chooses a city with an active shipping rate and submits delivery details.
3. The API rechecks active variants, current prices, and available quantities.
4. In one serializable transaction, the API creates a pending order with price snapshots, reserves stock for 15 minutes, and clears the cart.
5. If any validation or reservation fails, no order is committed and the cart remains unchanged.
6. Customer can view their own orders or cancel a pending order and release its reservations.

### 5.4 Stock correction

1. Super Admin selects an inventory batch.
2. Super Admin submits a quantity change, allowed reason, and optional note.
3. The API applies the adjustment under transaction control and records who made the change.

### 5.5 Authentication for admin use

1. User logs in through `POST /api/auth/login` using a JSON body.
2. Postman or the frontend stores/sends the HTTP-only cookies.
3. Admin GET requests have no body; authentication is supplied through the cookie.
4. Refresh uses `POST /api/auth/refresh`, which rotates the refresh token and returns a new access token cookie.

## 6. Business rules and controls

- Only verified, non-suspended users may establish a usable session; admin APIs additionally require the `super_admin` role.
- Passwords are stored as password hashes. Verification and refresh tokens are stored as hashes where applicable.
- Catalog public reads omit soft-deleted products and variants; product listing returns active variants.
- SKU values are unique at the database level.
- A product must reference an active category and brand when created or reassigned.
- Purchase orders may only use active suppliers and active product variants.
- Purchase receiving cannot exceed the ordered quantity; receipts determine the inventory batches created.
- Inventory reservations are time-limited and tracked against variants and orders; active unexpired reservations reduce available stock.
- Cart contents do not reserve inventory. Checkout revalidates quantity and price, then reserves stock atomically with order creation.
- Customers can access only their own cart and order records. A pending order can be cancelled by its customer, releasing stock reservations.
- Inventory mutations are recorded through batch quantities and allocation/adjustment records. Purchasing and adjustment APIs add audit records.
- GET requests use query parameters and cookies as applicable and should not carry credentials or filter criteria in a request body.

## 7. Current API areas

| Area | Current capability | Access |
|---|---|---|
| Authentication | Register, verify, resend OTP, login, protected-session check, refresh, logout | Mostly public; protected-session check and logout require login |
| Catalog browsing | List categories, brands, products; get product | Public |
| Catalog management | Category, brand, product, and variant create/update/soft-delete | Super Admin |
| Purchasing | Supplier and purchase-order lifecycle; receive stock | Super Admin |
| Stock | Inventory list, variant details, batch history, stock adjustment | Super Admin |
| Cart and orders | Customer cart, checkout with stock reservation, order history/detail, pending-order cancellation | Authenticated customer |
| Shipping rates | List active rates; manage and deactivate rates | Public read; Super Admin write |

An importable Postman collection covering the registered routes is available in `postman/TechCart.postman_collection.json`, with setup notes in `postman/README.md`.

## 8. Data areas represented in Prisma

The schema defines users, auth tokens and sessions, categories, brands, products, variants, suppliers, purchase orders and lines, inventory batches, carts and cart items, shipping rates, orders and lines, deliveries, inventory allocations, stock reservations, payments, refunds, payment events, return requests, stock adjustments, and audit logs.

This is the **database model scope**. Implemented API scope is narrower: no current registered route modules expose cart, shipping-rate, order, delivery, payment/refund, or return-request workflows.

## 9. Prisma migration history

The repository currently contains three migrations, in chronological order:

1. **`20261012065523_init`** — Establishes the initial PostgreSQL schema: domain enums; users and verification tokens; catalog entities; suppliers, purchase orders, and inventory batches; carts; shipping rates; orders, deliveries, payment and return records; stock allocations, reservations, adjustments; audit logs; associated indexes, unique constraints, and foreign keys.
2. **`20261013094017_add_auth_sessions`** — Adds `auth_sessions` and `auth_refresh_tokens`, their indexes and unique token-hash constraint, and cascading foreign keys to users/sessions. This supports revocable sessions and refresh-token rotation.
3. **`20261013101753_add_session_token_version`** — Adds the required integer `token_version` column to `auth_sessions`, used to bind sessions to the account token version and invalidate stale sessions.

The Prisma migration provider lock is PostgreSQL (`prisma/migrations/migration_lock.toml`).

## 10. Technical architecture

- **Runtime/API:** Node.js with Express.
- **Persistence:** PostgreSQL through Prisma Client.
- **Layering:** routes → controllers → services → queries. Business validation and workflow coordination live in services; Prisma access and selected tagged raw SQL live in query modules.
- **Security middleware:** cookie parsing, Helmet, CORS configuration, JWT verification, user/session validation, and Super Admin authorization.
- **Stock consistency:** serializable transaction helper with retry handling for selected transaction conflicts.
- **Operational configuration:** environment-based secrets and database/email settings; server entry point connects Prisma and listens on the configured port.

## 11. Not yet implemented or requiring a later phase

Based on registered route modules and service inventory, the following are database-planned or product-roadmap areas rather than complete API features:

- Payment gateway integration, payment callbacks/webhooks, refunds, and payment history.
- Admin order fulfillment and delivery/order-status endpoints.
- Customer return request submission; admin return review/inspection/refund/replacement HTTP workflows.
- Frontend behavior for automatic access-token refresh.
- Additional production-readiness review and end-to-end/concurrency testing across the complete workflows.

## 12. Acceptance outcomes for the current implemented scope

- A customer can register, verify, and authenticate, and a Super Admin can authenticate through the same login endpoint.
- Unauthenticated users cannot call Super Admin endpoints; authenticated non-admin users cannot pass Super Admin authorization.
- Public users can browse catalog products grouped with their variants and see stock availability.
- A customer can maintain a cart, check out against an active city shipping rate, receive a pending order with a 15-minute stock hold, view their own orders, and cancel an eligible pending order.
- Super Admin can create catalog records and maintain variants.
- Super Admin can create and receive purchase orders, causing inventory batches and on-hand quantities to update.
- Super Admin can inspect inventory and record authorized, reason-coded stock corrections.
- Protected GET requests do not require a request body; credentials are supplied only to the login POST, with subsequent authentication carried by cookies.

---

This summary describes the code currently present in the repository; it is not a claim that every schema model has a complete end-user workflow or that the backend is production-ready.
