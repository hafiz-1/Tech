
const jwt = require("jsonwebtoken");
const userQueries = require("../queries/user.queries");

async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.auth_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        let payload;

        try {
            payload = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: "techcart-api",
                audience: "techcart-client"
            });
        } catch (error) {
            console.error("JWT verification failed:", error.name, error.message);
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token"
            });
        }

        if (
            typeof payload.sub !== "string" ||
            !Number.isInteger(payload.tokenVersion)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        const userId = Number(payload.sub);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        const user = await userQueries.findAuthUserById(userId);

        if (!user || user.status !== "verified") {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.status(401).json({
                success: false,
                message: "Session is no longer valid. Please log in again."
            });
        }

        req.user = {
            id: user.id,
            role: user.role,
            status: user.status
        };

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireAuth };
