
require("dotenv").config();

const prisma = require("../src/config/prisma");

async function testDatabaseConnection() {
    try {
        const result = await prisma.$queryRaw`SELECT version() AS database_version`;

        console.log("Database connection successful!");
        console.log(result[0].database_version);
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseConnection();
