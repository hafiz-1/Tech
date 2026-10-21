
require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("../src/config/prisma");

async function seedSuperAdmin() {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error(
            "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set"
        );
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

seedSuperAdmin()
    .catch((error) => {
        console.error("Super Admin seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
