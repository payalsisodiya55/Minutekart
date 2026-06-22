import mongoose from 'mongoose';

const milkPlanOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', required: true, index: true },
  planConfig: {
    productId: { type: String, required: true },
    productLabel: { type: String, required: true },
    quantityId: { type: String, required: true },
    quantityLabel: { type: String, required: true },
    timeSlotId: { type: String, required: true },
    timeSlotLabel: { type: String, required: true },
    durationId: { type: String, required: true },
    durationLabel: { type: String, required: true },
    totalDays: { type: Number, required: true },
    startDate: { type: Date, required: true },
  },
  address: {
    addressId: { type: String },
    fullAddress: { type: String, required: true },
    landmark: { type: String },
    city: { type: String },
    pincode: { type: String },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    }
  },
  zoneSnapshot: {
    zoneId: { type: String },
    zoneName: { type: String }
  },
  payment: {
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'cancelled'], 
      default: 'pending' 
    }
  },
  status: { 
    type: String, 
    enum: ['pending', 'processed', 'failed'], 
    default: 'pending' 
  },
  adminRemarks: { type: String }
}, { timestamps: true });

milkPlanOrderSchema.index({ 'payment.razorpayPaymentId': 1 }, { unique: true, sparse: true });
milkPlanOrderSchema.index({ userId: 1, createdAt: -1 });

export const MilkPlanOrder = mongoose.model('milk_plan_order', milkPlanOrderSchema, 'milk_plan_orders');
