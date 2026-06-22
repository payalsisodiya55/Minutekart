import mongoose from 'mongoose';
import { MilkActivePlan } from '../models/MilkActivePlan.model.js';
import { MilkPlanOrder } from '../models/MilkPlanOrder.model.js';
import { MilkConfig } from '../models/MilkConfig.model.js';
import { MilkPricing } from '../models/MilkPricing.model.js';
import { FoodUser } from '../../../core/users/user.model.js';
import { initiateRazorpayRefund } from '../../food/orders/helpers/razorpay.helper.js';
import { ValidationError, NotFoundError } from '../../../core/auth/errors.js';
import { logger } from '../../../utils/logger.js';
import { buildPaginatedResult } from '../../../utils/helpers.js';

export const MilkAdminService = {
  async listAllPlans(filters = {}) {
    const { status, userId, zoneId, page = 1, limit = 20, search } = filters;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (zoneId) query['zoneSnapshot.zoneId'] = zoneId;
    
    if (search) {
      const matchingUsers = await FoodUser.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id').lean();

      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { productType: { $regex: search, $options: 'i' } },
        { addressSnapshot: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    const plans = await MilkActivePlan.find(query)
      .populate('userId', 'name phone')
      .populate('orderId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await MilkActivePlan.countDocuments(query);
    return buildPaginatedResult({ docs: plans, total, page, limit });
  },

  async updatePlanStatus(planId, action, adminId, remarks = '') {
    const plan = await MilkActivePlan.findById(planId);
    if (!plan) throw new NotFoundError('Subscription plan not found');

    const now = new Date();
    let oldStatus = plan.status;
    let newStatus = oldStatus;

    const normalizedAction = (action || '').toString().trim().toLowerCase();

    switch (normalizedAction) {
      case 'approve':
      case 'activate':
        if (plan.status !== 'pending_approval') throw new ValidationError('Only pending plans can be activated');
        newStatus = 'active';
        plan.actionLogs.push({
          action: 'activated',
          actionBy: 'admin',
          actionById: adminId,
          remarks: remarks || 'Plan activated by admin'
        });
        break;

      case 'pause':
        if (plan.status !== 'active') throw new ValidationError('Only active plans can be paused');
        newStatus = 'paused';
        plan.pauseStartDate = now;
        plan.actionLogs.push({
          action: 'paused',
          actionBy: 'admin',
          actionById: adminId,
          remarks: remarks || 'Plan paused by admin'
        });
        break;

      case 'resume':
        if (plan.status !== 'paused') throw new ValidationError('Only paused plans can be resumed');
        newStatus = 'active';
        
        // Calculate paused duration and extend expiry
        const pauseStart = plan.pauseStartDate || plan.createdAt;
        const pausedMs = now - pauseStart;
        const pausedDays = Math.max(1, Math.ceil(pausedMs / (1000 * 60 * 60 * 24)));
        
        plan.totalPausedDays = (plan.totalPausedDays || 0) + pausedDays;
        
        // Extend Expiry Date
        const currentExpiry = new Date(plan.expiryDate);
        currentExpiry.setDate(currentExpiry.getDate() + pausedDays);
        plan.expiryDate = currentExpiry;
        
        plan.pauseStartDate = null;
        plan.actionLogs.push({
          action: 'resumed',
          actionBy: 'admin',
          actionById: adminId,
          remarks: remarks || `Plan resumed after ${pausedDays} days of pause.`
        });
        break;

      case 'reject':
        if (plan.status !== 'pending_approval') throw new ValidationError('Only pending plans can be rejected');
        newStatus = 'rejected';
        
        // Handle Refund
        const order = await MilkPlanOrder.findById(plan.orderId);
        if (order && order.payment.status === 'success' && order.payment.method === 'razorpay' && order.payment.razorpayPaymentId) {
            try {
                const refundResult = await initiateRazorpayRefund(
                    order.payment.razorpayPaymentId, 
                    order.payment.amount
                );
                
                if (refundResult.success) {
                    plan.refundInfo = {
                        status: 'initiated',
                        refundId: refundResult.refundId,
                        amount: order.payment.amount,
                        initiatedAt: new Date(),
                        message: 'Plan rejected by admin. Your refund has been initiated and will be credited to your original payment method in 2-3 working days.'
                    };
                    remarks = (remarks ? remarks + '. ' : '') + 'Refund initiated successfully.';
                } else {
                    plan.refundInfo = {
                        status: 'failed',
                        message: 'Failed to initiate automated refund. Please contact support.'
                    };
                    remarks = (remarks ? remarks + '. ' : '') + 'Refund initiation failed: ' + refundResult.error;
                }
            } catch (refundErr) {
                logger.error('Refund initiation error:', refundErr);
                plan.refundInfo = {
                    status: 'failed',
                    message: 'Error during refund processing.'
                };
            }
        }

        plan.actionLogs.push({
          action: 'rejected',
          actionBy: 'admin',
          actionById: adminId,
          remarks: remarks || 'Plan rejected by admin'
        });
        break;

      case 'deactivate':
        newStatus = 'deactivated';
        plan.actionLogs.push({
          action: 'deactivated',
          actionBy: 'admin',
          actionById: adminId,
          remarks: remarks || 'Plan deactivated by admin'
        });
        break;

      default:
        throw new ValidationError(`Invalid action: ${action}`);
    }

    plan.status = newStatus;
    await plan.save();

    logger.info(`Milk Plan ${planId} status updated: ${oldStatus} -> ${newStatus} by Admin ${adminId}`);
    return plan;
  },

  async getPlanDetails(planId) {
    return MilkActivePlan.findById(planId)
      .populate('userId', 'name phone email')
      .populate('orderId')
      .populate('actionLogs.actionById', 'name email')
      .lean();
  },

  async getDashboardStats() {
    const now = new Date();
    const twoDaysLater = new Date(now);
    twoDaysLater.setDate(now.getDate() + 2);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [planStats, revenueData, uniqueSubscribers, expiringSoon, expiredToday] = await Promise.all([
      // Status Distribution
      MilkActivePlan.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Total Revenue
      MilkPlanOrder.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      // Unique Subscribers
      MilkActivePlan.distinct('userId'),
      // Expiring Soon (Next 48 hours)
      MilkActivePlan.countDocuments({
        status: 'active',
        expiryDate: { $gte: now, $lte: twoDaysLater }
      }),
      // Expired Today
      MilkActivePlan.countDocuments({
        status: 'expired',
        updatedAt: { $gte: todayStart, $lte: todayEnd }
      })
    ]);

    const result = {
      pending: 0,
      active: 0,
      paused: 0,
      expired: 0,
      rejected: 0,
      totalPlans: 0,
      totalRevenue: revenueData[0]?.total || 0,
      totalSubscribers: uniqueSubscribers.length,
      expiringSoon,
      expiredToday
    };

    planStats.forEach(s => {
      if (s._id === 'pending_approval') result.pending = s.count;
      else if (s._id === 'active') result.active = s.count;
      else if (s._id === 'paused') result.paused = s.count;
      else if (s._id === 'expired') result.expired = s.count;
      else if (s._id === 'rejected') result.rejected = s.count;
      result.totalPlans += s.count;
    });

    return result;
  },

  // Dropdown / Config Management
  async listConfigs(type = null) {
    const query = type ? { type } : {};
    return MilkConfig.find(query).sort({ type: 1, order: 1 }).lean();
  },

  async upsertConfig(data) {
    const { id, type, label, value, price, isActive, order, startTime, endTime, description } = data;
    if (id) {
      return MilkConfig.findByIdAndUpdate(id, { 
        label, value, price, isActive, order, startTime, endTime, description 
      }, { new: true });
    }
    return MilkConfig.create({ type, label, value, price, isActive, order, startTime, endTime, description });
  },

  async deleteConfig(id) {
    return MilkConfig.findByIdAndDelete(id);
  },

  // Pricing Management
  async listPricing() {
    return MilkPricing.find()
      .populate('productId', 'label')
      .populate('quantityId', 'label')
      .lean();
  },

  async upsertPricing(data) {
    const { id, productId, quantityId, pricePerDay, isActive } = data;
    if (id) {
      return MilkPricing.findByIdAndUpdate(id, { 
        productId, quantityId, pricePerDay, isActive 
      }, { new: true });
    }
    return MilkPricing.create({ productId, quantityId, pricePerDay, isActive });
  },

  async deletePricing(id) {
    return MilkPricing.findByIdAndDelete(id);
  }
};
