require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const SUPPLIER = {
    companyName: "TechCart Distribution (Pvt) Ltd",
    contactPerson: "Bilal Ahmed",
    phone: "+92 300 1112233",
    email: "supply@techcart.pk",
    address: "Plot 12, Tech Avenue, Gulberg III, Lahore",
    licenseNumber: "TC-SUP-2024-001"
};

const CATEGORIES = [
    ["Smartphones", "Flagship and everyday phones from the brands you trust."],
    ["Laptops", "Ultrabooks, workstations and everyday notebooks."],
    ["Audio", "Headphones, earbuds and portable speakers."],
    ["Wearables", "Smart watches and fitness trackers."],
    ["Cameras", "Mirrorless bodies, lenses and creator kits."],
    ["Gaming", "Consoles and controllers for every setup."],
    ["Monitors", "High-refresh displays for work and play."],
    ["Tablets", "Tablets for study, work and entertainment."]
];

const BRANDS = [
    ["Apple", "Premium phones, laptops, tablets and wearables."],
    ["Samsung", "Galaxy phones, tablets, watches and displays."],
    ["Sony", "Audio, imaging and PlayStation hardware."],
    ["Dell", "Business and creator laptops."],
    ["HP", "Everyday and premium convertibles."],
    ["Google", "Pixel phones and smart accessories."],
    ["Canon", "Mirrorless cameras and creator lenses."],
    ["JBL", "Portable audio and party speakers."],
    ["LG", "UltraGear monitors and displays."],
    ["Microsoft", "Xbox consoles and productivity devices."]
];

