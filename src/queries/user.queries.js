
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



module.exports = {
    createCustomerWithVerificationToken,
    findValidVerificationToken,
    consumeTokenAndVerifyCustomer,
    findUnverifiedCustomerByEmail,
    createResendVerificationToken,
    invalidateVerificationToken
};
