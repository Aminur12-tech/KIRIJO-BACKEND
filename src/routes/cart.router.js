import express from "express";
import {
  addOrUpdateCartItem,
  removeCartItem,
  getCart,
  updateCartItem
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/cart - get current user's cart
router.get("/", authMiddleware, getCart);

// POST /api/cart - add product to cart (body: productId, quantity)
router.post("/", authMiddleware, addOrUpdateCartItem);

// PUT /api/cart/:productId - update quantity for a product in cart
router.put("/:productId", authMiddleware, updateCartItem);

// DELETE /api/cart/:productId - remove product from cart
router.delete("/:productId", authMiddleware, removeCartItem);

export default router;
