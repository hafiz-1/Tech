
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const userQueries = require("../queries/user.queries");
const { sendVerificationEmail } = require("./email.service");

async function registerCustomer({ name, email, phone, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Generate a cryptographically secure 6-digit OTP.
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store only the hash, never the actual OTP.
    const tokenHash = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    // OTP expires after 10 minutes.
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const passwordHash = await bcrypt.hash(password, 12);

    let user;

   
    try {
        user = await userQueries.createCustomerWithVerificationToken({
            userData: {
                name: name.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                passwordHash,
                role: "customer",
                status: "unverified"
            },
            tokenData: {
                type: "email_verification",
                tokenHash,
                expiresAt
            }
        });
    } catch (error) {
        if (
            error.code === "P2002" &&
            (
                Array.isArray(error.meta?.target)
                    ? error.meta.target.includes("email")
                    : String(error.meta?.target || "").includes("email")
            )
        ) {
            const conflict = new Error(
                "An account with this email already exists"
            );
            conflict.statusCode = 409;
            throw conflict;
        }

        throw error;
    }


    // Send the OTP only after the account and token are saved.
    try {
        await sendVerificationEmail(user.email, otp);
    } catch (error) {
        console.error(
            "Verification email could not be sent:",
            error.message
        );
    }

    return user;
}


async function verifyCustomerEmail({ email, otp }) {
    const normalizedEmail = email.trim().toLowerCase();

    const tokenHash = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    
    const now = new Date();

    const token = await userQueries.findValidVerificationToken({
        email: normalizedEmail,
        tokenHash,
        now
    });

    if (!token) {
        const error = new Error(
            "Invalid or expired verification code"
        );
        error.statusCode = 400;
        throw error;
    }

    return userQueries.consumeTokenAndVerifyCustomer({
        tokenId: token.id,
        userId: token.userId,
        now
    });
}

// Resend a verification OTP to an unverified customer.

async function resendVerificationOtp({ email }) {
    const normalizedEmail = email.trim().toLowerCase();

    const genericMessage =
        "If an unverified account exists for this email, a verification code will be sent.";

    const user = await userQueries.findUnverifiedCustomerByEmail(
        normalizedEmail
    );

    // Do not reveal whether an account exists or is verified.
    if (!user) {
        return { message: genericMessage };
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const tokenHash = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const created = await userQueries.createResendVerificationToken({
        userId: user.id,
        tokenHash,
        expiresAt
    });

    // Cooldown or hourly limit reached.
    if (!created) {
        return { message: genericMessage };
    }

    try {
        await sendVerificationEmail(user.email, otp);
    } catch (error) {
        console.error(
            "Resend verification email failed:",
            error.message
        );

        // Invalidate the code if delivery fails.
        await userQueries.invalidateVerificationToken(tokenHash);
    }

    return { message: genericMessage };
}



module.exports = {
    registerCustomer,
    verifyCustomerEmail,
    resendVerificationOtp
};