import { MilkOrderService } from '../services/MilkOrder.service.js';
import { validateCreateMilkOrder, validateVerifyMilkPayment } from '../validators/milk.validator.js';
import { sendResponse } from '../../../utils/response.js';

export const MilkOrderController = {
  async createOrder(req, res, next) {
    try {
      const userId = req.user?.userId;
      const dto = validateCreateMilkOrder(req.body);
      const result = await MilkOrderService.createSubscriptionOrder(userId, dto);
      return sendResponse(res, 201, 'Order initiated', result);
    } catch (err) {
      next(err);
    }
  },

  async verifyPayment(req, res, next) {
    try {
      const userId = req.user?.userId;
      const dto = validateVerifyMilkPayment(req.body);
      const result = await MilkOrderService.verifySubscriptionPayment(userId, dto);
      return sendResponse(res, 200, 'Payment verified successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async getMyPlans(req, res, next) {
    try {
      const userId = req.user?.userId;
      const result = await MilkOrderService.getUserPlans(userId);
      return sendResponse(res, 200, 'Plans retrieved', result);
    } catch (err) {
      next(err);
    }
  }
};
