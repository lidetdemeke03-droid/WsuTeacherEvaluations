import cron from 'node-cron';
import User from '../models/User';
import ScheduleWindow from '../models/ScheduleWindow';
import { addAggregationJob } from './queue';
import { UserRole } from '../types';

/**
 * This cron job runs every night at 2:00 AM.
 * It finds all active evaluation periods and queues an aggregation job
 * for every teacher who was evaluated in that period.
 */
export const scheduleNightlyAggregation = () => {
  // Schedule to run every day at 2:00 AM ('0 2 * * *')
  cron.schedule('0 2 * * *', async () => {
    console.log('Running nightly aggregation job...');

    try {
      const now = new Date();
      // Find all evaluation windows that are currently active or have recently ended
      const activeWindows = await ScheduleWindow.find({ endDate: { $lte: now } });

      for (const window of activeWindows) {
        // Find all teachers
        const teachers = await User.find({ role: UserRole.Teacher });

        for (const teacher of teachers) {
          // In a real implementation, you would first check if there are any
          // new evaluation responses for this teacher in this period before queuing.
          // For simplicity, we'll queue a job for every teacher.
          await addAggregationJob(teacher._id.toString(), window.period);
        }
      }
      console.log('Finished queuing nightly aggregation jobs.');
    } catch (error) {
      console.error('Error during nightly aggregation scheduling:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
};
