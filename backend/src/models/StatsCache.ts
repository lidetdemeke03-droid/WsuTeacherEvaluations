import { Schema, model } from 'mongoose';
import { IStatsCache } from '../types';

const statsCacheSchema = new Schema<IStatsCache>({
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  period: { type: String, required: true },
  studentAvg: { type: Number, default: 0 },
  peerAvg: { type: Number, default: 0 },
  deptAvg: { type: Number, default: 0 },
  finalScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, required: true },
});

statsCacheSchema.index({ teacher: 1, period: 1 }, { unique: true });

const StatsCache = model<IStatsCache>('StatsCache', statsCacheSchema);

export default StatsCache;
