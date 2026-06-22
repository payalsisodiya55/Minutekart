import 'dotenv/config';
import { sendPushNotification } from './src/core/notifications/firebase.service.js';
import mongoose from 'mongoose';
import { FoodUser } from './src/core/users/user.model.js';

async function testFcm() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log("Testing Firebase Credentials...");
    const projectId = process.env.FIREBASE_PROJECT_ID || 'oyechotuu';
    console.log(`Project ID from service logic: ${projectId}`);
    
    // Find a user with tokens
    const user = await FoodUser.findOne({ fcmTokens: { $exists: true, $not: { $size: 0 } } }).lean();
    if (!user) {
      console.log("No user found with fcmTokens");
      process.exit(0);
    }
    
    const token = user.fcmTokens[0];
    console.log(`Found token to test: ${token.substring(0, 20)}...`);
    
    console.log("Sending push notification...");
    const payload = {
      title: "Test Push",
      body: "This is a test push notification",
      data: { test: "true" }
    };
    
    const response = await sendPushNotification([token], payload);
    console.log("FCM Response:", JSON.stringify(response, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error("Error during test:", err);
    process.exit(1);
  }
}

testFcm();
