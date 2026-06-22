import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongodbUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB');
    
    const collection = mongoose.connection.db.collection('food_page_contents');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Indexes before:', indexes);
    
    // Drop index key_1 if exists
    const hasKey1 = indexes.some(idx => idx.name === 'key_1');
    if (hasKey1) {
      console.log('Dropping index key_1...');
      await collection.dropIndex('key_1');
      console.log('Index key_1 dropped successfully');
    } else {
      console.log('Index key_1 not found');
    }
    
    // List indexes again
    const finalIndexes = await collection.indexes();
    console.log('Indexes after:', finalIndexes);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
