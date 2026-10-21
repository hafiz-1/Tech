const prisma = require("../config/prisma");

function transaction(work, options) {
    return prisma.$transaction(work, options);
}

function listSuppliers({ includeInactive = false } = {}) {
    return prisma.supplier.findMany({
        where: includeInactive ? {} : { isActive: true, deletedAt: null },
        orderBy: { companyName: "asc" }
    });
}

function findSupplier(id) {
    return prisma.supplier.findUnique({ where: { id } });
}

function createSupplier(tx, data) {
    return tx.supplier.create({ data });
}

function updateSupplier(tx, id, data) {
    return tx.supplier.update({ where: { id }, data });
}

function listPurchaseOrders({ status, skip, take }) {
    return prisma.purchaseOrder.findMany({
        where: status ? { status } : {},
        skip,
        take,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: { supplier: true, items: { include: { variant: { include: { product: true } } } } }
    });
}

function countPurchaseOrders(status) {
    return prisma.purchaseOrder.count({ where: status ? { status } : {} });
}

function getPurchaseOrder(id) {
    return prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            supplier: true,
            items: { orderBy: { id: "asc" }, include: { variant: { include: { product: true } }, batches: true } }
        }
    });
}

async function lockPurchaseOrder(tx, id) {
    const rows = await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id = ${id} FOR UPDATE`;
    return rows.length > 0;
}

async function lockPurchaseOrderItems(tx, ids) {
    if (!ids.length) return [];
    const sorted = [...new Set(ids)].sort((a, b) => a - b);
    const rows = await tx.$queryRaw`SELECT id FROM purchase_order_items WHERE id = ANY(${sorted}::int[]) ORDER BY id FOR UPDATE`;
    return rows.length === sorted.length ? rows.map(row => row.id) : null;
}

function getSupplier(tx, id) {
    return tx.supplier.findFirst({ where: { id, isActive: true, deletedAt: null } });
}

function getVariants(tx, ids) {
    return tx.productVariant.findMany({
        where: { id: { in: ids }, isActive: true, deletedAt: null, product: { deletedAt: null } },
        select: { id: true }
    });
}

function createPurchaseOrder(tx, supplierId, items) {
    return tx.purchaseOrder.create({
        data: {
            supplierId,
            status: "draft",
            items: { create: items.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity,
                purchasePrice: item.purchasePrice
            })) }
        },
        include: { supplier: true, items: true }
    });
}

function updateDraftPurchaseOrder(tx, id, supplierId, items) {
    return tx.purchaseOrder.update({
        where: { id },
        data: {
            supplierId,
            items: {
                deleteMany: {},
                create: items.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    purchasePrice: item.purchasePrice
                }))
            }
        },
        include: { supplier: true, items: true }
    });
}

function updatePurchaseOrder(tx, id, data) {
    return tx.purchaseOrder.update({ where: { id }, data });
}

function getPurchaseOrderForUpdate(tx, id) {
    return tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: { orderBy: { id: "asc" } } }
    });
}

function updatePurchaseOrderItem(tx, id, data) {
    return tx.purchaseOrderItem.update({ where: { id }, data });
}

function createInventoryBatch(tx, data) {
    return tx.inventoryBatch.create({ data });
}

function createAuditLog(tx, data) {
    return tx.auditLog.create({ data });
}

function countReceivedBatches(tx, purchaseOrderId) {
    return tx.inventoryBatch.count({ where: { purchaseOrderId } });
}

module.exports = {
    transaction,
    listSuppliers,
    findSupplier,
    createSupplier,
    updateSupplier,
    listPurchaseOrders,
    countPurchaseOrders,
    getPurchaseOrder,
    lockPurchaseOrder,
    lockPurchaseOrderItems,
    getSupplier,
    getVariants,
    createPurchaseOrder,
    updateDraftPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrderForUpdate,
    updatePurchaseOrderItem,
    createInventoryBatch,
    createAuditLog,
    countReceivedBatches
};
