const prisma = require("../config/prisma");

function listShippingRates(includeInactive = false) {
    return prisma.shippingRate.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: [{ city: "asc" }, { id: "asc" }]
    });
}

function findRateByCity(tx, city, exceptId) {
    return tx.shippingRate.findFirst({
        where: {
            isActive: true,
            city: { equals: city, mode: "insensitive" },
            ...(exceptId ? { id: { not: exceptId } } : {})
        }
    });
}

function findRate(tx, id) {
    return tx.shippingRate.findUnique({ where: { id } });
}

function createRate(tx, data) {
    return tx.shippingRate.create({ data });
}

function updateRate(tx, id, data) {
    return tx.shippingRate.update({ where: { id }, data });
}

function createAuditLog(tx, actorUserId, entityId, action, newValue) {
    return tx.auditLog.create({
        data: { actorUserId, entityType: "shipping_rate", entityId, action, newValue }
    });
}

module.exports = { listShippingRates, findRateByCity, findRate, createRate, updateRate, createAuditLog };
