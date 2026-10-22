const prisma = require("../config/prisma");
const queries = require("../queries/catalog.queries");

function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function positiveId(value, field = "id") {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw httpError(400, `${field} must be a positive integer`);
    }
    return id;
}

function optionalPrice(value, field) {
    if (value === undefined) return undefined;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
        throw httpError(400, `${field} must be a non-negative number`);
    }
    return number;
}

function availabilityFor(variant) {
    const batchStock = variant.batches.reduce(
        (total, batch) => total + batch.quantityRemaining,
        0
    );
    const reserved = variant.reservations.reduce(
        (total, reservation) => total + reservation.quantity,
        0
    );
    return Math.max(0, batchStock - reserved) > 0
        ? "Available"
        : "Out of Stock";
}

function publicProduct(product) {
    const variants = product.variants.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        specifications: variant.specifications,
        // Prisma Decimal values serialize as strings; the storefront expects numbers.
        sellingPrice: Number(variant.sellingPrice),
        availability: availabilityFor(variant)
    }));

    return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        specifications: product.specifications,
        category: product.category
            ? { id: product.category.id, name: product.category.name }
            : null,
        brand: product.brand
            ? { id: product.brand.id, name: product.brand.name }
            : null,
        availability: variants.some(variant => variant.availability === "Available")
            ? "Available"
            : "Out of Stock",
        variants
    };
}

function withProductCount(record) {
    const { _count, ...rest } = record;
    return { ...rest, productCount: _count?.products ?? 0 };
}

async function listCategories() {
    return (await queries.getCategories()).map(withProductCount);
}

async function listBrands() {
    return (await queries.getBrands()).map(withProductCount);
}

async function listProducts(filters) {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 12);

    if (!Number.isInteger(page) || page < 1) {
        throw httpError(400, "page must be a positive integer");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw httpError(400, "limit must be between 1 and 100");
    }

    const minPrice = optionalPrice(filters.minPrice, "minPrice");
    const maxPrice = optionalPrice(filters.maxPrice, "maxPrice");

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        throw httpError(400, "minPrice cannot exceed maxPrice");
    }

    const categoryId = filters.categoryId === undefined
        ? undefined : positiveId(filters.categoryId, "categoryId");
    const brandId = filters.brandId === undefined
        ? undefined : positiveId(filters.brandId, "brandId");

    const sort = filters.sort ?? "newest";
    if (!["newest", "price_asc", "price_desc"].includes(sort)) {
        throw httpError(400, "sort must be newest, price_asc, or price_desc");
    }

    const availability = filters.availability;
    if (availability && !["Available", "Out of Stock"].includes(availability)) {
        throw httpError(400, "availability must be Available or Out of Stock");
    }

    const search = String(filters.search ?? "").trim();
    if (search.length > 100) {
        throw httpError(400, "search must be 100 characters or fewer");
    }

    const products = await queries.getProducts();

    let results = products.filter(product => {
        if (categoryId && product.categoryId !== categoryId) return false;
        if (brandId && product.brandId !== brandId) return false;

        if (search) {
            const term = search.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(term);
            const matchesBrand = product.brand.name.toLowerCase().includes(term);
            if (!matchesName && !matchesBrand) return false;
        }

        const prices = product.variants.map(v => Number(v.sellingPrice));
        if (minPrice !== undefined &&
            !prices.some(price => price >= minPrice)) return false;
        if (maxPrice !== undefined &&
            !prices.some(price => price <= maxPrice)) return false;

        if (availability) {
            const hasMatchingVariant = product.variants.some(variant =>
                availabilityFor(variant) === availability
            );
            if (!hasMatchingVariant) return false;
        }

        return true;
    });

    if (sort === "price_asc") {
        results.sort((a, b) =>
            Math.min(...a.variants.map(v => Number(v.sellingPrice))) -
            Math.min(...b.variants.map(v => Number(v.sellingPrice)))
        );
    } else if (sort === "price_desc") {
        results.sort((a, b) =>
            Math.max(...b.variants.map(v => Number(v.sellingPrice))) -
            Math.max(...a.variants.map(v => Number(v.sellingPrice)))
        );
    } else {
        results.sort((a, b) => b.createdAt - a.createdAt);
    }

    const total = results.length;
    const start = (page - 1) * limit;
    results = results.slice(start, start + limit).map(publicProduct);

    return {
        data: results,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getProduct(id) {
    const productId = positiveId(id);
    const product = await queries.getProductById(productId);
    if (!product) throw httpError(404, "Product not found");
    return publicProduct(product);
}

async function createNamedRecord(type, input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 100) {
        throw httpError(400, "name is required and must be 100 characters or fewer");
    }

    const description = input.description === undefined
        ? undefined : input.description;

    if (description !== undefined && description !== null &&
        typeof description !== "string") {
        throw httpError(400, "description must be a string or null");
    }

    const model = type === "category" ? prisma.category : prisma.brand;
    const existing = await model.findFirst({
        where: { deletedAt: null, name: { equals: name, mode: "insensitive" } }
    });

    if (existing) throw httpError(409, `${type} name already exists`);

    const data = { name, ...(description !== undefined ? { description } : {}) };
    return type === "category"
        ? queries.createCategory(data)
        : queries.createBrand(data);
}

