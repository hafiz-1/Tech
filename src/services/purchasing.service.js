const queries = require("../queries/purchasing.queries");
const stockService = require("./stock.service");

const PO_STATUSES = ["draft", "ordered", "partially_received", "received", "cancelled"];

function purchasingError(code, statusCode = 409) {
    const error = new Error(code);
    error.code = code;
    error.statusCode = statusCode;
    return error;
}

function positiveId(value, field) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw purchasingError(`${field} must be a positive integer`, 400);
    return id;
}

function positiveQuantity(value, field = "quantity") {
    if (!Number.isSafeInteger(value) || value <= 0) throw purchasingError(`${field} must be a positive integer`, 400);
    return value;
}

function parseMoney(value, field) {
    const raw = String(value ?? "").trim();
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(raw)) throw purchasingError(`${field} must be a non-negative amount with at most 2 decimal places`, 400);
    return Number(raw).toFixed(2);
}

function optionalString(input, field, maxLength = 500) {
    const value = input[field];
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || value.trim().length > maxLength) {
        throw purchasingError(`${field} must be a string of at most ${maxLength} characters`, 400);
    }
    return value.trim();
}

function normalizeItems(items) {
    if (!Array.isArray(items) || !items.length) throw purchasingError("At least one purchase order item is required", 400);
    const normalized = items.map((item, index) => ({
        variantId: positiveId(item.variantId, `items[${index}].variantId`),
        quantity: positiveQuantity(item.quantity, `items[${index}].quantity`),
        purchasePrice: parseMoney(item.purchasePrice, `items[${index}].purchasePrice`)
    }));
    if (new Set(normalized.map(item => item.variantId)).size !== normalized.length) {
        throw purchasingError("A variant can appear only once in a purchase order", 400);
    }
    return normalized;
}

async function validateVariants(tx, items) {
    const ids = items.map(item => item.variantId);
    const variants = await queries.getVariants(tx, ids);
    if (variants.length !== ids.length) throw purchasingError("VARIANT_UNAVAILABLE", 422);
}

function actorAudit(tx, actorUserId, entityType, entityId, action, newValue) {
    return queries.createAuditLog(tx, {
        actorUserId, entityType, entityId, action, newValue
    });
}

async function listSuppliers(filters = {}) {
    return queries.listSuppliers({ includeInactive: filters.includeInactive === "true" });
}

async function createSupplier(input, actorUserId) {
    const companyName = typeof input.companyName === "string" ? input.companyName.trim() : "";
    if (!companyName || companyName.length > 200) throw purchasingError("companyName is required and must be 200 characters or fewer", 400);
    const data = {
        companyName,
        contactPerson: optionalString(input, "contactPerson", 200),
        phone: optionalString(input, "phone", 50),
        email: optionalString(input, "email", 254)?.toLowerCase() ?? null,
        address: optionalString(input, "address", 1000),
        licenseNumber: optionalString(input, "licenseNumber", 100),
        isActive: true
    };
    return stockService.runStockTransaction(async tx => {
        const supplier = await queries.createSupplier(tx, data);
        await actorAudit(tx, actorUserId, "supplier", supplier.id, "supplier_created", { companyName });
        return supplier;
    });
}

async function updateSupplier(idValue, input, actorUserId) {
    const id = positiveId(idValue, "supplierId");
    const existing = await queries.findSupplier(id);
    if (!existing) throw purchasingError("SUPPLIER_NOT_FOUND", 404);
    const data = {};
    const optionalStrings = ["companyName", "contactPerson", "phone", "email", "address", "licenseNumber"];
    for (const field of optionalStrings) {
        if (input[field] === undefined) continue;
        const maxLength = { companyName: 200, contactPerson: 200, phone: 50, email: 254, address: 1000, licenseNumber: 100 }[field];
        const value = optionalString(input, field, maxLength);
        if (field === "companyName") {
            if (!value || value.length > 200) throw purchasingError("companyName is required and must be 200 characters or fewer", 400);
            data[field] = value;
        } else if (field === "email") data[field] = value?.toLowerCase() ?? null;
        else data[field] = value;
    }
    if (input.isActive !== undefined) {
        if (typeof input.isActive !== "boolean") throw purchasingError("isActive must be a boolean", 400);
        data.isActive = input.isActive;
    }
    if (!Object.keys(data).length) throw purchasingError("No valid fields provided", 400);
    return stockService.runStockTransaction(async tx => {
        const supplier = await queries.updateSupplier(tx, id, data);
        await actorAudit(tx, actorUserId, "supplier", id, "supplier_updated", data);
        return supplier;
    });
}

