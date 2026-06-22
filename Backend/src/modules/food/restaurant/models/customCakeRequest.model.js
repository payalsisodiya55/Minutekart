import mongoose from 'mongoose';

const customCakeRequestSchema = new mongoose.Schema(
    {
        requestId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodUser',
            required: true,
            index: true
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodRestaurant',
            required: true,
            index: true
        },
        cakeType: { type: String, required: true },
        flavour: { type: String, required: true },
        weight: { type: Number, required: true }, // in kg
        shape: { type: String, required: true },
        theme: { type: String, default: '' },
        eggless: { type: Boolean, default: true },
        deliveryDate: { type: Date, required: true },
        cakeMessage: { type: String, default: '' },
        notes: { type: String, default: '' },
        images: { type: [String], default: [] },
        
        status: {
            type: String,
            enum: ['pending', 'quoted', 'confirmed', 'rejected', 'ordered'],
            default: 'pending',
            index: true
        },
        quotePrice: { type: Number, default: 0 },
        preparationTimeMinutes: { type: Number, default: 0 },
        rejectionReason: { type: String, default: '' },
        
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodOrder',
            default: null
        }
    },
    { timestamps: true }
);

export const FoodCustomCakeRequest = mongoose.model(
    'FoodCustomCakeRequest',
    customCakeRequestSchema,
    'food_custom_cake_requests'
);
