import express from 'express';
import { upload } from '../../../../middleware/upload.js';
import {
    listAddressesController,
    addAddressController,
    updateAddressController,
    deleteAddressController,
    setDefaultAddressController
} from '../controllers/userAddress.controller.js';
import {
    getCurrentUserProfileController,
    updateCurrentUserProfileController,
    uploadCurrentUserProfileImageController
} from '../controllers/userProfile.controller.js';
import {
    getUserWalletController,
    createWalletTopupOrderController,
    verifyWalletTopupPaymentController
} from '../controllers/userWallet.controller.js';
import {
    getUserReferralDetailsController,
    getUserReferralStatsController
} from '../controllers/userReferral.controller.js';
import {
    createSafetyEmergencyReportController,
    listMySafetyEmergencyReportsController
} from '../controllers/userSafetyEmergency.controller.js';
import {
    createSupportTicketController,
    listMySupportTicketsController
} from '../controllers/supportTicket.controller.js';

import {
    createUserCustomCakeRequest,
    listUserCustomCakeRequests,
    getUserCustomCakeRequestDetail,
    confirmCustomCakeQuotation,
    userRejectCustomCakeQuotation
} from '../../restaurant/controllers/customCake.controller.js';

const router = express.Router();

router.get('/profile', getCurrentUserProfileController);
router.patch('/profile', updateCurrentUserProfileController);
router.post('/profile/profile-image', upload.single('file'), uploadCurrentUserProfileImageController);

// Custom Cake Requests
router.post('/custom-cakes/requests', createUserCustomCakeRequest);
router.get('/custom-cakes/requests', listUserCustomCakeRequests);
router.get('/custom-cakes/requests/:id', getUserCustomCakeRequestDetail);
router.patch('/custom-cakes/requests/:id/confirm', confirmCustomCakeQuotation);
router.patch('/custom-cakes/requests/:id/reject', userRejectCustomCakeQuotation);

// Wallet (Bearer USER)
router.get('/wallet', getUserWalletController);
router.post('/wallet/topup/order', createWalletTopupOrderController);
router.post('/wallet/topup/verify', verifyWalletTopupPaymentController);

// Referral stats (Bearer USER)
router.get('/referrals/stats', getUserReferralStatsController);
router.get('/referrals/details', getUserReferralDetailsController);

// Safety / Emergency reports (Bearer USER)
router.post('/safety-emergency-reports', createSafetyEmergencyReportController);
router.get('/safety-emergency-reports', listMySafetyEmergencyReportsController);

// Support tickets (Bearer USER)
router.post('/support/ticket', createSupportTicketController);
router.get('/support/my-tickets', listMySupportTicketsController);

router.get('/addresses', listAddressesController);
router.post('/addresses', addAddressController);
router.patch('/addresses/:addressId', updateAddressController);
router.delete('/addresses/:addressId', deleteAddressController);
router.patch('/addresses/:addressId/default', setDefaultAddressController);

export default router;
