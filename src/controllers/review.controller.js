import Review from "../models/review.model.js";
import Product from "../models/product.model.js";

// Helper to check if user is admin
const isAdmin = (req) => {
    return req.user && (
        req.user.admin === true ||
        req.user.admin === 'true' ||
        req.user.role === 'admin' ||
        (req.user.roles && req.user.roles.includes('admin'))
    );
};
// GET /api/products/:productId/reviews
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, status = 'approved' } = req.query;

        const filter = { productId };
        // If not admin, only show approved reviews
        if (!isAdmin(req)) {
            filter.status = 'approved';
        }

        const reviews = await Review.find(filter)
            .populate('user', 'name') // Only include user's name
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Review.countDocuments(filter);

        res.json({
            reviews,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// POST /api/products/:productId/reviews
export const createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.userId;
        const { rating, comment } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this product" });
        }

        const review = new Review({
            productId,
            userId,
            rating,
            comment
        });

        await review.save();
        await review.populate('user', 'name');

        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// PUT /api/reviews/:reviewId
export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.userId;
        const { rating, comment } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        // Only allow owner to update
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized to update this review" });
        }

        review.rating = rating;
        review.comment = comment;
        // Reset status to pending if moderation is enabled
        // review.status = 'pending';

        await review.save();
        await review.populate('user', 'name');

        res.json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE /api/reviews/:reviewId
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.userId;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }
        // Allow owner or admin to delete
        if (review.userId.toString() !== userId && !isAdmin(req)) {
            return res.status(403).json({ error: "Not authorized to delete this review" });
        }

        await review.deleteOne();
        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/reviews (admin only)
export const getAllReviews = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { page = 1, limit = 10, status } = req.query;
        const filter = status ? { status } : {};

        const reviews = await Review.find(filter)
            .populate('user', 'name email')
            .populate('productId', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Review.countDocuments(filter);

        res.json({
            reviews,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// PUT /api/reviews/:reviewId/status (admin only)
export const moderateReview = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { reviewId } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { status },
            { new: true }
        ).populate('user', 'name');

        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        res.json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};