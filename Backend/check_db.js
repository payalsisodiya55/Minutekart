import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://oyechotuu:oyechotuu1@cluster0.ywfizk5.mongodb.net/oyechotuu';

async function checkDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name).filter(n => n.includes('withdraw') || n.includes('transaction'));
  
  console.log('Collections related to withdrawals/transactions:', collectionNames);
  
  await mongoose.disconnect();
}

checkDB().catch(console.error);
