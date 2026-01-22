import express from "express";
import { emailOtpVerification, emailVerification, login, logout, signup, forgotPassword, resetPassword, makeAdmin } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

//route for email verification and otp
router.post("/email-verification-otp-sending", emailVerification);
router.post("/email-otp-verification", emailOtpVerification);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/make-admin', authMiddleware, makeAdmin);

export default router;