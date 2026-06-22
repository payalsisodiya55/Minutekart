import cron from 'node-cron';
import { MilkActivePlan } from '../models/MilkActivePlan.model.js';
import { logger } from '../../../utils/logger.js';
import { sendPushNotification } from '../../../core/notifications/firebase.service.js';
import { FoodUser } from '../../../core/users/user.model.js';
/**
 * Daily Milk Plan Processor
 * Runs every day at midnight (00:00)
 * Logic:
 * 1. Finds all ACTIVE milk plans.
 * 2. Decrements remainingDays by 1.
 * 3. Marks as EXPIRED if remainingDays reaches 0.
 * 4. Skips PAUSED or PENDING plans.
 */
export const processDailyMilkPlans = async () => {
  logger.info('Started Daily Milk Plan processing job...');
  
  try {
    const activePlans = await MilkActivePlan.find({ status: 'active' });
    
    if (activePlans.length === 0) {
      logger.info('No active milk plans to process today.');
      return;
    }

    let expiredCount = 0;
    let processedCount = 0;

    for (const plan of activePlans) {
      // Decrement remaining days
      plan.remainingDays = Math.max(0, plan.remainingDays - 1);
      
      // Check for expiration
      if (plan.remainingDays === 0) {
        plan.status = 'expired';
        plan.actionLogs.push({
          action: 'expired',
          actionBy: 'system',
          remarks: 'Plan expired automatically as remaining days reached 0.'
        });
        expiredCount++;
      } else if (plan.remainingDays === 3 || plan.remainingDays === 2) {
        // Send FCM Push Notification 2-3 days before expiry
        try {
          const user = await FoodUser.findById(plan.userId).lean();
          if (user && user.fcmTokens && user.fcmTokens.length > 0) {
            const payload = {
              title: "Milk Plan Expiring Soon! 🥛",
              body: `Your milk subscription will expire in ${plan.remainingDays} days. Please renew to avoid any interruption in delivery.`,
              data: {
                type: "milk_plan_expiring",
                planId: plan._id.toString()
              }
            };
            await sendPushNotification(user.fcmTokens, payload);
            logger.info(`Sent expiry notification to user ${plan.userId} for plan ${plan._id}`);
          }
        } catch (notifErr) {
          logger.error(`Failed to send milk plan expiry push to user ${plan.userId}: ${notifErr.message}`);
        }
      }
      
      await plan.save();
      processedCount++;
    }

    logger.info(`Daily Milk Plan Processing Completed. Total Processed: ${processedCount}, Expired: ${expiredCount}`);
  } catch (error) {
    logger.error(`Error in Daily Milk Plan job: ${error.message}`);
  }
};

/**
 * Initialize the Midnight Cron Job
 */
export const initMilkPlanCron = () => {
  // Run at 00:00 every day
  cron.schedule('0 0 * * *', () => {
    processDailyMilkPlans();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  
  logger.info('Milk Plan Midnight Cron Job Scheduled [0 0 * * *]');
};
