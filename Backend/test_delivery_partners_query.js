import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { getDeliveryPartners } from './src/modules/food/admin/services/admin.service.js';

async function test() {
    await connectDB();
    try {
        const partners = await getDeliveryPartners({ status: "approved", isActive: true });
        console.log("Partners with isActive=true:", partners.deliveryPartners.length);

        const partnersAll = await getDeliveryPartners({ status: "approved" });
        console.log("Partners without isActive:", partnersAll.deliveryPartners.length);
    } catch (err) {
        console.error("Error:", err);
    }
    await disconnectDB();
}

test();
