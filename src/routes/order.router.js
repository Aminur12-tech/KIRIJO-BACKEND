import express from "express";
import {
  placeOrder,
  updateOrderStatus,
  getUserOrders,
  getOrderById
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all order routes
router.use(authMiddleware);

// GET /api/orders - list user orders
router.get("/", getUserOrders);

// POST /api/orders - create new order
router.post("/", placeOrder);

// GET /api/orders/:orderId - get order details
router.get("/:orderId", getOrderById);

// PUT /api/orders/:orderId/status - admin update order status
router.put("/:orderId/status", updateOrderStatus);

export default router;