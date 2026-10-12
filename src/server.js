
require("dotenv").config();

const validateEnv = require("./config/env");

validateEnv();

const prisma = require("./config/prisma");
const app = require("./app");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await prisma.$connect();
        console.log("Database connected");

        const server = app.listen(PORT, () => {
            console.log(`TechCart server running on port ${PORT}`);
        });

        module.exports = server;
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
    }
}

startServer();
