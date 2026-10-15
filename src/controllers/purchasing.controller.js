const service = require("../services/purchasing.service");

function handle(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

const listSuppliers = handle(async (req, res) => {
    res.json({ success: true, data: await service.listSuppliers(req.query) });
});

const createSupplier = handle(async (req, res) => {
    res.status(201).json({ success: true, data: await service.createSupplier(req.body || {}, req.user.id) });
});

const updateSupplier = handle(async (req, res) => {
    res.json({ success: true, data: await service.updateSupplier(req.params.supplierId, req.body || {}, req.user.id) });
});

const deactivateSupplier = handle(async (req, res) => {
    res.json({ success: true, data: await service.deactivateSupplier(req.params.supplierId, req.user.id) });
});

const listPurchaseOrders = handle(async (req, res) => {
    res.json({ success: true, ...(await service.listPurchaseOrders(req.query)) });
});

const getPurchaseOrder = handle(async (req, res) => {
    res.json({ success: true, data: await service.getPurchaseOrder(req.params.purchaseOrderId) });
});

const createPurchaseOrder = handle(async (req, res) => {
    res.status(201).json({ success: true, data: await service.createPurchaseOrder(req.body || {}, req.user.id) });
});

const updatePurchaseOrder = handle(async (req, res) => {
    res.json({ success: true, data: await service.updatePurchaseOrder(req.params.purchaseOrderId, req.body || {}, req.user.id) });
});

const placePurchaseOrder = handle(async (req, res) => {
    res.json({ success: true, data: await service.placePurchaseOrder(req.params.purchaseOrderId, req.user.id) });
});

const receivePurchaseOrder = handle(async (req, res) => {
    res.status(201).json({ success: true, data: await service.receivePurchaseOrder(req.params.purchaseOrderId, req.body || {}, req.user.id) });
});

const cancelPurchaseOrder = handle(async (req, res) => {
    res.json({ success: true, data: await service.cancelPurchaseOrder(req.params.purchaseOrderId, req.user.id) });
});

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
