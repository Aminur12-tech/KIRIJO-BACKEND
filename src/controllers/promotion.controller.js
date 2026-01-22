import Promotion from "../models/promotion.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

const isAdmin = (req) => {
    return req.user && (
        req.user.admin === true || 
        req.user.admin === 'true' ||
        req.user.role === 'admin' ||
        (req.user.roles && req.user.roles.includes('admin'))
    );
};
// GET /api/promotions - list active promotions (optionally include inactive if admin)
export const listPromotions = async (req, res) => {
    try {
        const includeAll = isAdmin(req) && req.query.all === '1';
        const now = new Date();
        let filter = {};
        if (!includeAll) {
            filter = {
                active: true,
                $and: [
                    { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
                    { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] }
                ]
            };
        }
        const promos = await Promotion.find(filter).sort({ createdAt: -1 });
        res.json(promos);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Utility: compute totals from items array [{productId, quantity}]
const computeTotalsFromItems = async (items) => {
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    let subtotal = 0;
    const detailed = items.map(i => {
        const p = products.find(x => x._id.toString() === i.productId);
        const price = p ? p.price : 0;
        const line = price * i.quantity;
        subtotal += line;
        return { productId: i.productId, quantity: i.quantity, price, line };
    });
    return { subtotal, items: detailed };
};

// POST /api/promotions/apply - apply a promo code to a cart or items
export const applyPromotion = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { promoCode, cartId, items: inputItems } = req.body;
        if (!promoCode) return res.status(400).json({ error: 'promoCode is required' });

        const promo = await Promotion.findOne({ code: promoCode });
        if (!promo) return res.status(404).json({ error: 'Promotion not found' });
        if (!promo.isActive()) return res.status(400).json({ error: 'Promotion is not active or expired' });

        let items = inputItems;
        if (cartId) {
            const cart = await Cart.findById(cartId).populate('items.productId');
            if (!cart) return res.status(404).json({ error: 'Cart not found' });
            items = cart.items.map(i => ({ productId: i.productId._id.toString(), quantity: i.quantity }));
        }
        if (!items || items.length === 0) return res.status(400).json({ error: 'No items provided or cart is empty' });

        const { subtotal, items: detailed } = await computeTotalsFromItems(items);

        // check min order value
        if (promo.minOrderValue && subtotal < promo.minOrderValue) {
            return res.status(400).json({ error: `Minimum order value ${promo.minOrderValue} required` });
        }

        // compute discount depending on type and applicability
        let discount = 0;
        if (promo.type === 'percent') {
            // apply percent to applicable items
            if ((promo.appliesToProducts && promo.appliesToProducts.length) || (promo.appliesToCategories && promo.appliesToCategories.length)) {
                // only apply to matching items
                // For simplicity, match product ids only (category matching requires Product.category)
                const applicableSum = detailed.reduce((sum, it) => {
                    if (promo.appliesToProducts && promo.appliesToProducts.map(String).includes(String(it.productId))) return sum + it.line;
                    return sum;
                }, 0);
                discount = (applicableSum * promo.value) / 100;
            } else {
                discount = (subtotal * promo.value) / 100;
            }
        } else if (promo.type === 'fixed') {
            discount = promo.value;
            if (discount > subtotal) discount = subtotal;
        } else if (promo.type === 'free_shipping') {
            // this controller doesn't calculate shipping; return shippingDiscount flag
            const totals = { subtotal, discount: 0, total: subtotal };
            return res.json({ promotion: promo, items: detailed, totals, freeShipping: true });
        }

        const total = Math.max(0, subtotal - discount);

        res.json({ promotion: promo, items: detailed, totals: { subtotal, discount, total } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Admin: create promotion
export const createPromotion = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
        const payload = req.body;
        const promo = new Promotion({ ...payload, createdBy: req.user?.userId });
        await promo.save();
        res.status(201).json(promo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Admin: update promotion
export const updatePromotion = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
        const { promoId } = req.params;
        const promo = await Promotion.findByIdAndUpdate(promoId, req.body, { new: true });
        if (!promo) return res.status(404).json({ error: 'Promotion not found' });
        res.json(promo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Admin: delete promotion
export const deletePromotion = async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
        const { promoId } = req.params;
        const promo = await Promotion.findByIdAndDelete(promoId);
        if (!promo) return res.status(404).json({ error: 'Promotion not found' });
        res.json({ message: 'Promotion deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
