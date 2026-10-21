const prisma = require("../config/prisma");

async function lockRows(tx, table, ids, required = false) {
    if (!ids.length) return [];
    const sorted = [...new Set(ids)].sort((a, b) => a - b);
    let rows;
    switch (table) {
        case "variants":
            rows = await tx.$queryRaw`SELECT id FROM product_variants WHERE id = ANY(${sorted}::int[]) ORDER BY id FOR UPDATE`;
            break;
        case "batches":
            rows = await tx.$queryRaw`SELECT id FROM inventory_batches WHERE id = ANY(${sorted}::int[]) ORDER BY id FOR UPDATE`;
            break;
        case "orders":
            rows = await tx.$queryRaw`SELECT id FROM orders WHERE id = ANY(${sorted}::int[]) ORDER BY id FOR UPDATE`;
            break;
        case "orderItems":
            rows = await tx.$queryRaw`SELECT id FROM order_items WHERE id = ANY(${sorted}::int[]) ORDER BY id FOR UPDATE`;
            break;
        case "reservations":
            rows = await tx.$queryRaw`SELECT id FROM stock_reservations WHERE id = ANY(${sorted}::int[]) ORDER BY id FOR UPDATE`;
            break;
        default:
            throw new Error(`Unsupported stock lock table: ${table}`);
    }
    if (required && rows.length !== sorted.length) return null;
    return rows.map(row => row.id);
}

async function getAvailability(tx, variantId, now) {
    const [stock] = await tx.$queryRaw`
        SELECT
            COALESCE((SELECT SUM(quantity_remaining) FROM inventory_batches WHERE variant_id = ${variantId}), 0)::bigint AS on_hand,
            COALESCE((SELECT SUM(quantity) FROM stock_reservations
                WHERE variant_id = ${variantId} AND status = 'active'
                  AND released_at IS NULL AND expires_at > ${now}), 0)::bigint AS reserved
    `;
    return { onHand: Number(stock.on_hand), reserved: Number(stock.reserved) };
}

function transaction(work, options) {
    return prisma.$transaction(work, options);
}

async function getOrder(tx, orderId, includeItems = false) {
    return tx.order.findUnique({
        where: { id: orderId },
        ...(includeItems ? { include: { items: { orderBy: { id: "asc" } } } } : {})
    });
}

function getUser(tx, userId) {
    return tx.user.findUnique({ where: { id: userId }, select: { role: true, status: true, deletedAt: true } });
}

function getReservation(tx, id) {
    return tx.stockReservation.findUnique({ where: { id } });
}

function findOrderReservations(tx, orderId, where = {}) {
    return tx.stockReservation.findMany({
        where: { orderId, ...where },
        orderBy: [{ variantId: "asc" }, { id: "asc" }]
    });
}

function createReservation(tx, data) {
    return tx.stockReservation.create({ data });
}

function updateReservations(tx, ids, where, data) {
    return tx.stockReservation.updateMany({ where: { id: { in: ids }, ...where }, data });
}

async function getReservableVariant(tx, variantId) {
    return tx.productVariant.findFirst({
        where: { id: variantId, isActive: true, deletedAt: null, product: { deletedAt: null } },
        select: { id: true }
    });
}

async function getFifoBatches(tx, variantId) {
    return tx.$queryRaw`
        SELECT id, quantity_remaining AS "quantityRemaining"
        FROM inventory_batches
        WHERE variant_id = ${variantId} AND quantity_remaining > 0
        ORDER BY received_at, id
        FOR UPDATE
    `;
}

function decrementBatch(tx, id, quantity) {
    return tx.inventoryBatch.updateMany({
        where: { id, quantityRemaining: { gte: quantity } },
        data: { quantityRemaining: { decrement: quantity } }
    });
}

function createAllocation(tx, data) {
    return tx.inventoryAllocation.create({ data });
}

