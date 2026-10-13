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

module.exports = {
    createLoginSession
};