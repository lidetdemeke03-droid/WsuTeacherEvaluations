import { Schema, model } from 'mongoose';
import { IStatsCache } from '../types';

const statsCacheSchema = new Schema<IStatsCache>({
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  period: { type: Schema.Types.ObjectId, ref: 'EvaluationPeriod', required: true },
  studentScore: { type: Number, default: 0 },
  peerScore: { type: Number, default: 0 },
  deptHeadScore: { type: Number, default: 0 },
  finalScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

statsCacheSchema.index({ teacher: 1, period: 1 }, { unique: true });

const StatsCache = model<IStatsCache>('StatsCache', statsCacheSchema);

export default StatsCache;
