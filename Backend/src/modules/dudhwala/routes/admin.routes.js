import express from 'express';
import { MilkAdminController } from '../controllers/MilkAdmin.controller.js';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../core/roles/role.middleware.js';

const router = express.Router();

// All routes require ADMIN role
router.use(authMiddleware);
router.use(requireRoles('ADMIN', 'SUB_ADMIN'));

router.get('/stats', MilkAdminController.getStats);

router.get('/plans', MilkAdminController.listAllPlans);
router.get('/plans/:id', MilkAdminController.getPlanDetails);
router.patch('/plans/:id/status', MilkAdminController.updatePlanStatus);

// Config / Dropdown Management
router.get('/configs', MilkAdminController.listConfigs);
router.post('/configs', MilkAdminController.upsertConfig);
router.delete('/configs/:id', MilkAdminController.deleteConfig);

// Pricing Management
router.get('/pricing', MilkAdminController.listPricing);
router.post('/pricing', MilkAdminController.upsertPricing);
router.delete('/pricing/:id', MilkAdminController.deletePricing);

export default router;