async function editNamedRecord(type, id, input) {
    const recordId = positiveId(id);
    const model = type === "category" ? prisma.category : prisma.brand;
    const existing = await model.findFirst({
        where: { id: recordId, deletedAt: null }
    });
    if (!existing) throw httpError(404, `${type} not found`);

    const data = {};
    if (input.name !== undefined) {
        if (typeof input.name !== "string" ||
            !input.name.trim() || input.name.trim().length > 100) {
            throw httpError(400, "name must be a non-empty string of at most 100 characters");
        }
        const name = input.name.trim();
        const duplicate = await model.findFirst({
            where: {
                id: { not: recordId },
                deletedAt: null,
                name: { equals: name, mode: "insensitive" }
            }
        });
        if (duplicate) throw httpError(409, `${type} name already exists`);
        data.name = name;
    }
    if (input.description !== undefined) {
        if (input.description !== null && typeof input.description !== "string") {
            throw httpError(400, "description must be a string or null");
        }
        data.description = input.description;
    }

    if (!Object.keys(data).length) throw httpError(400, "No valid fields provided");
    return type === "category"
        ? queries.updateCategory(recordId, data)
        : queries.updateBrand(recordId, data);
}

async function softDeleteNamedRecord(type, id) {
    const recordId = positiveId(id);
    const model = type === "category" ? prisma.category : prisma.brand;
    const record = await model.findFirst({
        where: { id: recordId, deletedAt: null }
    });
    if (!record) throw httpError(404, `${type} not found`);

    const linkedProducts = await prisma.product.count({
        where: {
            deletedAt: null,
            ...(type === "category"
                ? { categoryId: recordId }
                : { brandId: recordId })
        }
    });
    if (linkedProducts) {
        throw httpError(409, `Cannot delete ${type} while active products use it`);
    }

    return model.update({
        where: { id: recordId },
        data: { deletedAt: new Date() }
    });
}

async function createProduct(input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 200) throw httpError(400, "Valid product name is required");

    const categoryId = positiveId(input.categoryId, "categoryId");
    const brandId = positiveId(input.brandId, "brandId");

    if (!(await queries.getCategoryById(categoryId))) {
        throw httpError(400, "Active category not found");
    }
    if (!(await queries.getBrandById(brandId))) {
        throw httpError(400, "Active brand not found");
    }

    return queries.createProduct({
        name,
        categoryId,
        brandId,
        description: input.description ?? null,
        images: input.images ?? [],
        specifications: input.specifications ?? {}
    });
}

