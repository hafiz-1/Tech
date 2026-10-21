const express = require("express");
const controller = require("../controllers/purchasing.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/admin.middleware");

const router = express.Router();
const adminOnly = [requireAuth, requireSuperAdmin];

router.get("/suppliers", ...adminOnly, controller.listSuppliers);
router.post("/suppliers", ...adminOnly, controller.createSupplier);
router.patch("/suppliers/:supplierId", ...adminOnly, controller.updateSupplier);
router.delete("/suppliers/:supplierId", ...adminOnly, controller.deactivateSupplier);

router.get("/purchase-orders", ...adminOnly, controller.listPurchaseOrders);
router.post("/purchase-orders", ...adminOnly, controller.createPurchaseOrder);
router.get("/purchase-orders/:purchaseOrderId", ...adminOnly, controller.getPurchaseOrder);
router.patch("/purchase-orders/:purchaseOrderId", ...adminOnly, controller.updatePurchaseOrder);
router.post("/purchase-orders/:purchaseOrderId/place", ...adminOnly, controller.placePurchaseOrder);
router.post("/purchase-orders/:purchaseOrderId/receive", ...adminOnly, controller.receivePurchaseOrder);
router.post("/purchase-orders/:purchaseOrderId/cancel", ...adminOnly, controller.cancelPurchaseOrder);

module.exports = router;
