const express = require("express");
const controller = require("../controllers/stock.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/admin.middleware");

const router = express.Router();
const adminOnly = [requireAuth, requireSuperAdmin];

router.get("/", ...adminOnly, controller.listInventory);
router.get("/variants/:variantId", ...adminOnly, controller.getVariantInventory);
router.get("/batches/:batchId", ...adminOnly, controller.getBatchHistory);
router.post("/batches/:batchId/adjust", ...adminOnly, controller.adjustStock);

module.exports = router;
