import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongodbUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const benefits = [
    {
        type: 'why_dudhwala',
        label: 'Zero Adulteration',
        value: 'zero_adulteration',
        description: 'Pure milk sourced directly from trusted local farms.',
        order: 1,
        isActive: true
    },
    {
        type: 'why_dudhwala',
        label: 'Easy Pausing',
        value: 'easy_pausing',
        description: 'Going on a vacation? Pause your delivery with one tap.',
        order: 2,
        isActive: true
    },
    {
        type: 'why_dudhwala',
        label: 'No Delivery Fee',
        value: 'no_delivery_fee',
        description: 'Pay only for the milk. Daily delivery is absolutely free.',
        order: 3,
        isActive: true
    }
];

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongodbUri);
        console.log('Connected!');

        const collection = mongoose.connection.db.collection('milk_configs');

        for (const benefit of benefits) {
            console.log(`Seeding: ${benefit.label}...`);
            await collection.updateOne(
                { type: 'why_dudhwala', value: benefit.value },
                { $set: benefit },
                { upsert: true }
            );
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
