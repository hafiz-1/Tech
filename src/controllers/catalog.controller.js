const service = require("../services/catalog.service");

function handle(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res)).catch(next);
    };
}

const listCategories = handle(async (req, res) => {
    res.json({ success: true, data: await service.listCategories() });
});

const listBrands = handle(async (req, res) => {
    res.json({ success: true, data: await service.listBrands() });
});

const listProducts = handle(async (req, res) => {
    const result = await service.listProducts(req.query);
    res.json({ success: true, ...result });
});

const getProduct = handle(async (req, res) => {
    res.json({ success: true, data: await service.getProduct(req.params.id) });
});

const createCategory = handle(async (req, res) => {
    res.status(201).json({
        success: true,
        data: await service.createNamedRecord("category", req.body)
    });
});

const updateCategory = handle(async (req, res) => {
    res.json({
        success: true,
        data: await service.editNamedRecord("category", req.params.id, req.body)
    });
});

const deleteCategory = handle(async (req, res) => {
    await service.softDeleteNamedRecord("category", req.params.id);
    res.json({ success: true, message: "Category deleted" });
});

const createBrand = handle(async (req, res) => {
    res.status(201).json({
        success: true,
        data: await service.createNamedRecord("brand", req.body)
    });
});

const updateBrand = handle(async (req, res) => {
    res.json({
        success: true,
        data: await service.editNamedRecord("brand", req.params.id, req.body)
    });
});

const deleteBrand = handle(async (req, res) => {
    await service.softDeleteNamedRecord("brand", req.params.id);
    res.json({ success: true, message: "Brand deleted" });
});

const createProduct = handle(async (req, res) => {
    res.status(201).json({
        success: true,
        data: await service.createProduct(req.body)
    });
});

const updateProduct = handle(async (req, res) => {
    res.json({
        success: true,
        data: await service.editProduct(req.params.id, req.body)
    });
});

const deleteProduct = handle(async (req, res) => {
    await service.softDeleteProduct(req.params.id);
    res.json({ success: true, message: "Product deleted" });
});

const createVariant = handle(async (req, res) => {
    res.status(201).json({
        success: true,
        data: await service.createVariant(req.params.id, req.body)
    });
});

const updateVariant = handle(async (req, res) => {
    res.json({
        success: true,
        data: await service.editVariant(req.params.variantId, req.body)
    });
});

const deleteVariant = handle(async (req, res) => {
    await service.softDeleteVariant(req.params.variantId);
    res.json({ success: true, message: "Variant deleted" });
});

module.exports = {
    listCategories,
    listBrands,
    listProducts,
    getProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    createBrand,
    updateBrand,
    deleteBrand,
    createProduct,
    updateProduct,
    deleteProduct,
    createVariant,
    updateVariant,
    deleteVariant
};