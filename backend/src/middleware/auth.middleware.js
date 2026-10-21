const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const userQueries = require("../queries/user.queries");

async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.auth_token;
        if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: "techcart-api",
                audience: "techcart-client"
            });
        } catch {
            return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
        }

        const userId = Number(payload.sub);
        if (!Number.isSafeInteger(userId) || userId <= 0 ||
            !Number.isInteger(payload.tokenVersion) ||
            !Number.isInteger(payload.sid) || payload.sid <= 0) {
            return res.status(401).json({ success: false, message: "Invalid authentication token" });
        }

        const [user, session] = await Promise.all([
            userQueries.findAuthUserById(userId),
            prisma.authSession.findUnique({
                where: { id: payload.sid },
                select: {
                    userId: true,
                    tokenVersion: true,
                    expiresAt: true,
                    absoluteExpiresAt: true,
                    revokedAt: true
                }
            })
        ]);

        const now = new Date();

        if (!user || user.status !== "verified" ||
            user.tokenVersion !== payload.tokenVersion ||
            !session || session.userId !== user.id ||
            session.tokenVersion !== user.tokenVersion ||
            session.revokedAt ||
            session.expiresAt <= now ||
            session.absoluteExpiresAt <= now) {
            return res.status(401).json({ success: false, message: "Session is invalid or expired. Please log in again." });
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            sessionId: payload.sid
        };
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireAuth };
