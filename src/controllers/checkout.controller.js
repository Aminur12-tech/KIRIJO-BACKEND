import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

// Simple shipping and tax rules (can be replaced with real rules)
const SHIPPING_RATES = {
    standard: 50,
    express: 120
};
const TAX_RATE = 0.05; // 5%

// Helper to calculate order totals
const calculateOrderTotals = (items, shippingOption = 'standard') => {
    let subtotal = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    const shipping = SHIPPING_RATES[shippingOption] || SHIPPING_RATES.standard;
    const taxes = subtotal * TAX_RATE;
    const total = subtotal + shipping + taxes;

    return { subtotal, shipping, taxes, total };
};

// POST /api/checkout - initiate checkout
export const initiateCheckout = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { items: inputItems, addressId, paymentMethod = 'COD', shippingOption = 'standard' } = req.body;

        let items = inputItems;
        if (!items || items.length === 0) {
            // load from cart if no items provided
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if (!cart || !cart.items.length) {
                return res.status(400).json({ error: 'No items to checkout' });
            }
            items = cart.items.map(i => ({
                productId: i.productId._id,
                quantity: i.quantity,
                price: i.productId.price,
                name: i.productId.name
            }));
        } else {
            // fetch product details for provided items
            const productIds = items.map(i => i.productId);
            const products = await Product.find({ _id: { $in: productIds } });
            items = items.map(item => {
                const product = products.find(p => p._id.toString() === item.productId);
                if (!product) throw new Error(`Product not found: ${item.productId}`);
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                    name: product.name
                };
            });
        }

        // Calculate totals
        const { subtotal, shipping, taxes, total } = calculateOrderTotals(items, shippingOption);

        const checkout = {
            userId,
            addressId,
            paymentMethod,
            shippingOption,
            items,
            summary: {
                subtotal,
                shipping,
                taxes,
                total
            }
        };

        res.json(checkout);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// GET /api/checkout/summary - get checkout summary
export const getCheckoutSummary = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { shippingOption = 'standard' } = req.query;

        // Get cart contents
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || !cart.items.length) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const items = cart.items.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price
        }));

        // Calculate totals
        const { subtotal, shipping, taxes, total } = calculateOrderTotals(items, shippingOption);

        res.json({
            items,
            summary: {
                subtotal,
                shipping,
                taxes,
                total
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};