const express = require("express");
const {
    register, verifyEmail, resendOtp, login, logout, refresh
} = require("../controllers/auth.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const router = express.Router();

router.post("/register", register);

router.post("/verify-email", verifyEmail);

router.post("/resend-otp", resendOtp);

router.post("/login", login);

router.get("/session", optionalAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user || null
    });
});

router.get("/test-protected", requireAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authentication successful",
        user: req.user
    });
});

router.get("/me", requireAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
});

router.post("/logout", requireAuth, logout);

router.post("/refresh", refresh);

module.exports = router;
