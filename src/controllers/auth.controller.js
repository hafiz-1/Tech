const { registerCustomer, verifyCustomerEmail, resendVerificationOtp, loginCustomer } = require("../services/auth.service");

const { createLoginSession, logoutSession } = require("../services/session.service");

const { refreshLoginSession } = require("../services/session.service");

async function register(req, res, next) {
    try {
        const { name, email, phone, password, confirmPassword } =
            req.body || {};

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "All registration fields are required"
            });
        }

        if (
            !name.trim() ||
            !email.trim() ||
            !phone.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            password.length < 4 ||
            password !== confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Please check your registration details"
            });
        }

        const user = await registerCustomer({
            name,
            email,
            phone,
            password
        });

        return res.status(201).json({
            success: true,
            message: "Account created. Please verify your email.",
            data: user
        });
    } catch (error) {
        next(error);
    }
}


async function verifyEmail(req, res, next) {
    try {
        const { email, otp } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid email and 6-digit verification code are required"
            });
        }

        const user = await verifyCustomerEmail({ email, otp });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully.",
            data: user
        });
    } catch (error) {
        next(error);
    }
}


// Resend verification OTP

async function resendOtp(req, res, next) {
    try {
        const { email } = req.body;

        if (
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
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

// Login function 

async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};

        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const customer = await loginCustomer({ email, password });
        const session = await createLoginSession(customer, req.get("user-agent"));

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        };

        res.cookie("auth_token", session.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
            path: "/"
        });

        res.cookie("refresh_token", session.refreshToken, {
            ...cookieOptions,
            maxAge: Math.max(0, new Date(session.session.expiresAt).getTime() - Date.now()),
            path: "/api/auth"
        });

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
//  logout function

async function logout(req, res, next) {
    try {
        await logoutSession(req.user.sessionId);

        for (const [name, path] of [
            ["auth_token", "/"],
            ["refresh_token", "/api/auth"]
        ]) {
            res.clearCookie(name, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path
            });
        }

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        next(error);
    }
}

// Refresh session function

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

        res.cookie("auth_token", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            path: "/"
        });

        const refreshMaxAge = Math.max(
            0,
            new Date(result.expiresAt).getTime() - Date.now()
        );

        res.cookie("refresh_token", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: refreshMaxAge,
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

module.exports = {
    register, verifyEmail, resendOtp, login, logout, refresh
};