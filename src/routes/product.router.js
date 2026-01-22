import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	updateProduct,
	getProductById,
	getCategories,
	getProductsByCategory,
	getFeaturedProducts
} from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public product listing & search
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/search", getAllProducts); // alias - uses same handler via query param 'searchTerm'
// Categories (must be before "/:id" to avoid conflicts like '/categories' being treated as an id)
router.get("/categories", getCategories);
router.get("/categories/:id/products", getProductsByCategory);

// Single product by id (placed after more specific routes)
router.get("/:id", getProductById);

// Admin protected
router.post("/", authMiddleware, createProduct);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

export default router;