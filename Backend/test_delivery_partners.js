import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { FoodDeliveryPartner } from './src/modules/food/delivery/models/deliveryPartner.model.js';

async function test() {
    await connectDB();
    try {
        const partners = await FoodDeliveryPartner.find({}).limit(2).lean();
        console.log("Partners:", JSON.stringify(partners, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
    await disconnectDB();
}

test();
