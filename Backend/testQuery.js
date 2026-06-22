import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/oyechotuu').then(async () => {
  const FoodOrder = mongoose.model('FoodOrder', new mongoose.Schema({}, { strict: false }), 'food_orders');
  const orders = await FoodOrder.find({ orderType: { $in: ['quick', 'mixed'] } }).limit(2).lean();
  console.log(JSON.stringify(orders.map(o => ({
    _id: o._id,
    dispatch: o.dispatch,
    pickupPoints: o.pickupPoints,
    pricing: o.pricing,
    userId: o.userId
  })), null, 2));
  process.exit(0);
});
