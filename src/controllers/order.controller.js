const service = require("../services/order.service");

function handle(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

const getCart = handle(async (req, res) => {
    res.json({ success: true, data: await service.getCart(req.user.id) });
});

const addCartItem = handle(async (req, res) => {
    res.status(201).json({ success: true, data: await service.addCartItem(req.user.id, req.body || {}) });
});

const updateCartItem = handle(async (req, res) => {
    res.json({ success: true, data: await service.updateCartItem(req.user.id, req.params.itemId, req.body || {}) });
});

const removeCartItem = handle(async (req, res) => {
    await service.removeCartItem(req.user.id, req.params.itemId);
    res.json({ success: true, message: "Cart item removed" });
});

const clearCart = handle(async (req, res) => {
    await service.clearCart(req.user.id);
    res.json({ success: true, message: "Cart cleared" });
});

const checkout = handle(async (req, res) => {
    res.status(201).json({ success: true, data: await service.checkout(req.user.id, req.body || {}) });
});

const listOrders = handle(async (req, res) => {
    res.json({ success: true, ...(await service.listOrders(req.user.id, req.query)) });
});

const getOrder = handle(async (req, res) => {
    res.json({ success: true, data: await service.getOrder(req.user.id, req.params.orderId) });
});

const cancelOrder = handle(async (req, res) => {
    res.json({ success: true, data: await service.cancelOrder(req.user.id, req.params.orderId) });
});

module.exports = { getCart, addCartItem, updateCartItem, removeCartItem, clearCart, checkout, listOrders, getOrder, cancelOrder };
