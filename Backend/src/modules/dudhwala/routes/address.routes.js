import express from 'express';
import { MilkAddressController } from '../controllers/MilkAddress.controller.js';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../core/roles/role.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('USER', 'ADMIN'));

router.get('/', MilkAddressController.listAddresses);
router.post('/', MilkAddressController.addAddress);
router.patch('/:id', MilkAddressController.updateAddress);
router.delete('/:id', MilkAddressController.deleteAddress);
router.patch('/:id/default', MilkAddressController.setDefault);

export default router;
