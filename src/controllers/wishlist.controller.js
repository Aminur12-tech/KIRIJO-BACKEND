import Wishlist from "../models/wishlist.model.js";

// GET /api/wishlist - get user's wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        let wishlist = await Wishlist.findOne({ userId })
            .populate('items.productId');

        if (!wishlist) {
            wishlist = new Wishlist({ userId, items: [] });
            await wishlist.save();
        }

        res.json(wishlist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// POST /api/wishlist - add product to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                items: [{ productId }]
            });
        } else {
            // Check if product already exists in wishlist
            const exists = wishlist.items.some(item =>
                item.productId.toString() === productId
            );

            if (exists) {
                return res.status(400).json({
                    error: "Product already in wishlist"
                });
            }

            wishlist.items.push({ productId });
        }

        await wishlist.save();
        await wishlist.populate('items.productId');

        res.json(wishlist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE /api/wishlist/:productId - remove from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ error: "Wishlist not found" });
        }

        // Remove product from items array
        wishlist.items = wishlist.items.filter(item =>
            item.productId.toString() !== productId
        );

        await wishlist.save();
        await wishlist.populate('items.productId');

        res.json(wishlist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};