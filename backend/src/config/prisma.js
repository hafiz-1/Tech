
const { PrismaPg } = require("@prisma/adapter-pg");

let PrismaClient;
try {
    ({ PrismaClient } = require("@prisma/client"));
} catch {
    throw new Error(
        "Prisma Client is not generated. Run `npx prisma generate` in the backend folder, then restart the server."
    );
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is missing from environment variables");
}

const adapter = new PrismaPg({
    connectionString
});

const prisma = new PrismaClient({
    adapter
});

module.exports = prisma;
