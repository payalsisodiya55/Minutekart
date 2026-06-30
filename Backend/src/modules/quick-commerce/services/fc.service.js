import { Seller } from '../seller/models/seller.model.js';
import { logger } from '../../../utils/logger.js';

export const ensureAllSellersHaveFcId = async () => {
  try {
    // Find all sellers sorted by creation time / _id
    const sellers = await Seller.find({}).sort({ createdAt: 1, _id: 1 });
    
    // First check which ones already have fcId
    let maxSuffix = 0;
    const needsFcId = [];
    
    for (const seller of sellers) {
      if (seller.fcId) {
        const match = seller.fcId.match(/FC-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSuffix) maxSuffix = num;
        }
      } else {
        needsFcId.push(seller);
      }
    }
    
    if (needsFcId.length > 0) {
      logger.info(`Assigning FC IDs to ${needsFcId.length} sellers...`);
      for (const seller of needsFcId) {
        maxSuffix++;
        seller.fcId = `FC-${String(maxSuffix).padStart(2, '0')}`;
        await seller.save();
        logger.info(`Assigned ${seller.fcId} to seller "${seller.shopName || seller.name}"`);
      }
    } else {
      logger.info('All sellers have valid FC IDs.');
    }
  } catch (error) {
    logger.error(`Error in ensureAllSellersHaveFcId: ${error.message}`);
  }
};
