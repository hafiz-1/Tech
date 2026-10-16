const queries = require("../queries/stock.queries");

const RESERVATION_MINUTES = 15;
const STOCK_TRANSACTION_RETRIES = 3;

function stockError(code, statusCode = 409) {
    const error = new Error(code);
    error.code = code;
    error.statusCode = statusCode;
    return error;
}

function positiveInteger(value, field) {
    if (!Number.isSafeInteger(value) || value <= 0) throw stockError(`${field} must be a positive integer`, 400);
}

function isRetryableTransactionError(error) {
    return error?.code === "P2034" || error?.code === "40001" || error?.code === "40P01";
}

function assertLocks(rows, code) {
    if (rows === null) throw stockError(code);
    return rows;
}

// Keep a whole business operation in this transaction, including its order,
// payment, or return state update. The callback must have no external side
// effects because it can be retried after a serialization/deadlock failure.
async function runStockTransaction(work, { retries = STOCK_TRANSACTION_RETRIES } = {}) {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await queries.transaction(work, { isolationLevel: "Serializable" });
        } catch (error) {
            if (!isRetryableTransactionError(error) || attempt >= retries) {
                if (isRetryableTransactionError(error)) throw stockError("TRY_AGAIN", 503);
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 15 * (2 ** attempt)));
        }
    }
}

async function lockVariants(tx, ids) {
    if (!Array.isArray(ids) || !ids.length) throw stockError("At least one variant is required", 400);
    ids.forEach(id => positiveInteger(id, "variantId"));
    return assertLocks(await queries.lockRows(tx, "variants", ids, true), "VARIANT_UNAVAILABLE");
}

async function lockBatches(tx, ids) {
    if (!ids.length) return [];
    return assertLocks(await queries.lockRows(tx, "batches", ids, true), "INVENTORY_BATCH_NOT_FOUND");
}

async function lockOrders(tx, ids) {
    if (!ids.length) return [];
    return assertLocks(await queries.lockRows(tx, "orders", ids, true), "ORDER_NOT_FOUND");
}

async function lockOrderItems(tx, ids) {
    if (!ids.length) return [];
    return assertLocks(await queries.lockRows(tx, "orderItems", ids, true), "ORDER_ITEM_NOT_FOUND");
}

async function lockReservations(tx, ids) {
    if (!ids.length) return [];
    return assertLocks(await queries.lockRows(tx, "reservations", ids, true), "RESERVATION_INVALID");
}

async function availability(tx, variantId, now = new Date()) {
    positiveInteger(variantId, "variantId");
    const stock = await queries.getAvailability(tx, variantId, now);
    return Math.max(0, stock.onHand - stock.reserved);
}

async function consumeFifo(tx, variantId, quantity, link) {
    positiveInteger(variantId, "variantId");
    positiveInteger(quantity, "quantity");
    if (!link || !["sale", "replacement"].includes(link.type)) throw stockError("INVALID_ALLOCATION_LINK", 422);
    if (link.type === "sale") positiveInteger(link.orderItemId, "orderItemId");
    if (link.type === "replacement") positiveInteger(link.returnRequestId, "returnRequestId");

    const batches = await queries.getFifoBatches(tx, variantId);
    let remaining = quantity;
    const created = [];
    for (const batch of batches) {
        if (remaining === 0) break;
        const take = Math.min(remaining, Number(batch.quantityRemaining));
        const updated = await queries.decrementBatch(tx, batch.id, take);
        if (updated.count !== 1) throw stockError("TRY_AGAIN", 503);
        created.push(await queries.createAllocation(tx, {
            batchId: batch.id,
            quantity: take,
            allocationType: link.type,
            ...(link.type === "sale" ? { orderItemId: link.orderItemId } : { returnRequestId: link.returnRequestId })
        }));
        remaining -= take;
    }
    if (remaining > 0) throw stockError("INSUFFICIENT_STOCK");
    return created;
}

