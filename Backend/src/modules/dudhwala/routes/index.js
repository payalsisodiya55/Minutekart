import express from 'express';
import configRoutes from './config.routes.js';
import orderRoutes from './order.routes.js';
import adminRoutes from './admin.routes.js';
import addressRoutes from './address.routes.js';

const router = express.Router();

router.use('/config', configRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/addresses', addressRoutes);

export default router;
