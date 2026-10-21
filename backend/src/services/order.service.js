const queries = require("../queries/order.queries");
const stockService = require("./stock.service");

function orderError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function positiveInteger(value, field) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number <= 0) throw orderError(400, `${field} must be a positive integer`);
    return number;
}

function nonEmptyString(value, field, maxLength) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
        throw orderError(400, `${field} is required and must be ${maxLength} characters or fewer`);
    }
    return value.trim();
}

function cartItemView(item) {
    const variant = item.variant;
    // Cart availability excludes both depleted batch stock and stock already reserved by orders.
    const onHand = variant.batches.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
    const reserved = variant.reservations.reduce((sum, row) => sum + row.quantity, 0);
    const unitPrice = Number(variant.sellingPrice);
    return {
        id: item.id,
        quantity: item.quantity,
        variant: {
            id: variant.id,
            sku: variant.sku,
            specifications: variant.specifications,
            sellingPrice: variant.sellingPrice,
            available: Math.max(0, onHand - reserved),
            product: {
                id: variant.product.id,
                name: variant.product.name,
                images: variant.product.images,
                category: variant.product.category ? { id: variant.product.category.id, name: variant.product.category.name } : null,
                brand: variant.product.brand ? { id: variant.product.brand.id, name: variant.product.brand.name } : null
            }
        },
        subtotal: (unitPrice * item.quantity).toFixed(2)
    };
}

function cartView(cart) {
    const items = (cart?.items || []).map(cartItemView);
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    return { id: cart?.id ?? null, items, itemsSubtotal: subtotal.toFixed(2) };
}

async function getCart(userId) {
    const cart = await queries.getCart(null, userId);
    return cartView(cart);
}

async function addCartItem(userId, input) {
    const variantId = positiveInteger(input.variantId, "variantId");
    const quantity = positiveInteger(input.quantity, "quantity");
    const cart = await stockService.runStockTransaction(async tx => {
        // Lock before reading availability so concurrent cart changes cannot oversell this variant.
        await stockService.lockVariants(tx, [variantId]);
        if (!(await queries.getActiveVariant(tx, variantId))) throw orderError(404, "Active product variant not found");
        const now = new Date();
        const available = await stockService.availability(tx, variantId, now);
        const currentCart = await queries.getOrCreateCart(tx, userId);
        const existing = await queries.getCartItem(tx, currentCart.id, variantId);
        const nextQuantity = quantity + (existing?.quantity ?? 0);
        if (nextQuantity > available) throw orderError(409, "INSUFFICIENT_STOCK");
        await queries.upsertCartItem(tx, currentCart.id, variantId, nextQuantity);
        return queries.getCart(tx, userId);
    });
    return cartView(cart);
}

async function updateCartItem(userId, itemIdValue, input) {
    const itemId = positiveInteger(itemIdValue, "itemId");
    const quantity = positiveInteger(input.quantity, "quantity");
    const cart = await stockService.runStockTransaction(async tx => {
        const item = await queries.findOwnedCartItem(tx, userId, itemId);
        if (!item) throw orderError(404, "Cart item not found");
        await stockService.lockVariants(tx, [item.variantId]);
        if (!(await queries.getActiveVariant(tx, item.variantId))) throw orderError(404, "Active product variant not found");
        if (quantity > await stockService.availability(tx, item.variantId)) throw orderError(409, "INSUFFICIENT_STOCK");
        await queries.updateCartItem(tx, itemId, quantity);
        return queries.getCart(tx, userId);
    });
    return cartView(cart);
}

async function removeCartItem(userId, itemIdValue) {
    const itemId = positiveInteger(itemIdValue, "itemId");
    await stockService.runStockTransaction(async tx => {
        const item = await queries.findOwnedCartItem(tx, userId, itemId);
        if (!item) throw orderError(404, "Cart item not found");
        await queries.deleteCartItem(tx, itemId);
    });
}

async function clearCart(userId) {
    const cart = await queries.getCart(null, userId);
    if (cart) await queries.clearCart(null, cart.id);
}

