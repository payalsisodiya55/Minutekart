import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongodbUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const inspect = async () => {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB');
    
    const returnRequest = await mongoose.connection.db.collection('quick_return_requests').findOne({
      _id: new mongoose.Types.ObjectId('6a32880c4541920d48aa74de')
    });
    
    console.log('Return Request:', JSON.stringify(returnRequest, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspect();
