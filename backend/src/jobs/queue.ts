import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export const aggregationQueue = new Queue('aggregationQueue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
});

export const addAggregationJob = async (teacherId: string, period: string) => {
  await aggregationQueue.add(`aggregate-${teacherId}-${period}`, { teacherId, period });
};
