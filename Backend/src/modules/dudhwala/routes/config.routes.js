import express from 'express';
import { MilkConfigController } from '../controllers/MilkConfig.controller.js';
// import { adminAuth } from '../../../middleware/adminAuth.js'; // I'll check the exact path for middleware

const router = express.Router();

// Admin routes
router.post('/', MilkConfigController.addConfig);
router.get('/', MilkConfigController.getConfigs);
router.put('/:id', MilkConfigController.updateConfig);
router.delete('/:id', MilkConfigController.removeConfig);

// Public routes
router.get('/public/bootstrap', MilkConfigController.getBootstrap);
router.get('/public/:type', MilkConfigController.getPublicConfigs);

export default router;
