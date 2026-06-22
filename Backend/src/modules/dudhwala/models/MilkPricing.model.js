import mongoose from 'mongoose';

const milkPricingSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'milk_config', 
    required: true 
  },
  quantityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'milk_config', 
    required: true 
  },
  pricePerDay: { 
    type: Number, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Ensure unique combination of product and quantity
milkPricingSchema.index({ productId: 1, quantityId: 1 }, { unique: true });

export const MilkPricing = mongoose.model('milk_pricing', milkPricingSchema, 'milk_pricings');
