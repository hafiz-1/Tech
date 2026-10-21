const service = require("../services/stock.service");

function handle(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

const listInventory = handle(async (req, res) => {
    res.json({ success: true, ...(await service.listInventory(req.query)) });
});

const getVariantInventory = handle(async (req, res) => {
    res.json({ success: true, data: await service.getVariantInventory(Number(req.params.variantId)) });
});

const getBatchHistory = handle(async (req, res) => {
    res.json({ success: true, data: await service.getBatchHistory(Number(req.params.batchId)) });
});

const adjustStock = handle(async (req, res) => {
    const data = await service.runStockTransaction(tx => service.adjustStock(tx, {
        batchId: Number(req.params.batchId),
        change: req.body.change,
        reason: req.body.reason,
        note: req.body.note,
        userId: req.user.id
    }));
    res.status(201).json({ success: true, data });
});

module.exports = { listInventory, getVariantInventory, getBatchHistory, adjustStock };
