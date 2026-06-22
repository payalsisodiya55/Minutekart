import mongoose from 'mongoose';

const actionLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    enum: ['activated', 'paused', 'resumed', 'deactivated', 'rejected', 'expired'], 
    required: true 
  },
  actionBy: { type: String, default: 'system' }, // 'admin' or 'system'
  actionById: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodAdmin' },
  remarks: { type: String },
  actionTime: { type: Date, default: Date.now }
}, { _id: false });

const milkActivePlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'milk_plan_order', required: true },
  
  // Plan Details
  productType: { type: String, required: true },
  quantity: { type: String, required: true },
  timeSlot: { type: String, required: true, index: true },
  
  // Lifecycle Dates
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true, index: true },
  totalDays: { type: Number, required: true },
  remainingDays: { type: Number, required: true },
  
  // Pause Tracking
  pausedDays: { type: Number, default: 0 },
  pauseStartDate: { type: Date },
  pauseEndDate: { type: Date },
  totalPausedDays: { type: Number, default: 0 },
  
  // Location & Zone Snapshots
  addressSnapshot: { type: String, required: true },
  zoneSnapshot: {
    zoneId: { type: String, index: true },
    zoneName: { type: String }
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending_approval', 'active', 'paused', 'expiring_soon', 'expired', 'rejected', 'deactivated'], 
    default: 'pending_approval',
    index: true
  },
  
  // Notification Flags
  notificationFlags: {
    expiryNotificationSent: { type: Boolean, default: false },
    activationNotificationSent: { type: Boolean, default: false },
    pausedNotificationSent: { type: Boolean, default: false },
    resumedNotificationSent: { type: Boolean, default: false }
  },
  
  // Admin Interactions
  actionLogs: [actionLogSchema],
  adminNotes: { type: String },

  // Refund tracking for rejected plans
  refundInfo: {
    status: { type: String, enum: ['none', 'initiated', 'processed', 'failed'], default: 'none' },
    refundId: { type: String },
    amount: { type: Number },
    initiatedAt: { type: Date },
    message: { type: String }
  }
}, { timestamps: true });

// Compound index for duplicate prevention (Same user, active duration overlap logic handled in service)
milkActivePlanSchema.index({ userId: 1, status: 1 });

export const MilkActivePlan = mongoose.model('milk_active_plan', milkActivePlanSchema, 'milk_active_plans');
