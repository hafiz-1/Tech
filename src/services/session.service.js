const userQueries = require("../queries/user.queries");
const { generateAccessToken } = require("../utils/jwt");
const {
    generateRefreshToken,
    hashRefreshToken
} = require("../utils/refresh-token");

const REFRESH_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const ABSOLUTE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

async function createLoginSession(user, userAgent) {
    const now = Date.now();

    const absoluteExpiresAt = new Date(
        now + ABSOLUTE_SESSION_MS
    );

    const expiresAt = new Date(
        Math.min(
            now + REFRESH_SESSION_MS,
            absoluteExpiresAt.getTime()
        )
    );

    // Generate a refresh token and store only its hash.
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // Create the session and initial refresh-token record.
    const session = await userQueries.createAuthSession({
        userId: user.id,
        tokenVersion: user.tokenVersion,
        refreshTokenHash,
        expiresAt,
        absoluteExpiresAt,
        userAgent
    });

    // Bind the access token to this specific session.
    const accessToken = generateAccessToken(
        user,
        session.id
    );

    return {
        accessToken,
        refreshToken,
        session: {
            id: session.id,
            expiresAt: session.expiresAt,
            absoluteExpiresAt: session.absoluteExpiresAt
        }
    };
}

async function refreshLoginSession(refreshToken) {
    if (!refreshToken || typeof refreshToken !== "string") {
        const error = new Error("Invalid or expired refresh token");
        error.statusCode = 401;
        throw error;
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await userQueries.findRefreshToken(tokenHash);

    if (!storedToken) {
        const error = new Error("Invalid or expired refresh token");
        error.statusCode = 401;
        throw error;
    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    const result = await userQueries.rotateRefreshToken({
        oldTokenId: storedToken.id,
        sessionId: storedToken.sessionId,
        newTokenHash: newRefreshTokenHash
    });

    if (result.status !== "rotated") {
        const error = new Error("Invalid or expired refresh token");
        error.statusCode = 401;
        throw error;
    }

    const accessToken = generateAccessToken(
        {
            id: result.userId,
            tokenVersion: result.tokenVersion
        },
        storedToken.sessionId
    );

    return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: result.expiresAt
    };
}

// Revoke a session and its associated refresh tokens.
async function logoutSession(sessionId) {
    await userQueries.revokeAuthSession({
        sessionId,
        reason: "logout"
    });
}

module.exports = {
    createLoginSession,
    refreshLoginSession,
    logoutSession
};