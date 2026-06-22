import express from 'express';
import { MilkOrderController } from '../controllers/MilkOrder.controller.js';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../core/roles/role.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('USER', 'ADMIN'));

router.post('/', MilkOrderController.createOrder);
router.post('/verify-payment', MilkOrderController.verifyPayment);
router.get('/my-plans', MilkOrderController.getMyPlans);

export default router;
