import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} from "../controllers/wishlist.controller.js";

const router = express.Router();

// Protect all wishlist routes
router.use(authMiddleware);

// GET /api/wishlist - get user's wishlist
router.get("/", getWishlist);

// POST /api/wishlist - add to wishlist
router.post("/", addToWishlist);

// DELETE /api/wishlist/:productId - remove from wishlist
router.delete("/:productId", removeFromWishlist);

export default router;