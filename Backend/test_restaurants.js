import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { FoodRestaurant } from './src/modules/food/restaurant/models/restaurant.model.js';

async function test() {
    await connectDB();
    try {
        const restaurants = await FoodRestaurant.find({}).limit(2).lean();
        console.log("Restaurants:", JSON.stringify(restaurants, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
    await disconnectDB();
}

test();
