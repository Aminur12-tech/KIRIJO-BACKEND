import express from "express";
import {
  getCurrentUser,
  updateProfile,
  changePassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  getOrderHistory
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getCurrentUser);
router.put("/me", updateProfile);
router.put("/me/password", changePassword);

router.post("/addresses", addAddress);
router.get("/addresses", getAddresses);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

router.get("/orders", getOrderHistory);

router.get("/debug-token", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});


export default router;