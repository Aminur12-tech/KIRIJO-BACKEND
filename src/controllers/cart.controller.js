import Cart from "../models/cart.model.js";

// Add or update product quantity in cart
export const addOrUpdateCartItem = async (req, res) => {
  const userId = req.user.userId;
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, quantity }] });
    } else {
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        // Update quantity if item exists
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Add new item
        cart.items.push({ productId, quantity });
      }
    }
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Remove product from cart
export const removeCartItem = async (req, res) => {
  const userId = req.user.userId;
  // productId can come from param or body
  const productId = req.params.productId || req.body.productId;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get cart items for a user
export const getCart = async (req, res) => {
  const userId = req.user.userId;
  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update quantity of an item in cart
export const updateCartItem = async (req, res) => {
  const userId = req.user.userId;
  // productId can come from param or body
  const productId = req.params.productId || req.body.productId;
  const { quantity } = req.body;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ error: "Item not found in cart" });

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