async function editProduct(id, input) {
    const productId = positiveId(id);
    const existing = await prisma.product.findFirst({
        where: { id: productId, deletedAt: null }
    });
    if (!existing) throw httpError(404, "Product not found");

    const data = {};
    if (input.name !== undefined) {
        if (typeof input.name !== "string" ||
            !input.name.trim() || input.name.trim().length > 200) {
            throw httpError(400, "Valid product name is required");
        }
        data.name = input.name.trim();
    }
    if (input.description !== undefined) data.description = input.description;
    if (input.images !== undefined) {
        if (!Array.isArray(input.images)) throw httpError(400, "images must be an array");
        data.images = input.images;
    }
    if (input.specifications !== undefined) {
        if (!input.specifications || Array.isArray(input.specifications) ||
            typeof input.specifications !== "object") {
            throw httpError(400, "specifications must be an object");
        }
        data.specifications = input.specifications;
    }
    if (input.categoryId !== undefined) {
        const categoryId = positiveId(input.categoryId, "categoryId");
        if (!(await queries.getCategoryById(categoryId))) {
            throw httpError(400, "Active category not found");
        }
        data.categoryId = categoryId;
    }
    if (input.brandId !== undefined) {
        const brandId = positiveId(input.brandId, "brandId");
        if (!(await queries.getBrandById(brandId))) {
            throw httpError(400, "Active brand not found");
        }
        data.brandId = brandId;
    }

    if (!Object.keys(data).length) throw httpError(400, "No valid fields provided");
    return queries.updateProduct(productId, data);
}

async function softDeleteProduct(id) {
    const productId = positiveId(id);
    const product = await prisma.product.findFirst({
        where: { id: productId, deletedAt: null }
    });
    if (!product) throw httpError(404, "Product not found");

    return prisma.product.update({
        where: { id: productId },
        data: { deletedAt: new Date() }
    });
}

async function createVariant(productId, input) {
    const id = positiveId(productId, "productId");
    if (!(await prisma.product.findFirst({
        where: { id, deletedAt: null }
    }))) throw httpError(404, "Product not found");

    const sku = typeof input.sku === "string" ? input.sku.trim() : "";
    if (!sku || sku.length > 100) throw httpError(400, "Valid SKU is required");

    const price = Number(input.sellingPrice);
    if (!Number.isFinite(price) || price < 0) {
        throw httpError(400, "sellingPrice must be a non-negative number");
    }

    if (await prisma.productVariant.findUnique({ where: { sku } })) {
        throw httpError(409, "SKU already exists");
    }

    return queries.createVariant({
        productId: id,
        sku,
        sellingPrice: price,
        specifications: input.specifications ?? {},
        isActive: input.isActive ?? true
    });
}

async function editVariant(variantId, input) {
    const id = positiveId(variantId, "variantId");
    const variant = await prisma.productVariant.findFirst({
        where: { id, deletedAt: null }
    });
    if (!variant) throw httpError(404, "Variant not found");

    const data = {};
    if (input.sku !== undefined) {
        if (typeof input.sku !== "string" || !input.sku.trim()) {
            throw httpError(400, "sku must be a non-empty string");
        }
        const sku = input.sku.trim();
        const duplicate = await prisma.productVariant.findFirst({
            where: { sku, id: { not: id } }
        });
        if (duplicate) throw httpError(409, "SKU already exists");
        data.sku = sku;
    }
    if (input.sellingPrice !== undefined) {
        const price = Number(input.sellingPrice);
        if (!Number.isFinite(price) || price < 0) {
            throw httpError(400, "sellingPrice must be a non-negative number");
        }
        data.sellingPrice = price;
    }
    if (input.specifications !== undefined) {
        if (!input.specifications || Array.isArray(input.specifications) ||
            typeof input.specifications !== "object") {
            throw httpError(400, "specifications must be an object");
        }
        data.specifications = input.specifications;
    }
    if (input.isActive !== undefined) {
        if (typeof input.isActive !== "boolean") {
            throw httpError(400, "isActive must be a boolean");
        }
        data.isActive = input.isActive;
    }
    if (!Object.keys(data).length) throw httpError(400, "No valid fields provided");
    return queries.updateVariant(id, data);
}

async function softDeleteVariant(variantId) {
    const id = positiveId(variantId, "variantId");
    const variant = await prisma.productVariant.findFirst({
        where: { id, deletedAt: null }
    });
    if (!variant) throw httpError(404, "Variant not found");

    return prisma.productVariant.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false }
    });
}

module.exports = {
    listCategories,
    listBrands,
    listProducts,
    getProduct,
    createNamedRecord,
    editNamedRecord,
    softDeleteNamedRecord,
    createProduct,
    editProduct,
    softDeleteProduct,
    createVariant,
    editVariant,
    softDeleteVariant
};
