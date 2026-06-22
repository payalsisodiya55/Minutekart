import mongoose from 'mongoose';
import { MilkPlanOrder } from '../models/MilkPlanOrder.model.js';
import { MilkActivePlan } from '../models/MilkActivePlan.model.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../../food/orders/helpers/razorpay.helper.js';
import { ValidationError, NotFoundError } from '../../../core/auth/errors.js';
import { logger } from '../../../utils/logger.js';

export const MilkOrderService = {
  async createSubscriptionOrder(userId, data) {
    const { planConfig, address, zoneId, zoneName, amount } = data;

    // Check for existing active plan for same user/slot to prevent duplicates
    const existingActive = await MilkActivePlan.findOne({
      userId,
      timeSlot: planConfig.timeSlotLabel,
      status: { $in: ['active', 'paused', 'pending_approval'] }
    });

    if (existingActive) {
      throw new ValidationError(`You already have an active or pending subscription for the ${planConfig.timeSlotLabel} slot.`);
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new ValidationError('Invalid subscription amount');
    }

    // Create Razorpay Order
    let razorpayOrderId = null;
    try {
      console.log(`[MilkOrderService] Creating Razorpay order for amount: ${amount * 100} paise`);
      const rpOrder = await createRazorpayOrder(amount * 100, 'INR', `MILK-${Date.now()}`);
      razorpayOrderId = rpOrder.id;
      console.log(`[MilkOrderService] Razorpay order created: ${razorpayOrderId}`);
    } catch (err) {
      console.error('[MilkOrderService] Razorpay Error:', err);
      logger.error('Failed to create Razorpay order for milk subscription:', err);
      throw new Error(`Payment gateway error: ${err.message}`);
    }

    const order = await MilkPlanOrder.create({
      userId,
      planConfig,
      address,
      zoneSnapshot: { zoneId, zoneName },
      payment: {
        amount,
        razorpayOrderId,
        status: 'pending'
      }
    });

    return {
      orderId: order._id,
      razorpayOrderId,
      amount: amount * 100,
      currency: 'INR'
    };
  },

  async verifySubscriptionPayment(userId, data) {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    const order = await MilkPlanOrder.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (String(order.userId) !== String(userId)) throw new ValidationError('Unauthorized access to order');

    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      order.payment.status = 'failed';
      await order.save();
      throw new ValidationError('Invalid payment signature');
    }

    // Update order status
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpaySignature = razorpaySignature;
    order.payment.status = 'completed';
    order.status = 'processed';
    await order.save();

    // Create Active Plan (Pending Admin Approval)
    const startDate = new Date(order.planConfig.startDate);
    const totalDays = order.planConfig.totalDays;
    
    // Calculate Expiry Date (Backend only)
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + totalDays);

    const activePlan = await MilkActivePlan.create({
      userId,
      orderId: order._id,
      productType: order.planConfig.productLabel,
      quantity: order.planConfig.quantityLabel,
      timeSlot: order.planConfig.timeSlotLabel,
      startDate,
      expiryDate,
      totalDays,
      remainingDays: totalDays,
      addressSnapshot: order.address.fullAddress,
      zoneSnapshot: order.zoneSnapshot,
      status: 'pending_approval',
      actionLogs: [{
        action: 'activated',
        actionBy: 'system',
        remarks: 'Subscription created via payment verification. Awaiting admin activation.'
      }]
    });

    return {
      success: true,
      planId: activePlan._id,
      status: activePlan.status
    };
  },

  async getUserPlans(userId) {
    const [active, history] = await Promise.all([
      MilkActivePlan.find({ 
        userId, 
        status: { $in: ['active', 'paused', 'pending_approval', 'expiring_soon'] } 
      }).sort({ createdAt: -1 }),
      MilkActivePlan.find({ 
        userId, 
        status: { $in: ['expired', 'rejected', 'deactivated'] } 
      }).sort({ createdAt: -1 }).limit(10)
    ]);

    return { active, history };
  }
};
