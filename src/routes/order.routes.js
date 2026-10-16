const express = require("express");
const controller = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireCustomer } = require("../middleware/customer.middleware");

const router = express.Router();
router.use(requireAuth, requireCustomer);

router.get("/cart", controller.getCart);
router.post("/cart/items", controller.addCartItem);
router.patch("/cart/items/:itemId", controller.updateCartItem);
router.delete("/cart/items/:itemId", controller.removeCartItem);
router.delete("/cart", controller.clearCart);

router.post("/checkout", controller.checkout);
router.get("/orders", controller.listOrders);
router.get("/orders/:orderId", controller.getOrder);
router.post("/orders/:orderId/cancel", controller.cancelOrder);

module.exports = router;
