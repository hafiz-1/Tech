
const prisma = require("../config/prisma");

// Create a customer and its verification token atomically.
function createCustomerWithVerificationToken({
    userData,
    tokenData
}) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: userData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        await tx.authToken.create({
            data: {
                ...tokenData,
                userId: user.id
            }
        });

        return user;
    });
}

// Find a valid verification token for an unverified customer.
function findValidVerificationToken({ email, tokenHash, now }) {
    return prisma.authToken.findFirst({
        where: {
            type: "email_verification",
            tokenHash,
            usedAt: null,
            expiresAt: { gt: now },
            user: {
                email,
                status: "unverified"
            }
        },
        select: {
            id: true,
            userId: true
        }
    });
}

// Consume the token and verify the customer atomically.
function consumeTokenAndVerifyCustomer({ tokenId, userId, now }) {
    return prisma.$transaction(async (tx) => {
        const consumed = await tx.authToken.updateMany({
            where: {
                id: tokenId,
                usedAt: null,
                expiresAt: { gt: now }
            },
            data: { usedAt: now }
        });

        if (consumed.count !== 1) {
            const error = new Error(
                "Invalid or expired verification code"
            );
            error.statusCode = 400;
            throw error;
        }

        return tx.user.update({
            where: { id: userId },
            data: {
                status: "verified",
                emailVerifiedAt: now
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                emailVerifiedAt: true
            }
        });
    });
}


// Find an unverified customer by email.

async function findUnverifiedCustomerByEmail(email) {
    return prisma.user.findFirst({
        where: {
            email,
            role: "customer",
            status: "unverified"
        },
        select: {
            id: true,
            email: true
        }
    });
}

async function createResendVerificationToken({
    userId,
    tokenHash,
    expiresAt
}) {
    const now = new Date();
    const cooldownStart = new Date(now.getTime() - 60 * 1000);
    const hourStart = new Date(now.getTime() - 60 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
        const recentTokens = await tx.authToken.count({
            where: {
                userId,
                type: "email_verification",
                createdAt: { gte: hourStart }
            }
        });

        const latestToken = await tx.authToken.findFirst({
            where: {
                userId,
                type: "email_verification"
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true }
        });

        // Enforce a 60-second cooldown and a maximum of
        // 5 verification tokens per hour.
        if (
            (latestToken && latestToken.createdAt > cooldownStart) ||
            recentTokens >= 5
        ) {
            return false;
        }

        await tx.authToken.updateMany({
            where: {
                userId,
                type: "email_verification",
                usedAt: null
            },
            data: { usedAt: now }
        });

        await tx.authToken.create({
            data: {
                userId,
                type: "email_verification",
                tokenHash,
                expiresAt
            }
        });

        return true;
    });
}

async function invalidateVerificationToken(tokenHash) {
    await prisma.authToken.updateMany({
        where: {
            tokenHash,
            type: "email_verification",
            usedAt: null
        },
        data: { usedAt: new Date() }
    });
}


// Find a user by email, including sensitive fields like passwordHash and tokenVersion.

function findUserByEmail(email) {
    return prisma.user.findUnique({
        where: {
            email
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            passwordHash: true,
            role: true,
            status: true,
            emailVerifiedAt: true,
            tokenVersion: true
        }
    });
}

// Find an authenticated user by ID.

async function findAuthUserById(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
              name: true,
              email: true,
            role: true,
            status: true,
            tokenVersion: true
        }
    });
}


// Create a new login session and its initial refresh token atomically.
async function createAuthSession({
    userId,
    tokenVersion,
    refreshTokenHash,
    expiresAt,
    absoluteExpiresAt,
    userAgent
}) {
    return prisma.$transaction(async (tx) => {
        const session = await tx.authSession.create({
            data: {
                userId,
                tokenVersion,
                expiresAt,
                absoluteExpiresAt,
                userAgent: userAgent || null
            }
        });

        await tx.refreshToken.create({
            data: {
                sessionId: session.id,
                tokenHash: refreshTokenHash,
                expiresAt
            }
        });

        return {
            id: session.id,
            expiresAt: session.expiresAt,
            absoluteExpiresAt: session.absoluteExpiresAt
        };
    });
}

