import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    listPromotions,
    applyPromotion,
    createPromotion,
    updatePromotion,
    deletePromotion
} from '../controllers/promotion.controller.js';

const router = express.Router();

// Public: list active promotions
router.get('/', listPromotions);

// Apply a promo to a cart/items (user should be authenticated to claim per-user limits)
router.post('/apply', authMiddleware, applyPromotion);

// Admin CRUD
router.post('/', authMiddleware, createPromotion);
router.put('/:promoId', authMiddleware, updatePromotion);
router.delete('/:promoId', authMiddleware, deletePromotion);

export default router;
