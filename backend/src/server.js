
require("dotenv").config();

const validateEnv = require("./config/env");

validateEnv();

const prisma = require("./config/prisma");
const app = require("./app");
const stockService = require("./services/stock.service");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await prisma.$connect();
        console.log("Database connected");

        let expirySweepRunning = false;
        const sweepExpiredReservations = async () => {
            if (expirySweepRunning) return;
            expirySweepRunning = true;
            try {
                const expiredCount = await stockService.releaseExpiredReservations();
                if (expiredCount) console.log(`Released ${expiredCount} expired stock reservation(s)`);
            } catch (error) {
                console.error("Reservation expiry sweep failed:", error.message);
            } finally {
                expirySweepRunning = false;
            }
        };
        void sweepExpiredReservations();
        const expirySweep = setInterval(sweepExpiredReservations, 60 * 1000);
        expirySweep.unref();

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
