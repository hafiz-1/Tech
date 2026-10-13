const express = require("express");
const { register, verifyEmail, resendOtp, login, logout } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const router = express.Router();

router.post("/register", register);

router.post("/verify-email", verifyEmail);

router.post("/resend-otp", resendOtp);

router.post("/login", login);

router.get("/test-protected", requireAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authentication successful",
        user: req.user
    });
});

router.post("/logout", requireAuth, logout);

module.exports = router;
