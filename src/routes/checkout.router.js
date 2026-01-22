import express from 'express';
import { initiateCheckout, getCheckoutSummary } from '../controllers/checkout.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all checkout routes with auth
router.use(authMiddleware);

// POST /api/checkout - initiate checkout process
router.post('/', initiateCheckout);

// GET /api/checkout/summary - get checkout summary with totals
router.get('/summary', getCheckoutSummary);

export default router;