async function checkout(userId, input) {
    const recipientName = nonEmptyString(input.recipientName, "recipientName", 200);
    const contactNumber = nonEmptyString(input.contactNumber, "contactNumber", 50);
    const address = nonEmptyString(input.address, "address", 1000);
    const city = nonEmptyString(input.city, "city", 100);
    const postalCode = input.postalCode === undefined || input.postalCode === null || input.postalCode === ""
        ? null : nonEmptyString(input.postalCode, "postalCode", 30);

    return stockService.runStockTransaction(async tx => {
        const cart = await queries.getCart(tx, userId);
        if (!cart?.items.length) throw orderError(400, "Cart is empty");

        const variantIds = cart.items.map(item => item.variantId);
        await stockService.lockVariants(tx, variantIds);
        const now = new Date();
        const orderItems = [];
        let subtotal = 0;
        // Recheck live prices and availability under lock; the resulting values are snapshotted on the order.
        for (const item of cart.items) {
            const variant = await queries.getActiveVariant(tx, item.variantId);
            if (!variant) throw orderError(409, `Variant ${item.variantId} is no longer available`);
            if (await stockService.availability(tx, variant.id, now) < item.quantity) {
                throw orderError(409, `INSUFFICIENT_STOCK for variant ${variant.id}`);
            }
            const unitPrice = Number(variant.sellingPrice);
            const lineSubtotal = Number((unitPrice * item.quantity).toFixed(2));
            subtotal += lineSubtotal;
            orderItems.push({
                variantId: variant.id,
                productName: variant.product.name,
                sku: variant.sku,
                unitPrice: unitPrice.toFixed(2),
                quantity: item.quantity,
                subtotal: lineSubtotal.toFixed(2)
            });
        }

        const shippingRate = await queries.findShippingRate(tx, city);
        if (!shippingRate) throw orderError(422, "No active shipping rate is configured for this city");
        const shippingFee = Number(shippingRate.fee);
        const order = await queries.createOrder(tx, {
            userId,
            recipientName,
            contactNumber,
            address,
            city: shippingRate.city,
            postalCode,
            itemsSubtotal: subtotal.toFixed(2),
            shippingFee: shippingFee.toFixed(2),
            total: (subtotal + shippingFee).toFixed(2)
        }, orderItems);

        await stockService.reserveStock(tx, {
            userId,
            orderId: order.id,
            items: order.items.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
            now
        });
        // Keep order creation, stock reservation, and cart clearing atomic.
        await queries.clearCart(tx, cart.id);
        return queries.getCustomerOrder(userId, order.id, tx);
    });
}

async function listOrders(userId, filters = {}) {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 10);
    if (!Number.isSafeInteger(page) || page < 1) throw orderError(400, "page must be a positive integer");
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw orderError(400, "limit must be between 1 and 100");
    const [data, total] = await Promise.all([
        queries.getCustomerOrders(userId, { skip: (page - 1) * limit, take: limit }),
        queries.countCustomerOrders(userId)
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getOrder(userId, orderIdValue) {
    const orderId = positiveInteger(orderIdValue, "orderId");
    const order = await queries.getCustomerOrder(userId, orderId);
    if (!order) throw orderError(404, "Order not found");
    return order;
}

async function cancelOrder(userId, orderIdValue) {
    const orderId = positiveInteger(orderIdValue, "orderId");
    return stockService.runStockTransaction(async tx => {
        const order = await tx.order.findFirst({ where: { id: orderId, userId }, select: { id: true } });
        if (!order) throw orderError(404, "Order not found");
        // Releasing reservations and marking the order cancelled must commit together.
        await stockService.releaseOrderReservations(tx, orderId, "cancelled", {
            cancelledById: userId,
            cancellationReason: "Cancelled by customer"
        });
        return queries.getCustomerOrder(userId, orderId, tx);
    });
}

module.exports = { getCart, addCartItem, updateCartItem, removeCartItem, clearCart, checkout, listOrders, getOrder, cancelOrder, cartView };
