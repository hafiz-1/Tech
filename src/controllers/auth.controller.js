
const { registerCustomer, verifyCustomerEmail, resendVerificationOtp   } = require("../services/auth.service");

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


module.exports = { register, verifyEmail, resendOtp };