async function reserveStock(tx, { userId, orderId, items, now = new Date(), minutes = RESERVATION_MINUTES }) {
    positiveInteger(userId, "userId");
    positiveInteger(orderId, "orderId");
    if (!Array.isArray(items) || !items.length) throw stockError("Cart is empty", 400);
    if (!Number.isSafeInteger(minutes) || minutes <= 0) throw stockError("minutes must be a positive integer", 400);
    const normalized = items.map(item => {
        positiveInteger(item.variantId, "variantId");
        positiveInteger(item.quantity, "quantity");
        return { variantId: item.variantId, quantity: item.quantity };
    }).sort((a, b) => a.variantId - b.variantId);
    if (new Set(normalized.map(item => item.variantId)).size !== normalized.length) throw stockError("Duplicate variant in reservation", 400);

    // Order -> variant lock ordering matches confirmation after it has locked
    // its reservations, avoiding an order/variant lock cycle on retry.
    await lockOrders(tx, [orderId]);
    const [order, user] = await Promise.all([
        queries.getOrder(tx, orderId, true),
        queries.getUser(tx, userId)
    ]);
    if (!order || order.userId !== userId || order.status !== "pending") throw stockError("ORDER_NOT_PENDING");
    if (!user || user.status !== "verified" || user.deletedAt) throw stockError("CUSTOMER_NOT_ELIGIBLE", 403);
    const orderItems = order.items.map(item => ({ variantId: item.variantId, quantity: item.quantity }));
    const orderedByVariant = new Map();
    for (const item of orderItems) orderedByVariant.set(item.variantId, (orderedByVariant.get(item.variantId) || 0) + item.quantity);
    const requestedByVariant = new Map(normalized.map(item => [item.variantId, item.quantity]));
    if (orderedByVariant.size !== requestedByVariant.size || [...orderedByVariant].some(([id, qty]) => requestedByVariant.get(id) !== qty)) {
        throw stockError("RESERVATION_INVALID");
    }
    await lockVariants(tx, normalized.map(item => item.variantId));

    const prior = await queries.findOrderReservations(tx, orderId);
    if (prior.length) {
        const same = prior.length === normalized.length && prior.every((reservation, index) =>
            reservation.variantId === normalized[index].variantId && reservation.quantity === normalized[index].quantity
        );
        if (same && prior.every(reservation => reservation.status === "active" && reservation.releasedAt === null && reservation.expiresAt > now)) return prior;
        throw stockError("RESERVATION_INVALID");
    }

    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);
    const created = [];
    for (const item of normalized) {
        if (!(await queries.getReservableVariant(tx, item.variantId))) throw stockError("VARIANT_UNAVAILABLE");
        if (await availability(tx, item.variantId, now) < item.quantity) throw stockError("INSUFFICIENT_STOCK");
        created.push(await queries.createReservation(tx, {
            userId, orderId, variantId: item.variantId, quantity: item.quantity, expiresAt
        }));
    }
    return created;
}

async function confirmOrderStock(tx, orderId, now = new Date()) {
    positiveInteger(orderId, "orderId");
    let reservations = await queries.findOrderReservations(tx, orderId, { status: "active", releasedAt: null });
    if (!reservations.length) throw stockError("RESERVATION_INVALID");
    await lockReservations(tx, reservations.map(row => row.id));
    reservations = await queries.findOrderReservations(tx, orderId, {
        id: { in: reservations.map(row => row.id) }, status: "active", releasedAt: null
    });
    if (!reservations.length) throw stockError("RESERVATION_INVALID");
    await lockOrders(tx, [orderId]);
    const order = await queries.getOrder(tx, orderId, true);
    if (!order || order.status !== "pending") throw stockError("ORDER_NOT_PENDING");
    if (reservations.some(row => row.expiresAt <= now)) throw stockError("RESERVATION_EXPIRED");

    const reserved = new Map(reservations.map(row => [row.variantId, row.quantity]));
    const ordered = new Map();
    for (const item of order.items) ordered.set(item.variantId, (ordered.get(item.variantId) || 0) + item.quantity);
    if (ordered.size !== reserved.size || [...ordered].some(([id, qty]) => reserved.get(id) !== qty)) throw stockError("RESERVATION_INVALID");

    await lockVariants(tx, reservations.map(row => row.variantId));
    for (const item of order.items) await consumeFifo(tx, item.variantId, item.quantity, { type: "sale", orderItemId: item.id });
    await queries.updateReservations(tx, reservations.map(row => row.id), { status: "active" }, { status: "converted", releasedAt: now });
    return { orderId, allocatedItems: order.items.length };
}

