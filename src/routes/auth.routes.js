const express = require("express");
const { register, verifyEmail, resendOtp } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);

router.post("/verify-email", verifyEmail);

router.post("/resend-otp", resendOtp);

module.exports = router;
