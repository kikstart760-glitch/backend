const express = require("express");
const authController = require("../controller/authController");

const router = express.Router();

router.post("/sign-up", authController.signUp);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgetPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-otp", authController.verifyOtp);



module.exports = router;