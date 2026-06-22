import mongoose from 'mongoose';

const milkAddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', required: true, index: true },
  label: { type: String, default: 'Milk Delivery' },
  street: { type: String, required: true },
  additionalDetails: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  pincode: { type: String, required: true },
  landmark: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  isDefault: { type: Boolean, default: false },
  zoneId: { type: String },
  zoneName: { type: String }
}, { timestamps: true });

milkAddressSchema.index({ location: '2dsphere' });

export const MilkAddress = mongoose.model('milk_address', milkAddressSchema, 'milk_addresses');