async function deactivateSupplier(idValue, actorUserId) {
    const id = positiveId(idValue, "supplierId");
    const existing = await queries.findSupplier(id);
    if (!existing) throw purchasingError("SUPPLIER_NOT_FOUND", 404);
    return stockService.runStockTransaction(async tx => {
        const supplier = await queries.updateSupplier(tx, id, { isActive: false, deletedAt: new Date() });
        await actorAudit(tx, actorUserId, "supplier", id, "supplier_deactivated", { isActive: false });
        return supplier;
    });
}

async function listPurchaseOrders(filters = {}) {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 25);
    if (!Number.isSafeInteger(page) || page < 1) throw purchasingError("page must be a positive integer", 400);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw purchasingError("limit must be between 1 and 100", 400);
    const status = filters.status;
    if (status && !PO_STATUSES.includes(status)) throw purchasingError("Invalid purchase order status", 400);
    const [data, total] = await Promise.all([
        queries.listPurchaseOrders({ status, skip: (page - 1) * limit, take: limit }),
        queries.countPurchaseOrders(status)
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getPurchaseOrder(idValue) {
    const id = positiveId(idValue, "purchaseOrderId");
    const order = await queries.getPurchaseOrder(id);
    if (!order) throw purchasingError("PURCHASE_ORDER_NOT_FOUND", 404);
    return order;
}

async function createPurchaseOrder(input, actorUserId) {
    const supplierId = positiveId(input.supplierId, "supplierId");
    const items = normalizeItems(input.items);
    return stockService.runStockTransaction(async tx => {
        if (!(await queries.getSupplier(tx, supplierId))) throw purchasingError("SUPPLIER_NOT_FOUND", 422);
        await validateVariants(tx, items);
        const order = await queries.createPurchaseOrder(tx, supplierId, items);
        await queries.createAuditLog(tx, {
            actorUserId, entityType: "purchase_order", entityId: order.id,
            action: "purchase_order_created", newValue: { supplierId, itemCount: items.length }
        });
        return order;
    });
}

async function updatePurchaseOrder(idValue, input, actorUserId) {
    const id = positiveId(idValue, "purchaseOrderId");
    const supplierId = positiveId(input.supplierId, "supplierId");
    const items = normalizeItems(input.items);
    return stockService.runStockTransaction(async tx => {
        if (!(await queries.lockPurchaseOrder(tx, id))) throw purchasingError("PURCHASE_ORDER_NOT_FOUND", 404);
        const order = await queries.getPurchaseOrderForUpdate(tx, id);
        if (order.status !== "draft") throw purchasingError("PURCHASE_ORDER_NOT_DRAFT");
        if (!(await queries.getSupplier(tx, supplierId))) throw purchasingError("SUPPLIER_NOT_FOUND", 422);
        await validateVariants(tx, items);
        const updated = await queries.updateDraftPurchaseOrder(tx, id, supplierId, items);
        await queries.createAuditLog(tx, {
            actorUserId, entityType: "purchase_order", entityId: id,
            action: "purchase_order_updated", newValue: { supplierId, itemCount: items.length }
        });
        return updated;
    });
}

async function placePurchaseOrder(idValue, actorUserId) {
    const id = positiveId(idValue, "purchaseOrderId");
    return stockService.runStockTransaction(async tx => {
        if (!(await queries.lockPurchaseOrder(tx, id))) throw purchasingError("PURCHASE_ORDER_NOT_FOUND", 404);
        const order = await queries.getPurchaseOrderForUpdate(tx, id);
        if (order.status !== "draft") throw purchasingError("PURCHASE_ORDER_NOT_DRAFT");
        if (!order.items.length) throw purchasingError("Purchase order needs at least one item", 422);
        const now = new Date();
        const updated = await queries.updatePurchaseOrder(tx, id, { status: "ordered", orderedAt: now });
        await queries.createAuditLog(tx, {
            actorUserId, entityType: "purchase_order", entityId: id,
            action: "purchase_order_placed", newValue: { status: "ordered" }
        });
        return updated;
    });
}

async function receivePurchaseOrder(idValue, input, actorUserId) {
    const id = positiveId(idValue, "purchaseOrderId");
    if (!Array.isArray(input.items) || !input.items.length) throw purchasingError("At least one receipt line is required", 400);
    const receipts = input.items.map((line, index) => ({
        purchaseOrderItemId: positiveId(line.purchaseOrderItemId, `items[${index}].purchaseOrderItemId`),
        quantity: positiveQuantity(line.quantity, `items[${index}].quantity`),
        batchReference: optionalString(line, "batchReference", 200)
    }));
    if (new Set(receipts.map(row => row.purchaseOrderItemId)).size !== receipts.length) throw purchasingError("A receipt may include each purchase order line only once", 400);

    return stockService.runStockTransaction(async tx => {
        if (!(await queries.lockPurchaseOrder(tx, id))) throw purchasingError("PURCHASE_ORDER_NOT_FOUND", 404);
        let order = await queries.getPurchaseOrderForUpdate(tx, id);
        if (!["ordered", "partially_received"].includes(order.status)) throw purchasingError("PURCHASE_ORDER_NOT_RECEIVABLE");
        const itemIds = receipts.map(row => row.purchaseOrderItemId);
        if (await queries.lockPurchaseOrderItems(tx, itemIds) === null) throw purchasingError("PURCHASE_ORDER_ITEM_NOT_FOUND", 404);
        order = await queries.getPurchaseOrderForUpdate(tx, id);
        const itemById = new Map(order.items.map(item => [item.id, item]));
        const now = new Date();
        const receivedBatches = [];
        for (const receipt of receipts) {
            const line = itemById.get(receipt.purchaseOrderItemId);
            if (!line) throw purchasingError("PURCHASE_ORDER_ITEM_NOT_FOUND", 404);
            if (line.receivedQuantity + receipt.quantity > line.quantity) throw purchasingError("RECEIVED_EXCEEDS_ORDERED", 422);
            const batch = await queries.createInventoryBatch(tx, {
                variantId: line.variantId,
                supplierId: order.supplierId,
                purchaseOrderId: id,
                purchaseOrderItemId: line.id,
                batchReference: receipt.batchReference,
                purchasePrice: line.purchasePrice,
                quantityReceived: receipt.quantity,
                quantityRemaining: receipt.quantity,
                receivedAt: now
            });
            await queries.updatePurchaseOrderItem(tx, line.id, { receivedQuantity: { increment: receipt.quantity } });
            line.receivedQuantity += receipt.quantity;
            receivedBatches.push(batch);
            await queries.createAuditLog(tx, {
                actorUserId, entityType: "inventory_batch", entityId: batch.id,
                action: "inventory_received",
                newValue: { purchaseOrderId: id, purchaseOrderItemId: line.id, quantity: receipt.quantity }
            });
        }
        const fullyReceived = order.items.every(line => line.receivedQuantity === line.quantity);
        const status = fullyReceived ? "received" : "partially_received";
        const updatedOrder = await queries.updatePurchaseOrder(tx, id, {
            status,
            ...(fullyReceived ? { receivedAt: now } : {})
        });
        await queries.createAuditLog(tx, {
            actorUserId, entityType: "purchase_order", entityId: id,
            action: "purchase_order_received", newValue: { status, batchCount: receivedBatches.length }
        });
        return { purchaseOrder: updatedOrder, batches: receivedBatches };
    });
}

async function cancelPurchaseOrder(idValue, actorUserId) {
    const id = positiveId(idValue, "purchaseOrderId");
    return stockService.runStockTransaction(async tx => {
        if (!(await queries.lockPurchaseOrder(tx, id))) throw purchasingError("PURCHASE_ORDER_NOT_FOUND", 404);
        const order = await queries.getPurchaseOrderForUpdate(tx, id);
        if (["received", "cancelled"].includes(order.status)) throw purchasingError("PURCHASE_ORDER_NOT_CANCELLABLE");
        if (order.items.some(item => item.receivedQuantity > 0)) throw purchasingError("PURCHASE_ORDER_HAS_RECEIPTS");
        const updated = await queries.updatePurchaseOrder(tx, id, { status: "cancelled" });
        await queries.createAuditLog(tx, {
            actorUserId, entityType: "purchase_order", entityId: id,
            action: "purchase_order_cancelled", newValue: { status: "cancelled" }
        });
        return updated;
    });
}

module.exports = {
    listSuppliers,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    listPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    placePurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder
};
