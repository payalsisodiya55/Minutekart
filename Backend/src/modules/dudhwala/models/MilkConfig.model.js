import mongoose from 'mongoose';

const milkConfigSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['product_type', 'quantity', 'time_slot', 'plan_duration', 'why_dudhwala'],
    index: true
  },
  label: { type: String, required: true },
  value: { type: String, required: true },
  description: { type: String },
  price: { type: Number, default: 0 },
  startTime: { type: String }, // For time_slot
  endTime: { type: String },   // For time_slot
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

milkConfigSchema.index({ type: 1, value: 1 }, { unique: true });

export const MilkConfig = mongoose.model('milk_config', milkConfigSchema, 'milk_configs');
