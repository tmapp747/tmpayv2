
import { storage } from '../storage';
import { scheduleJob } from 'node-schedule';

export const initCleanupJobs = () => {
  // Clean expired sessions every hour
  scheduleJob('0 * * * *', async () => {
    await storage.cleanupExpiredSessions();
  });

  // Process pending transfers every 5 minutes
  scheduleJob('*/5 * * * *', async () => {
    await storage.processPendingTransfers();
  });
};
