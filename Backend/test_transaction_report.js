import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { getTransactionReport } from './src/modules/food/admin/services/admin.service.js';

async function test() {
    await connectDB();
    try {
        const report = await getTransactionReport({ zone: 'North Zone' });
        console.log("Success! report:", report.transactions.length);
    } catch (err) {
        console.error("Error running getTransactionReport with zone:", err);
    }
    await disconnectDB();
}

test();
