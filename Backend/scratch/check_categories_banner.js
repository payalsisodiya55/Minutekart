import mongoose from 'mongoose';

async function run() {
  try {
    await mongoose.connect('mongodb+srv://minutekart_db_user:l3SpnfGp2X7lpIEb@cluster0.nhraz3y.mongodb.net/Minutekart');
    const db = mongoose.connection.db;

    const categories = await db.collection('quick_categories').find({}).toArray();
    console.log("=== Category Banners in DB ===");
    categories.forEach(c => {
      console.log(`- ${c.name} (${c.type}) | banner: "${c.banner}" | image: "${c.image}"`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
