import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
const validStatusTransitions = {
  placed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

const isAdmin = (req) => req.user && (req.user.admin === true || req.user.admin === 'true');

// Place Order with stock deduction and price capture
export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user?.userId || req.body.userId;
    const { items, paymentMode = "COD" } = req.body;
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid items or missing userId" });
    }

    // Fetch current product data with stock
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    // Validate stock and collect price info
    let totalAmount = 0;
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }
      totalAmount += product.price * item.quantity;
    }

    // Deduct stock
    for (const item of items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // Prepare order items with price at purchase
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price
      };
    });

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      paymentMode,
      status: "placed",
      history: [{ status: "placed" }]
    });

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

// Update order status with validation of allowed transitions
export const updateOrderStatus = async (req, res) => {
  try {
    // Only admin may update
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin privileges required" });

    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentStatus = order.status;
    if (!validStatusTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    order.status = status;
    order.history.push({ status, changedAt: new Date() });
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all orders for a user with populated product details
export const getUserOrders = async (req, res) => {
  try {
    // If admin and query.userId is provided, return for that user, otherwise return current user's orders
    const requesterId = req.user?.userId;
    const queryUserId = req.query.userId || requesterId;
    const orders = await Order.find({ userId: queryUserId }).populate("items.productId");
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // allow owner or admin
    const requesterId = req.user?.userId;
    if (order.userId.toString() !== requesterId && !isAdmin(req)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
