import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    getAllReviews,
    moderateReview,
} from "../controllers/review.controller.js";

const router = express.Router();


router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", authMiddleware, createReview);
router.put("/:productId/reviews/:reviewId", authMiddleware, updateReview);
router.delete("/:productId/reviews/:reviewId", authMiddleware, deleteReview);

//admin Review
router.get("/", authMiddleware, getAllReviews);
router.put("/:reviewId/moderate",authMiddleware, moderateReview);

export default router;