async function allocateReplacement(tx, { returnRequestId, variantId, quantity }) {
    positiveInteger(returnRequestId, "returnRequestId");
    positiveInteger(variantId, "variantId");
    positiveInteger(quantity, "quantity");
    const request = await queries.findReturnRequest(tx, returnRequestId, true, {
        include: { orderItem: { select: { variantId: true } } }
    });
    if (!request || request.inspectionPassed !== true || request.resolution !== "replacement" ||
        request.orderItem.variantId !== variantId || request.quantity !== quantity) throw stockError("RETURN_INVALID", 422);
    const prior = await queries.findAllocations(tx, { returnRequestId, allocationType: "replacement" }, {
        orderBy: { id: "asc" }, include: { batch: { select: { variantId: true } } }
    });
    if (prior.length) {
        if (prior.reduce((sum, row) => sum + row.quantity, 0) === quantity && prior.every(row => row.batch.variantId === variantId)) return prior;
        throw stockError("RETURN_INVALID", 422);
    }
    if (request.status !== "inspected") throw stockError("RETURN_INVALID", 422);
    await lockVariants(tx, [variantId]);
    if (await availability(tx, variantId) < quantity) throw stockError("INSUFFICIENT_STOCK");
    return consumeFifo(tx, variantId, quantity, { type: "replacement", returnRequestId });
}

async function reverseSale(tx, { orderItemId, quantity, returnRequestId, allocationType }) {
    positiveInteger(orderItemId, "orderItemId");
    if (quantity !== undefined) positiveInteger(quantity, "quantity");
    if (!["restoration", "damaged"].includes(allocationType)) throw stockError("INVALID_ALLOCATION_LINK", 422);
    await lockOrderItems(tx, [orderItemId]);
    const item = await queries.getOrderItem(tx, orderItemId);
    if (!item) throw stockError("ORDER_ITEM_NOT_FOUND", 404);

    let request = null;
    if (returnRequestId !== undefined) {
        positiveInteger(returnRequestId, "returnRequestId");
        request = await queries.findReturnRequest(tx, returnRequestId, true, {
            select: { orderItemId: true, quantity: true, status: true, inspectionPassed: true }
        });
        if (!request || request.orderItemId !== orderItemId || request.inspectionPassed !== (allocationType === "restoration")) {
            throw stockError("RETURN_INVALID", 422);
        }
        if (quantity !== undefined && quantity !== request.quantity) throw stockError("RETURN_INVALID", 422);
    }
    const requestedQuantity = request ? request.quantity : quantity;
    if (returnRequestId !== undefined) {
        const existing = await queries.findAllocations(tx, {
            returnRequestId,
            allocationType: { in: ["restoration", "damaged"] }
        }, { orderBy: { id: "asc" } });
        if (existing.length) {
            if (existing.some(row => row.allocationType !== allocationType) ||
                existing.reduce((sum, row) => sum + row.quantity, 0) !== requestedQuantity) throw stockError("RETURN_INVALID", 422);
            return existing;
        }
        if (request.status !== "inspected") throw stockError("RETURN_INVALID", 422);
    }

    const sales = await queries.findAllocations(tx, { orderItemId, allocationType: "sale" }, { orderBy: { id: "asc" } });
    await lockBatches(tx, sales.map(row => row.batchId));
    const reversals = sales.length ? await queries.findAllocations(tx, {
        sourceAllocationId: { in: sales.map(row => row.id) }
    }, { select: { sourceAllocationId: true, quantity: true } }) : [];
    const reversed = new Map();
    for (const row of reversals) reversed.set(row.sourceAllocationId, (reversed.get(row.sourceAllocationId) || 0) + row.quantity);

    let remaining = requestedQuantity === undefined ? Number.MAX_SAFE_INTEGER : requestedQuantity;
    const created = [];
    for (const sale of sales) {
        if (!remaining) break;
        const take = Math.min(remaining, sale.quantity - (reversed.get(sale.id) || 0));
        if (take <= 0) continue;
        if (allocationType === "restoration") {
            const batch = await queries.getBatch(tx, sale.batchId, { quantityRemaining: true, quantityReceived: true });
            if (batch.quantityRemaining + take > batch.quantityReceived) throw stockError("RESTORE_EXCEEDS_SOLD", 422);
            await queries.updateBatch(tx, sale.batchId, { quantityRemaining: { increment: take } });
        }
        created.push(await queries.createAllocation(tx, {
            batchId: sale.batchId,
            sourceAllocationId: sale.id,
            quantity: take,
            allocationType,
            ...(returnRequestId ? { returnRequestId } : { orderItemId })
        }));
        remaining -= take;
    }
    if (requestedQuantity !== undefined && remaining > 0) throw stockError("RESTORE_EXCEEDS_SOLD", 422);
    return created;
}