// Find a refresh token and its associated session and user.
function findRefreshToken(tokenHash) {
    return prisma.refreshToken.findUnique({
        where: { tokenHash },
        select: {
            id: true,
            sessionId: true,
            expiresAt: true,
            usedAt: true,
            revokedAt: true,
            session: {
                select: {
                    id: true,
                    userId: true,
                    expiresAt: true,
                    absoluteExpiresAt: true,
                    revokedAt: true,
                    user: {
                        select: {
                            id: true,
                            role: true,
                            status: true,
                            tokenVersion: true
                        }
                    }
                }
            }
        }
    });
}

// Revoke a session and all its refresh tokens atomically.
async function revokeAuthSession({ sessionId, reason }) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
        const sessionUpdate = await tx.authSession.updateMany({
            where: {
                id: sessionId,
                revokedAt: null
            },
            data: {
                revokedAt: now,
                revocationReason: reason
            }
        });

        await tx.refreshToken.updateMany({
            where: {
                sessionId,
                revokedAt: null
            },
            data: {
                revokedAt: now
            }
        });

        return sessionUpdate.count === 1;
    });
}


// Atomically consume a refresh token and create its replacement.
async function rotateRefreshToken({
    oldTokenId,
    sessionId,
    newTokenHash
}) {
    return prisma.$transaction(async (tx) => {
        const now = new Date();

        // Serialize refresh attempts for this session.
        await tx.$queryRaw`
            SELECT id
            FROM auth_sessions
            WHERE id = ${sessionId}
            FOR UPDATE
        `;

        const session = await tx.authSession.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                userId: true,
                tokenVersion: true,
                expiresAt: true,
                absoluteExpiresAt: true,
                revokedAt: true,
                user: {
                    select: {
                        id: true,
                        status: true,
                        tokenVersion: true
                    }
                }
            }
        });

        const oldToken = await tx.refreshToken.findUnique({
            where: { id: oldTokenId },
            select: {
                id: true,
                sessionId: true,
                expiresAt: true,
                usedAt: true,
                revokedAt: true
            }
        });

        if (
            !session ||
            !oldToken ||
            oldToken.sessionId !== sessionId ||
            session.revokedAt ||
            session.expiresAt <= now ||
            session.absoluteExpiresAt <= now ||
            session.user.status !== "verified" ||
            session.tokenVersion !== session.user.tokenVersion
        ) {
            return { status: "invalid_session" };
        }

        if (oldToken.revokedAt) {
            return { status: "invalid_token" };
        }

        // Reuse of a previously consumed token revokes this session.
        if (oldToken.usedAt) {
            await tx.authSession.update({
                where: { id: sessionId },
                data: {
                    revokedAt: now,
                    revocationReason: "refresh_token_reuse"
                }
            });

            await tx.refreshToken.updateMany({
                where: {
                    sessionId,
                    revokedAt: null
                },
                data: { revokedAt: now }
            });

            return { status: "reuse_detected" };
        }

        if (oldToken.expiresAt <= now) {
            return { status: "invalid_token" };
        }

        const consumed = await tx.refreshToken.updateMany({
            where: {
                id: oldTokenId,
                sessionId,
                usedAt: null,
                revokedAt: null,
                expiresAt: { gt: now }
            },
            data: { usedAt: now }
        });

        if (consumed.count !== 1) {
            return { status: "invalid_token" };
        }

        const expiresAt = new Date(
            Math.min(
                now.getTime() + 7 * 24 * 60 * 60 * 1000,
                session.absoluteExpiresAt.getTime()
            )
        );

        await tx.refreshToken.create({
            data: {
                sessionId,
                tokenHash: newTokenHash,
                expiresAt
            }
        });

        await tx.authSession.update({
            where: { id: sessionId },
            data: {
                expiresAt,
                lastSeenAt: now
            }
        });

        return {
            status: "rotated",
            userId: session.user.id,
            tokenVersion: session.user.tokenVersion,
            expiresAt
        };
    });
}


module.exports = {
    createCustomerWithVerificationToken,
    findValidVerificationToken,
    consumeTokenAndVerifyCustomer,
    findUnverifiedCustomerByEmail,
    createResendVerificationToken,
    invalidateVerificationToken,
    findUserByEmail,
    findAuthUserById,
    createAuthSession,
    findRefreshToken,
    revokeAuthSession,
    rotateRefreshToken
};
