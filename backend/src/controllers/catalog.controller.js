
const service = require("../services/catalog.service");

// Forward asynchronous errors to Express error-handling middleware
const handle = fn => (req, res, next) =>
    Promise.resolve(fn(req, res)).catch(next);

// Standard success responses
const sendData = (res, data, status = 200) =>
    res.status(status).json({ success: true, data });

// Shared handlers for categories and brands
const createNamedRecord = type => handle(async (req, res) => {
    sendData(res, await service.createNamedRecord(type, req.body), 201);
});

const updateNamedRecord = type => handle(async (req, res) => {
    sendData(
        res,
        await service.editNamedRecord(type, req.params.id, req.body)
    );
});

const deleteNamedRecord = type => handle(async (req, res) => {
    await service.softDeleteNamedRecord(type, req.params.id);
    res.json({ success: true, message: `${type === "category" ? "Category" : "Brand"} deleted` });
});

// List categories
const listCategories = handle(async (req, res) => {
    sendData(res, await service.listCategories());
});

// List brands
const listBrands = handle(async (req, res) => {
    sendData(res, await service.listBrands());
});

// List products with pagination/filter metadata, if provided by the service
const listProducts = handle(async (req, res) => {
    res.json({ success: true, ...await service.listProducts(req.query) });
});

// Get a single product
const getProduct = handle(async (req, res) => {
    sendData(res, await service.getProduct(req.params.id));
});

// Category CRUD
const createCategory = createNamedRecord("category");
const updateCategory = updateNamedRecord("category");
const deleteCategory = deleteNamedRecord("category");

// Brand CRUD
const createBrand = createNamedRecord("brand");
const updateBrand = updateNamedRecord("brand");
const deleteBrand = deleteNamedRecord("brand");

// Product CRUD
const createProduct = handle(async (req, res) => {
    sendData(res, await service.createProduct(req.body), 201);
});

const updateProduct = handle(async (req, res) => {
    sendData(res, await service.editProduct(req.params.id, req.body));
});

const deleteProduct = handle(async (req, res) => {
    await service.softDeleteProduct(req.params.id);
    res.json({ success: true, message: "Product deleted" });
});

// Product variant CRUD
const createVariant = handle(async (req, res) => {
    sendData(res, await service.createVariant(req.params.id, req.body), 201);
});

const updateVariant = handle(async (req, res) => {
    sendData(
        res,
        await service.editVariant(req.params.variantId, req.body)
    );
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
