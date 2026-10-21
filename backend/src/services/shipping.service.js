const prisma = require("../config/prisma");
const queries = require("../queries/shipping.queries");

function shippingError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function positiveId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw shippingError(400, "shippingRateId must be a positive integer");
    return id;
}

function normalizeCity(value) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 100) {
        throw shippingError(400, "city is required and must be 100 characters or fewer");
    }
    return value.trim();
}

function normalizeFee(value) {
    const fee = Number(value);
    if (!Number.isFinite(fee) || fee < 0 || !/^\d{1,10}(\.\d{1,2})?$/.test(String(value))) {
        throw shippingError(400, "fee must be a non-negative amount with at most 2 decimal places");
    }
    return fee.toFixed(2);
}

async function listPublicRates() {
    return queries.listShippingRates(false);
}

async function listAdminRates(includeInactive) {
    return queries.listShippingRates(includeInactive === "true");
}

async function createRate(input, actorUserId) {
    const city = normalizeCity(input.city);
    const fee = normalizeFee(input.fee);
    return prisma.$transaction(async tx => {
        if (await queries.findRateByCity(tx, city)) throw shippingError(409, "An active shipping rate already exists for this city");
        const rate = await queries.createRate(tx, { city, fee, isActive: true });
        await queries.createAuditLog(tx, actorUserId, rate.id, "shipping_rate_created", { city, fee });
        return rate;
    }, { isolationLevel: "Serializable" });
}

async function updateRate(idValue, input, actorUserId) {
    const id = positiveId(idValue);
    const data = {};
    if (input.city !== undefined) data.city = normalizeCity(input.city);
    if (input.fee !== undefined) data.fee = normalizeFee(input.fee);
    if (input.isActive !== undefined) {
        if (typeof input.isActive !== "boolean") throw shippingError(400, "isActive must be a boolean");
        data.isActive = input.isActive;
    }
    if (!Object.keys(data).length) throw shippingError(400, "No valid fields provided");
    return prisma.$transaction(async tx => {
        const existing = await queries.findRate(tx, id);
        if (!existing) throw shippingError(404, "Shipping rate not found");
        const resultingCity = data.city ?? existing.city;
        const remainsActive = data.isActive ?? existing.isActive;
        if (remainsActive && await queries.findRateByCity(tx, resultingCity, id)) {
            throw shippingError(409, "An active shipping rate already exists for this city");
        }
        const rate = await queries.updateRate(tx, id, data);
        await queries.createAuditLog(tx, actorUserId, id, "shipping_rate_updated", data);
        return rate;
    }, { isolationLevel: "Serializable" });
}

module.exports = { listPublicRates, listAdminRates, createRate, updateRate };