const SHIPPING_RATES = [
    ["Lahore", 250],
    ["Karachi", 350],
    ["Islamabad", 300],
    ["Rawalpindi", 300],
    ["Faisalabad", 280],
    ["Multan", 320],
    ["Peshawar", 380],
    ["Quetta", 450]
];

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const PRODUCTS = [
    {
        name: "Apple iPhone 15 Pro",
        category: "Smartphones",
        brand: "Apple",
        description:
            "Titanium build, A17 Pro chip and a 48MP main camera. USB-C charging with all-day battery life.",
        images: [img("photo-1695048133142-1a20484d2569"), img("photo-1592750475338-74b7b21085ab")],
        specifications: {
            Display: "6.1\" Super Retina XDR OLED",
            Processor: "Apple A17 Pro",
            Camera: "48MP + 12MP + 12MP",
            Battery: "3274 mAh"
        },
        variants: [
            { sku: "APL-IP15P-256-NT", price: 329999, stock: 12, specs: { Storage: "256GB", Color: "Natural Titanium" } },
            { sku: "APL-IP15P-512-BT", price: 369999, stock: 6, specs: { Storage: "512GB", Color: "Blue Titanium" } }
        ]
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        category: "Smartphones",
        brand: "Samsung",
        description:
            "Galaxy AI, a built-in S Pen and a 200MP camera sensor. Bright 6.8\" QHD+ display with 120Hz refresh.",
        images: [img("photo-1610945265064-0e34e5519bbf"), img("photo-1511707171634-5f897ff02aa9")],
        specifications: {
            Display: "6.8\" QHD+ Dynamic AMOLED 2X",
            Processor: "Snapdragon 8 Gen 3",
            Camera: "200MP + 50MP + 12MP + 10MP",
            Battery: "5000 mAh"
        },
        variants: [
            { sku: "SAM-S24U-256-TG", price: 299999, stock: 15, specs: { Storage: "256GB", Color: "Titanium Gray" } },
            { sku: "SAM-S24U-512-TV", price: 329999, stock: 8, specs: { Storage: "512GB", Color: "Titanium Violet" } }
        ]
    },
    {
        name: "Google Pixel 8 Pro",
        category: "Smartphones",
        brand: "Google",
        description:
            "Tensor G3 powered Pixel with best-in-class computational photography and seven years of updates.",
        images: [img("photo-1598327105666-5b89351aff97")],
        specifications: {
            Display: "6.7\" LTPO OLED",
            Processor: "Google Tensor G3",
            Camera: "50MP + 48MP + 48MP",
            Battery: "5050 mAh"
        },
        variants: [
            { sku: "GOO-PX8P-128-OB", price: 219999, stock: 0, specs: { Storage: "128GB", Color: "Obsidian" } }
        ]
    },
    {
        name: "Apple MacBook Air 13\" M3",
        category: "Laptops",
        brand: "Apple",
        description:
            "Fanless M3 ultrabook with an 18-hour battery, Liquid Retina display and MagSafe charging.",
        images: [img("photo-1517336714731-489689fd1ca8"), img("photo-1496181133206-80ce9b88a853")],
        specifications: {
            Display: "13.6\" Liquid Retina",
            Processor: "Apple M3 (8-core)",
            Memory: "8GB / 16GB unified",
            Storage: "256GB / 512GB SSD"
        },
        variants: [
            { sku: "APL-MBA13-M3-8256", price: 359999, stock: 10, specs: { Memory: "8GB", Storage: "256GB", Color: "Midnight" } },
            { sku: "APL-MBA13-M3-16512", price: 429999, stock: 5, specs: { Memory: "16GB", Storage: "512GB", Color: "Starlight" } }
        ]
    },
    {
        name: "Dell XPS 13 Plus",
        category: "Laptops",
        brand: "Dell",
        description:
            "Edge-to-edge keyboard, 13th-gen Intel power and a 13.4\" OLED panel in a 1.26kg chassis.",
        images: [img("photo-1593642632823-8f785ba67e45")],
        specifications: {
            Display: "13.4\" 3.5K OLED",
            Processor: "Intel Core i7-1360P",
            Memory: "16GB LPDDR5",
            Storage: "512GB SSD"
        },
        variants: [
            { sku: "DEL-XPS13-16512", price: 289999, stock: 7, specs: { Memory: "16GB", Storage: "512GB", Color: "Graphite" } }
        ]
    },
    {
        name: "HP Spectre x360 14",
        category: "Laptops",
        brand: "HP",
        description:
            "A 2-in-1 convertible with a 2.8K OLED touchscreen, bundled stylus and all-day battery.",
        images: [img("photo-1496181133206-80ce9b88a853")],
        specifications: {
            Display: "14\" 2.8K OLED touch",
            Processor: "Intel Core Ultra 7",
            Memory: "16GB",
            Storage: "1TB SSD"
        },
        variants: [
            { sku: "HP-SPX14-161TB", price: 319999, stock: 4, specs: { Memory: "16GB", Storage: "1TB", Color: "Nightfall Black" } }
        ]
    },
    {
        name: "Sony WH-1000XM5",
        category: "Audio",
        brand: "Sony",
        description:
            "Industry-leading noise cancellation, 30-hour battery and multipoint pairing in a lighter frame.",
        images: [img("photo-1618366712010-f4ae9c647dcb"), img("photo-1505740420928-5e560c06d30e")],
        specifications: {
            Type: "Over-ear wireless",
            "Noise cancellation": "Adaptive ANC",
            Battery: "Up to 30 hours",
            Connectivity: "Bluetooth 5.2, multipoint"
        },
        variants: [
            { sku: "SNY-XM5-BLK", price: 89999, stock: 18, specs: { Color: "Black" } },
            { sku: "SNY-XM5-SLV", price: 89999, stock: 9, specs: { Color: "Platinum Silver" } }
        ]
    },
    {
        name: "Apple AirPods Pro (2nd gen)",
        category: "Audio",
        brand: "Apple",
        description:
            "USB-C charging case, adaptive audio and twice the active noise cancellation of the previous generation.",
        images: [img("photo-1600294037681-c80b4cb5b434")],
        specifications: {
            Type: "In-ear true wireless",
            "Noise cancellation": "Adaptive ANC",
            Battery: "Up to 6 hours (30 with case)",
            Connectivity: "Bluetooth 5.3"
        },
        variants: [
            { sku: "APL-APP2-USBC", price: 64999, stock: 25, specs: { Color: "White" } }
        ]
    },
    {
        name: "JBL Flip 6",
        category: "Audio",
        brand: "JBL",
        description:
            "Portable IP67 speaker with bold JBL Pro Sound, 12-hour playtime and party mode pairing.",
        images: [img("photo-1608043152269-423dbba4e7e1")],
        specifications: {
            Type: "Portable Bluetooth speaker",
            Battery: "Up to 12 hours",
            "Water resistance": "IP67",
            Connectivity: "Bluetooth 5.1"
        },
        variants: [
            { sku: "JBL-FLIP6-BLK", price: 24999, stock: 30, specs: { Color: "Black" } },
            { sku: "JBL-FLIP6-BLU", price: 24999, stock: 14, specs: { Color: "Blue" } }
        ]
    },
    {
        name: "Apple Watch Series 9",
        category: "Wearables",
        brand: "Apple",
        description:
            "S9 chip with double-tap gestures, a brighter 2000-nit display and advanced health sensors.",
        images: [img("photo-1434493789847-2f02dc6ca35d")],
        specifications: {
            Display: "Always-On Retina",
            Processor: "Apple S9",
            Battery: "Up to 18 hours",
            "Water resistance": "50 metres"
        },
        variants: [
            { sku: "APL-AW9-41-MID", price: 119999, stock: 11, specs: { Size: "41mm", Color: "Midnight" } },
            { sku: "APL-AW9-45-SLV", price: 129999, stock: 6, specs: { Size: "45mm", Color: "Silver" } }
        ]
    },
    {
        name: "Samsung Galaxy Watch 6",
        category: "Wearables",
        brand: "Samsung",
        description:
            "Slim bezel design with advanced sleep coaching, ECG and body composition tracking.",
        images: [img("photo-1523275335684-37898b6baf30")],
        specifications: {
            Display: "1.5\" Super AMOLED",
            Battery: "425 mAh",
            Sensors: "ECG, BioActive",
            "Water resistance": "5ATM + IP68"
        },
        variants: [
            { sku: "SAM-GW6-44-GPH", price: 74999, stock: 13, specs: { Size: "44mm", Color: "Graphite" } }
        ]
    },
    {
        name: "Canon EOS R50",
        category: "Cameras",
        brand: "Canon",
        description:
            "Compact 24.2MP mirrorless with 4K video, Dual Pixel autofocus and a creator-friendly kit lens.",
        images: [img("photo-1516035069371-29a1b244cc32")],
        specifications: {
            Sensor: "24.2MP APS-C CMOS",
            Video: "4K 30fps",
            Autofocus: "Dual Pixel CMOS AF II",
            Mount: "RF-S"
        },
        variants: [
            { sku: "CAN-R50-KIT", price: 189999, stock: 0, specs: { Kit: "18-45mm", Color: "Black" } }
        ]
    },
    {
        name: "Sony Alpha ZV-E10",
        category: "Cameras",
        brand: "Sony",
        description:
            "Vlog-first APS-C mirrorless with a flip-out screen, directional mic and product showcase mode.",
        images: [img("photo-1502920917128-1aa500764cbd")],
        specifications: {
            Sensor: "24.2MP APS-C Exmor",
            Video: "4K 30fps",
            Audio: "Directional 3-capsule mic",
            Mount: "E-mount"
        },
        variants: [
            { sku: "SNY-ZVE10-KIT", price: 209999, stock: 5, specs: { Kit: "16-50mm", Color: "Black" } }
        ]
    },
    {
        name: "Sony PlayStation 5 Slim",
        category: "Gaming",
        brand: "Sony",
        description:
            "The smaller PS5 with a 1TB SSD, 4K 120Hz output and the DualSense haptic controller.",
        images: [img("photo-1606813907291-d86efa9b94db")],
        specifications: {
            Storage: "1TB SSD",
            Resolution: "Up to 4K 120Hz",
            "Included": "DualSense controller",
            Edition: "Disc"
        },
        variants: [
            { sku: "SNY-PS5-SLIM-1TB", price: 159999, stock: 9, specs: { Edition: "Disc", Storage: "1TB" } }
        ]
    },
    {
        name: "Xbox Series S",
        category: "Gaming",
        brand: "Microsoft",
        description:
            "All-digital next-gen console with Quick Resume, 120fps support and a compact footprint.",
        images: [img("photo-1621259182978-fbf93132d53d")],
        specifications: {
            Storage: "512GB SSD",
            Resolution: "Up to 1440p 120fps",
            "Included": "Wireless controller",
            Edition: "Digital"
        },
        variants: [
            { sku: "MSF-XSS-512", price: 94999, stock: 16, specs: { Storage: "512GB", Color: "Robot White" } }
        ]
    },
    {
        name: "LG UltraGear 27\" 240Hz",
        category: "Monitors",
        brand: "LG",
        description:
            "QHD Nano IPS gaming monitor with a 240Hz refresh rate and 1ms response for competitive play.",
        images: [img("photo-1527443224154-c4a3942d3acf")],
        specifications: {
            Panel: "27\" QHD Nano IPS",
            Refresh: "240Hz",
            Response: "1ms GtG",
            Ports: "DisplayPort, HDMI"
        },
        variants: [
            { sku: "LG-27GR-240", price: 89999, stock: 8, specs: { Size: "27\"", Resolution: "QHD" } }
        ]
    },
    {
        name: "Apple iPad Air 11\" M2",
        category: "Tablets",
        brand: "Apple",
        description:
            "M2-powered iPad Air with a Liquid Retina display and support for the new Apple Pencil Pro.",
        images: [img("photo-1544244015-0df4b3ffc6b0")],
        specifications: {
            Display: "11\" Liquid Retina",
            Processor: "Apple M2",
            Storage: "128GB / 256GB",
            Connectivity: "Wi-Fi 6E"
        },
        variants: [
            { sku: "APL-IPADAIR-M2-128", price: 189999, stock: 10, specs: { Storage: "128GB", Color: "Space Grey" } },
            { sku: "APL-IPADAIR-M2-256", price: 219999, stock: 4, specs: { Storage: "256GB", Color: "Blue" } }
        ]
    },
    {
        name: "Samsung Galaxy Tab S9",
        category: "Tablets",
        brand: "Samsung",
        description:
            "11\" AMOLED tablet with the Snapdragon 8 Gen 2 and an S Pen included in the box.",
        images: [img("photo-1561154464-82e9adf32764")],
        specifications: {
            Display: "11\" Dynamic AMOLED 2X",
            Processor: "Snapdragon 8 Gen 2",
            Storage: "256GB",
            "Included": "S Pen"
        },
        variants: [
            { sku: "SAM-TABS9-256-GPH", price: 219999, stock: 6, specs: { Storage: "256GB", Color: "Graphite" } }
        ]
    }
];