function restoreStock(tx, input) {
    return reverseSale(tx, { ...input, allocationType: "restoration" });
}

function writeOffDamaged(tx, input) {
    positiveInteger(input.quantity, "quantity");
    return reverseSale(tx, { ...input, allocationType: "damaged" });
}

async function adjustStock(tx, { batchId, change, reason, note, userId }) {
    positiveInteger(batchId, "batchId");
    positiveInteger(userId, "userId");
    if (!Number.isSafeInteger(change) || change === 0) throw stockError("change must be a non-zero integer", 400);
    if (!["lost", "stolen", "miscount", "damaged", "found"].includes(reason)) throw stockError("INVALID_ADJUSTMENT_REASON", 400);
    const actor = await queries.getUser(tx, userId);
    if (!actor || actor.role !== "super_admin" || actor.status !== "verified" || actor.deletedAt) throw stockError("FORBIDDEN", 403);
    const batch = await queries.getBatch(tx, batchId, { variantId: true });
    if (!batch) throw stockError("INVENTORY_BATCH_NOT_FOUND", 404);
    await lockVariants(tx, [batch.variantId]);
    await lockBatches(tx, [batchId]);
    const current = await queries.getBatch(tx, batchId);
    const next = current.quantityRemaining + change;
    if (next < 0 || next > current.quantityReceived) throw stockError("INVALID_STOCK_ADJUSTMENT", 422);
    if (change < 0 && await availability(tx, batch.variantId) + change < 0) throw stockError("RESERVED_STOCK");
    await queries.updateBatch(tx, batchId, { quantityRemaining: next });
    const adjustment = await queries.createAdjustment(tx, { batchId, quantityChange: change, reason, note: note ?? null, createdById: userId });
    await queries.createAuditLog(tx, {
        actorUserId: userId,
        entityType: "inventory_batch",
        entityId: batchId,
        action: "stock_adjusted",
        oldValue: { quantityRemaining: current.quantityRemaining },
        newValue: { quantityRemaining: next, change, reason }
    });
    return adjustment;
}

async function releaseExpiredReservations(now = new Date()) {
    return runStockTransaction(async tx => {
        const expired = await queries.findExpiredReservations(tx, now);
        if (!expired.length) return 0;
        const ids = expired.map(row => row.id);
        const orderIds = [...new Set(expired.map(row => row.orderId))].sort((a, b) => a - b);
        await queries.updateReservations(tx, ids, { status: "active" }, { status: "expired", releasedAt: now });
        await lockOrders(tx, orderIds);
        for (const orderId of orderIds) {
            const [activeCount, order] = await Promise.all([
                queries.countReservations(tx, { orderId, status: "active", releasedAt: null, expiresAt: { gt: now } }),
                queries.getOrder(tx, orderId)
            ]);
            if (!activeCount && order?.status === "pending") {
                await queries.updateOrder(tx, orderId, {
                    status: "cancelled", cancelledAt: now,
                    cancellationReason: "Payment not completed within the reservation time"
                });
            }
        }
        return expired.length;
    });
}

