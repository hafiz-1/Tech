const prisma = require("../config/prisma");

const categorySelect = {
    id: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { products: { where: { deletedAt: null } } } }
};

const brandSelect = { ...categorySelect };

async function getCategories(includeDeleted = false) {
    return prisma.category.findMany({
        where: includeDeleted ? {} : { deletedAt: null },
        orderBy: { name: "asc" },
        select: categorySelect
    });
}

async function getBrands(includeDeleted = false) {
    return prisma.brand.findMany({
        where: includeDeleted ? {} : { deletedAt: null },
        orderBy: { name: "asc" },
        select: brandSelect
    });
}

async function getCategoryById(id) {
    return prisma.category.findFirst({
        where: { id, deletedAt: null }
    });
}

async function getBrandById(id) {
    return prisma.brand.findFirst({
        where: { id, deletedAt: null }
    });
}

async function getProductById(id, includeDeleted = false) {
    return prisma.product.findFirst({
        where: {
            id,
            ...(includeDeleted ? {} : { deletedAt: null })
        },
        include: {
            category: true,
            brand: true,
            variants: {
                where: includeDeleted
                    ? {}
                    : { deletedAt: null, isActive: true },
                include: {
                    batches: {
                        select: { quantityRemaining: true }
                    },
                    reservations: {
                        where: {
                            status: "active",
                            expiresAt: { gt: new Date() },
                            releasedAt: null
                        },
                        select: { quantity: true }
                    }
                },
                orderBy: { id: "asc" }
            }
        }
    });
}

async function getProducts() {
    return prisma.product.findMany({
        where: { deletedAt: null },
        include: {
            category: true,
            brand: true,
            variants: {
                where: { deletedAt: null, isActive: true },
                include: {
                    batches: {
                        select: { quantityRemaining: true }
                    },
                    reservations: {
                        where: {
                            status: "active",
                            expiresAt: { gt: new Date() },
                            releasedAt: null
                        },
                        select: { quantity: true }
                    }
                }
            }
        }
    });
}

async function createCategory(data) {
    return prisma.category.create({ data });
}

async function updateCategory(id, data) {
    return prisma.category.update({ where: { id }, data });
}

async function createBrand(data) {
    return prisma.brand.create({ data });
}

async function updateBrand(id, data) {
    return prisma.brand.update({ where: { id }, data });
}

async function createProduct(data) {
    return prisma.product.create({
        data,
        include: { category: true, brand: true }
    });
}

async function updateProduct(id, data) {
    return prisma.product.update({
        where: { id },
        data,
        include: { category: true, brand: true }
    });
}

async function createVariant(data) {
    return prisma.productVariant.create({
        data,
        select: {
            id: true,
            productId: true,
            sku: true,
            specifications: true,
            sellingPrice: true,
            isActive: true,
            createdAt: true
        }
    });
}

async function updateVariant(id, data) {
    return prisma.productVariant.update({
        where: { id },
        data,
        select: {
            id: true,
            productId: true,
            sku: true,
            specifications: true,
            sellingPrice: true,
            isActive: true,
            updatedAt: true
        }
    });
}

module.exports = {
    getCategories,
    getBrands,
    getCategoryById,
    getBrandById,
    getProductById,
    getProducts,
    createCategory,
    updateCategory,
    createBrand,
    updateBrand,
    createProduct,
    updateProduct,
    createVariant,
    updateVariant
};