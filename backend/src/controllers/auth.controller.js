
const {
    registerCustomer,
    verifyCustomerEmail,
    resendVerificationOtp,
    loginCustomer
} = require("../services/auth.service");

const {
    createLoginSession,
    logoutSession,
    refreshLoginSession
} = require("../services/session.service");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared security settings for authentication cookies
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
};

// Register a customer and initiate email verification
async function register(req, res, next) {
    try {
        const { name, email, phone, password, confirmPassword } = req.body || {};
        console.log("Registration request received:", { name, email, phone });

        // Ensure all required fields are strings
        if (![name, email, phone, password, confirmPassword].every(
            field => typeof field === "string"
        )) {
            return res.status(400).json({
                success: false,
                message: "All registration fields are required"
            });
        }

        // Validate field values and password confirmation
        if (
            !name.trim() ||
            !email.trim() ||
            !phone.trim() ||
            !EMAIL_REGEX.test(email.trim()) ||
            password.length < 4 ||
            password !== confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Please check your registration details"
            });
        }

        const user = await registerCustomer({ name, email, phone, password });
        console.log("User registered:", { id: user.id, email: user.email });
        return res.status(201).json({
            success: true,
            message: "Account created. Please verify your email.",
            data: user
        });
    } catch (error) {
        next(error);
    }
}

// Verify the customer's email using a six-digit OTP
async function verifyEmail(req, res, next) {
    try {
        const { email, otp } = req.body || {};

        // Validate field types, email format, and OTP format
        if (
            ![email, otp].every(field => typeof field === "string") ||
            !EMAIL_REGEX.test(email.trim()) ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid email and 6-digit verification code are required"
            });
        }

        const user = await verifyCustomerEmail({ email, otp });
            console.log("Email verified for user:");
        return res.status(200).json({
            success: true,
            message: "Email verified successfully.",
            data: user
        });
    } catch (error) {
        next(error);
    }
}

// Resend the email verification OTP
async function resendOtp(req, res, next) {
    try {
        const { email } = req.body || {};

        if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        const result = await resendVerificationOtp({ email });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Authenticate the customer and create a session
async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};

        // Ensure both credentials are strings and non-empty
        if (
            ![email, password].every(field => typeof field === "string") ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const customer = await loginCustomer({ email, password });
        const session = await createLoginSession(customer, req.get("user-agent"));
            console.log("Customer logged in and session created:");
        // Set the access token and refresh token cookies
        res.cookie("auth_token", session.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
            path: "/"
        });

        res.cookie("refresh_token", session.refreshToken, {
            ...cookieOptions,
            maxAge: Math.max(
                0,
                new Date(session.session.expiresAt).getTime() - Date.now()
            ),
            path: "/api/auth"
        });

        // Return customer details without exposing tokens
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                role: customer.role,
                status: customer.status
            }
        });
    } catch (error) {
        next(error);
    }
}

// Invalidate the current session and clear authentication cookies
async function logout(req, res, next) {
    try {
        await logoutSession(req.user.sessionId);

        // Cookie paths must match the paths used when setting them
        res.clearCookie("auth_token", { ...cookieOptions, path: "/" });
        res.clearCookie("refresh_token", {
            ...cookieOptions,
            path: "/api/auth"
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        next(error);
    }
}

// Renew the authentication tokens using the refresh token
async function refresh(req, res, next) {
    try {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is missing or expired"
            });
        }

        const result = await refreshLoginSession(refreshToken);

        // Set the renewed authentication cookies
        res.cookie("auth_token", result.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
            path: "/"
        });

        res.cookie("refresh_token", result.refreshToken, {
            ...cookieOptions,
            maxAge: Math.max(
                0,
                new Date(result.expiresAt).getTime() - Date.now()
            ),
            path: "/api/auth"
        });

        return res.status(200).json({
            success: true,
            message: "Session refreshed successfully"
        });
    } catch (error) {
        next(error);
    }
}

// Export controllers for authentication routes
module.exports = {
    register,
    verifyEmail,
    resendOtp,
    login,
    logout,
    refresh
};