async function releaseOrderReservations(tx, orderId, status = "cancelled", cancellation = {}) {
    positiveInteger(orderId, "orderId");
    if (status !== "cancelled") throw stockError("Invalid reservation release status", 400);
    const reservations = await queries.findOrderReservations(tx, orderId, { status: "active", releasedAt: null });
    await lockReservations(tx, reservations.map(row => row.id));
    await lockOrders(tx, [orderId]);
    const order = await queries.getOrder(tx, orderId);
    if (!order || order.status !== "pending") throw stockError("ORDER_NOT_PENDING");
    const now = new Date();
    await queries.updateReservations(tx, reservations.map(row => row.id), { status: "active" }, { status: "cancelled", releasedAt: now });
    return queries.updateOrder(tx, orderId, {
        status: "cancelled",
        cancelledAt: now,
        ...(cancellation.cancelledById ? { cancelledById: cancellation.cancelledById } : {}),
        ...(cancellation.cancellationReason ? { cancellationReason: cancellation.cancellationReason } : {})
    });
}

function publicInventoryVariant(variant) {
    const onHand = variant.batches.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
    const reserved = variant.reservations.reduce((sum, row) => sum + row.quantity, 0);
    return {
        id: variant.id,
        sku: variant.sku,
        sellingPrice: variant.sellingPrice,
        isActive: variant.isActive,
        product: variant.product,
        onHand,
        reserved,
        available: Math.max(0, onHand - reserved)
    };
}

async function listInventory(filters = {}) {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 25);
    if (!Number.isSafeInteger(page) || page < 1) throw stockError("page must be a positive integer", 400);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw stockError("limit must be between 1 and 100", 400);
    const search = String(filters.search ?? "").trim();
    if (search.length > 100) throw stockError("search must be 100 characters or fewer", 400);
    const categoryId = filters.categoryId === undefined ? undefined : Number(filters.categoryId);
    const brandId = filters.brandId === undefined ? undefined : Number(filters.brandId);
    if (categoryId !== undefined) positiveInteger(categoryId, "categoryId");
    if (brandId !== undefined) positiveInteger(brandId, "brandId");
    const criteria = { search: search || undefined, categoryId, brandId };
    const [variants, total] = await Promise.all([
        queries.listInventoryVariants({ ...criteria, skip: (page - 1) * limit, take: limit }),
        queries.countInventoryVariants(criteria)
    ]);
    return {
        data: variants.map(publicInventoryVariant),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
}

async function getVariantInventory(variantId) {
    positiveInteger(variantId, "variantId");
    const variant = await queries.getVariantInventory(variantId);
    if (!variant) throw stockError("VARIANT_UNAVAILABLE", 404);
    const batches = variant.batches;
    const onHand = batches.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
    const reserved = variant.reservations.reduce((sum, row) => sum + row.quantity, 0);
    return { ...variant, onHand, reserved, available: Math.max(0, onHand - reserved) };
}

async function getBatchHistory(batchId) {
    positiveInteger(batchId, "batchId");
    const batch = await queries.getBatchHistory(batchId);
    if (!batch) throw stockError("INVENTORY_BATCH_NOT_FOUND", 404);
    return batch;
}

module.exports = {
    RESERVATION_MINUTES,
    runStockTransaction,
    lockVariants,
    lockBatches,
    lockOrders,
    lockOrderItems,
    lockReservations,
    availability,
    reserveStock,
    confirmOrderStock,
    consumeFifo,
    allocateReplacement,
    restoreStock,
    writeOffDamaged,
    adjustStock,
    releaseExpiredReservations,
    releaseOrderReservations,
    listInventory,
    getVariantInventory,
    getBatchHistory
};