async function seedSuperAdmin() {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.log("Skipping admin seed: ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are not set.");
        return;
    }

    if (ADMIN_PASSWORD.length < 4) {
        throw new Error("Admin password must be at least 4 characters");
    }

    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existingAdmin = await prisma.user.findFirst({
        where: { role: "super_admin" },
        select: { id: true }
    });

    if (existingAdmin) {
        console.log("A Super Admin already exists. No changes made.");
        return;
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
    });

    if (existingUser) {
        throw new Error(
            "This email already belongs to an account. Choose a different admin email."
        );
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 4);

    await prisma.user.create({
        data: {
            name: ADMIN_NAME.trim(),
            email,
            passwordHash,
            role: "super_admin",
            status: "verified",
            emailVerifiedAt: new Date()
        }
    });

    console.log("Super Admin created successfully.");
}

async function findOrCreateCategory(name, description) {
    const existing = await prisma.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" } }
    });
    if (existing) return existing;
    const created = await prisma.category.create({ data: { name, description } });
    console.log(`  + category ${name}`);
    return created;
}

async function findOrCreateBrand(name, description) {
    const existing = await prisma.brand.findFirst({
        where: { name: { equals: name, mode: "insensitive" } }
    });
    if (existing) return existing;
    const created = await prisma.brand.create({ data: { name, description } });
    console.log(`  + brand ${name}`);
    return created;
}