async function findReturnRequest(tx, id, forUpdate = false, options = {}) {
    if (forUpdate) {
        const [row] = await tx.$queryRaw`SELECT id FROM return_requests WHERE id = ${id} FOR UPDATE`;
        if (!row) return null;
    }
    return tx.returnRequest.findUnique({ where: { id }, ...options });
}

function findAllocations(tx, where, options = {}) {
    return tx.inventoryAllocation.findMany({ where, ...options });
}

function getOrderItem(tx, id) {
    return tx.orderItem.findUnique({ where: { id }, select: { id: true, quantity: true } });
}

function getBatch(tx, id, select) {
    return tx.inventoryBatch.findUnique({ where: { id }, ...(select ? { select } : {}) });
}

function updateBatch(tx, id, data) {
    return tx.inventoryBatch.update({ where: { id }, data });
}

function createAdjustment(tx, data) {
    return tx.stockAdjustment.create({ data });
}

function createAuditLog(tx, data) {
    return tx.auditLog.create({ data });
}

function countReservations(tx, where) {
    return tx.stockReservation.count({ where });
}

function updateOrder(tx, id, data) {
    return tx.order.update({ where: { id }, data });
}

async function findExpiredReservations(tx, now) {
    return tx.$queryRaw`
        SELECT id, order_id AS "orderId" FROM stock_reservations
        WHERE status = 'active' AND released_at IS NULL AND expires_at <= ${now}
        ORDER BY id
        FOR UPDATE SKIP LOCKED
    `;
}

function inventoryWhere({ search, categoryId, brandId }) {
    return {
        deletedAt: null,
        product: {
            deletedAt: null,
            ...(categoryId ? { categoryId } : {}),
            ...(brandId ? { brandId } : {})
        },
        ...(search ? { OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { product: { OR: [
                { name: { contains: search, mode: "insensitive" } },
                { brand: { name: { contains: search, mode: "insensitive" } } }
            ] } }
        ] } : {})
    };
}

function listInventoryVariants({ skip, take, search, categoryId, brandId }) {
    return prisma.productVariant.findMany({
        where: inventoryWhere({ search, categoryId, brandId }),
        skip,
        take,
        orderBy: [{ product: { name: "asc" } }, { id: "asc" }],
        include: {
            product: { include: { category: true, brand: true } },
            batches: { select: { quantityRemaining: true } },
            reservations: {
                where: { status: "active", releasedAt: null, expiresAt: { gt: new Date() } },
                select: { quantity: true }
            }
        }
    });
}

function countInventoryVariants({ search, categoryId, brandId }) {
    return prisma.productVariant.count({ where: inventoryWhere({ search, categoryId, brandId }) });
}

function getVariantInventory(variantId) {
    return prisma.productVariant.findFirst({
        where: { id: variantId, deletedAt: null },
        include: {
            product: { include: { category: true, brand: true } },
            batches: { orderBy: [{ receivedAt: "asc" }, { id: "asc" }], include: { supplier: true, purchaseOrder: true } },
            reservations: {
                where: { status: "active", releasedAt: null, expiresAt: { gt: new Date() } },
                select: { id: true, quantity: true, expiresAt: true, orderId: true }
            }
        }
    });
}

function getBatchHistory(batchId) {
    return prisma.inventoryBatch.findUnique({
        where: { id: batchId },
        include: {
            variant: { include: { product: true } },
            supplier: true,
            purchaseOrder: true,
            purchaseOrderItem: true,
            allocations: { orderBy: { id: "asc" }, include: { orderItem: true, returnRequest: true } },
            adjustments: { orderBy: { id: "asc" } }
        }
    });
}

module.exports = {
    transaction, lockRows, getAvailability, getOrder, getUser,
    getReservation, findOrderReservations, createReservation, updateReservations,
    getReservableVariant, getFifoBatches, decrementBatch, createAllocation,
    findReturnRequest, findAllocations, getOrderItem, getBatch, updateBatch,
    createAdjustment, createAuditLog, countReservations, updateOrder, findExpiredReservations,
    listInventoryVariants, countInventoryVariants, getVariantInventory, getBatchHistory
};
