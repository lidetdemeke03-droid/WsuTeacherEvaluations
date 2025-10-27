import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { aggregateTeacherScores } from '../services/aggregationService';
import AuditLog from '../models/AuditLog';
import { LogLevel } from '../types';

const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

interface AggregationJobData {
  teacherId: string;
  period: string;
}

const worker = new Worker<AggregationJobData>('aggregationQueue', async (job: Job<AggregationJobData>) => {
  const { teacherId, period } = job.data;
  console.log(`Processing aggregation for teacher ${teacherId}, period ${period}`);

  try {
    await aggregateTeacherScores(teacherId, period);
  } catch (error) {
    console.error(`Failed to process aggregation for teacher ${teacherId}, period ${period}`, error);
    // Log the final failure to the audit log
    if (job.attemptsMade >= job.opts.attempts!) {
      await AuditLog.create({
        action: 'AGGREGATION_JOB_FAILURE',
        level: LogLevel.Error,
        details: {
          teacherId,
          period,
          error: error.message,
        },
      });
      // Here you would also send an email to the admin
    }
    throw error; // Re-throw the error to let BullMQ know the job failed
  }
}, {
  connection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});

console.log('Aggregation worker started.');
