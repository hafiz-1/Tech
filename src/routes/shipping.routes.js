const express = require("express");
const controller = require("../controllers/shipping.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/admin.middleware");

const router = express.Router();
router.get("/shipping-rates", controller.listPublicRates);
router.get("/admin/shipping-rates", requireAuth, requireSuperAdmin, controller.listAdminRates);
router.post("/admin/shipping-rates", requireAuth, requireSuperAdmin, controller.createRate);
router.patch("/admin/shipping-rates/:shippingRateId", requireAuth, requireSuperAdmin, controller.updateRate);

module.exports = router;
