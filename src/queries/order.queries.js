const prisma = require("../config/prisma");
const client = tx => tx || prisma;

function cartInclude() {
  return {
    items: {
        orderBy: { id: "asc" },
        include: {
            variant: {
                include: {
                    product: { include: { category: true, brand: true } },
                    batches: { select: { quantityRemaining: true } },
                    reservations: {
                        where: { status: "active", releasedAt: null, expiresAt: { gt: new Date() } },
                        select: { quantity: true }
                    }
                }
            }
        }
    }
  };
}

function getOrCreateCart(tx, userId) {
    return client(tx).cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        include: cartInclude()
    });
}

function getCart(tx, userId) {
    return client(tx).cart.findUnique({ where: { userId }, include: cartInclude() });
}

function getCartItem(tx, cartId, variantId) {
    return client(tx).cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
}

function upsertCartItem(tx, cartId, variantId, quantity) {
    return client(tx).cartItem.upsert({
        where: { cartId_variantId: { cartId, variantId } },
        create: { cartId, variantId, quantity },
        update: { quantity }
    });
}

function findOwnedCartItem(tx, userId, itemId) {
    return client(tx).cartItem.findFirst({ where: { id: itemId, cart: { userId } } });
}

function updateCartItem(tx, itemId, quantity) {
    return client(tx).cartItem.update({ where: { id: itemId }, data: { quantity } });
}

function deleteCartItem(tx, itemId) {
    return client(tx).cartItem.delete({ where: { id: itemId } });
}

function clearCart(tx, cartId) {
    return client(tx).cartItem.deleteMany({ where: { cartId } });
}

function getActiveVariant(tx, variantId) {
    return client(tx).productVariant.findFirst({
        where: { id: variantId, deletedAt: null, isActive: true, product: { deletedAt: null } },
        select: {
            id: true, productId: true, sku: true, specifications: true, sellingPrice: true,
            product: {
                select: {
                    id: true, name: true, images: true,
                    category: { select: { id: true, name: true } },
                    brand: { select: { id: true, name: true } }
                }
            }
        }
    });
}

function findShippingRate(tx, city) {
    return client(tx).shippingRate.findFirst({
        where: { isActive: true, city: { equals: city, mode: "insensitive" } },
        orderBy: { id: "asc" },
        select: { id: true, city: true, fee: true }
    });
}

function createOrder(tx, data, items) {
    return client(tx).order.create({ data: { ...data, items: { create: items } }, include: { items: true } });
}

function getCustomerOrders(userId, { skip, take }) {
    return prisma.order.findMany({
        where: { userId }, skip, take, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: { items: { orderBy: { id: "asc" } }, delivery: true }
    });
}

function countCustomerOrders(userId) {
    return prisma.order.count({ where: { userId } });
}

function getCustomerOrder(userId, orderId, tx) {
    return client(tx).order.findFirst({
        where: { id: orderId, userId },
        include: {
            items: { orderBy: { id: "asc" } },
            delivery: true,
            reservations: {
                orderBy: { variantId: "asc" },
                select: { variantId: true, quantity: true, status: true, expiresAt: true, releasedAt: true }
            }
        }
    });
}

module.exports = {
    transaction: (work, options) => prisma.$transaction(work, options),
    getOrCreateCart, getCart, getCartItem, upsertCartItem, findOwnedCartItem,
    updateCartItem, deleteCartItem, clearCart, getActiveVariant, findShippingRate,
    createOrder, getCustomerOrders, countCustomerOrders, getCustomerOrder
};
