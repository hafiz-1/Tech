const express = require("express");
const controller = require("../controllers/catalog.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/admin.middleware");

const router = express.Router();
const adminOnly = [requireAuth, requireSuperAdmin];

// Public catalog
router.get("/categories", controller.listCategories);
router.get("/brands", controller.listBrands);
router.get("/products", controller.listProducts);
router.get("/products/:id", controller.getProduct);

// Super Admin: categories
router.post("/admin/categories", ...adminOnly, controller.createCategory);
router.patch("/admin/categories/:id", ...adminOnly, controller.updateCategory);
router.delete("/admin/categories/:id", ...adminOnly, controller.deleteCategory);

// Super Admin: brands
router.post("/admin/brands", ...adminOnly, controller.createBrand);
router.patch("/admin/brands/:id", ...adminOnly, controller.updateBrand);
router.delete("/admin/brands/:id", ...adminOnly, controller.deleteBrand);

// Super Admin: products
router.post("/admin/products", ...adminOnly, controller.createProduct);
router.patch("/admin/products/:id", ...adminOnly, controller.updateProduct);
router.delete("/admin/products/:id", ...adminOnly, controller.deleteProduct);

// Super Admin: product variants
router.post("/admin/products/:id/variants", ...adminOnly, controller.createVariant);
router.patch(
    "/admin/variants/:variantId",
    ...adminOnly,
    controller.updateVariant
);
router.delete(
    "/admin/variants/:variantId",
    ...adminOnly,
    controller.deleteVariant
);

module.exports = router;