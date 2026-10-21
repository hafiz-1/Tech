const express = require("express");
const controller = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireCustomer } = require("../middleware/customer.middleware");

const router = express.Router();
const customerOnly = [requireAuth, requireCustomer];

router.get("/cart", ...customerOnly, controller.getCart);
router.post("/cart/items", ...customerOnly, controller.addCartItem);
router.patch("/cart/items/:itemId", ...customerOnly, controller.updateCartItem);
router.delete("/cart/items/:itemId", ...customerOnly, controller.removeCartItem);
router.delete("/cart", ...customerOnly, controller.clearCart);

router.post("/checkout", ...customerOnly, controller.checkout);
router.get("/orders", ...customerOnly, controller.listOrders);
router.get("/orders/:orderId", ...customerOnly, controller.getOrder);
router.post("/orders/:orderId/cancel", ...customerOnly, controller.cancelOrder);

module.exports = router;
