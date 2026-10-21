const service = require("../services/shipping.service");

function handle(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

const listPublicRates = handle(async (req, res) => {
    res.json({ success: true, data: await service.listPublicRates() });
});

const listAdminRates = handle(async (req, res) => {
    res.json({ success: true, data: await service.listAdminRates(req.query.includeInactive) });
});

const createRate = handle(async (req, res) => {
    res.status(201).json({ success: true, data: await service.createRate(req.body || {}, req.user.id) });
});

const updateRate = handle(async (req, res) => {
    res.json({ success: true, data: await service.updateRate(req.params.shippingRateId, req.body || {}, req.user.id) });
});

module.exports = { listPublicRates, listAdminRates, createRate, updateRate };
