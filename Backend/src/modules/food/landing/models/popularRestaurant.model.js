import mongoose from 'mongoose';

const foodPopularRestaurantSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodRestaurant',
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            default: 0,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_popular_restaurants',
        timestamps: true
    }
);

foodPopularRestaurantSchema.index({ restaurantId: 1 });
foodPopularRestaurantSchema.index({ isActive: 1, order: 1 });

export const FoodPopularRestaurant = mongoose.model('FoodPopularRestaurant', foodPopularRestaurantSchema, 'food_popular_restaurants');