async function seedCatalog() {
    console.log("Seeding demo catalog...");

    let supplier = await prisma.supplier.findFirst({
        where: { companyName: SUPPLIER.companyName }
    });
    if (!supplier) {
        supplier = await prisma.supplier.create({ data: SUPPLIER });
        console.log(`  + supplier ${SUPPLIER.companyName}`);
    }

    const categories = {};
    for (const [name, description] of CATEGORIES) {
        categories[name] = await findOrCreateCategory(name, description);
    }

    const brands = {};
    for (const [name, description] of BRANDS) {
        brands[name] = await findOrCreateBrand(name, description);
    }

    let purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: { supplierId: supplier.id, status: "received" }
    });
    if (!purchaseOrder) {
        purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                supplierId: supplier.id,
                status: "received",
                orderedAt: daysAgo(21),
                receivedAt: daysAgo(14)
            }
        });
        console.log("  + received purchase order for demo stock");
    }

    for (const [index, item] of PRODUCTS.entries()) {
        const category = categories[item.category];
        const brand = brands[item.brand];

        if (!category || !brand) {
            console.warn(`  ! skipping ${item.name}: missing category or brand`);
            continue;
        }

        let product = await prisma.product.findFirst({
            where: { name: item.name, deletedAt: null }
        });
        if (!product) {
            product = await prisma.product.create({
                data: {
                    name: item.name,
                    description: item.description,
                    images: item.images,
                    specifications: item.specifications,
                    categoryId: category.id,
                    brandId: brand.id,
                    createdAt: daysAgo(index * 2)
                }
            });
            console.log(`  + product ${item.name}`);
        }

        for (const variant of item.variants) {
            const saved = await prisma.productVariant.upsert({
                where: { sku: variant.sku },
                update: {},
                create: {
                    productId: product.id,
                    sku: variant.sku,
                    sellingPrice: variant.price,
                    specifications: variant.specs,
                    isActive: true
                }
            });

            if (variant.stock <= 0) continue;

            const existingBatch = await prisma.inventoryBatch.findFirst({
                where: { variantId: saved.id }
            });
            if (existingBatch) continue;

            const purchasePrice = Math.round(variant.price * 0.82);
            const orderItem = await prisma.purchaseOrderItem.create({
                data: {
                    purchaseOrderId: purchaseOrder.id,
                    variantId: saved.id,
                    quantity: variant.stock,
                    receivedQuantity: variant.stock,
                    purchasePrice
                }
            });
            await prisma.inventoryBatch.create({
                data: {
                    variantId: saved.id,
                    supplierId: supplier.id,
                    purchaseOrderId: purchaseOrder.id,
                    purchaseOrderItemId: orderItem.id,
                    batchReference: `TC-BATCH-${variant.sku}`,
                    purchasePrice,
                    quantityReceived: variant.stock,
                    quantityRemaining: variant.stock,
                    receivedAt: daysAgo(14)
                }
            });
        }
    }

    for (const [city, fee] of SHIPPING_RATES) {
        const existing = await prisma.shippingRate.findFirst({ where: { city } });
        if (!existing) {
            await prisma.shippingRate.create({ data: { city, fee } });
            console.log(`  + shipping rate ${city}`);
        }
    }

    console.log("Catalog seed complete.");
}

async function main() {
    await seedCatalog();
    await seedSuperAdmin();
}

main()
    .catch((error) => {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
