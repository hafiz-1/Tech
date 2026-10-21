# Importing the TechCart Postman collection

Import `TechCart.postman_collection.json` into Postman (**Import → File**). The collection has separate **Public** and **Admin (Super Admin)** folders.

## Setup

1. Set `baseUrl` to `http://localhost:5000` (or your API URL).
2. Set `adminEmail` and `adminPassword` to the seeded Super Admin credentials. Do not put credentials in GET requests.
3. Run **Admin (Super Admin) → Authentication → Login**. Postman saves the returned `auth_token` and `refresh_token` cookies for the same host. Use the same host consistently (`localhost` versus `127.0.0.1`).
4. Run protected Admin requests. The GET requests have no body; use query parameters and the login cookies.

The Public authentication folder includes customer registration, email verification, resend OTP, login, protected-session check, refresh, and logout. Customer cart and order requests are in **Public → Customer Cart and Orders (login required)**; log in as a verified customer first. The admin login request is duplicated in the Admin folder for convenience. Logout and protected-session check require an existing session.

## Useful flow for creating inventory

Create/select a category and brand, create a product, create a variant under that product, create/select a supplier, create a purchase order with the variant, place the purchase order, then receive its line. Receiving creates the inventory batch. Use the IDs returned by each response to update the collection variables (`categoryId`, `brandId`, `productId`, `variantId`, `supplierId`, `purchaseOrderId`, `purchaseOrderItemId`, and `batchId`).

The collection includes destructive soft-delete, deactivate, cancel, receive, and stock-adjustment requests. Use suitable IDs and quantities for your database before sending them. The stock adjustment example uses `change: 1`; the valid amount depends on batch limits and current inventory rules.

For checkout, first configure an active city rate through **Admin → Shipping Rates**, log in as a verified customer, add available variants to the cart, and send checkout with that city. Checkout creates a pending order and holds inventory for 15 minutes; payment-provider integration is not included yet.
