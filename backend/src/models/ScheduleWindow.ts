import { Schema, model } from 'mongoose';
import { IScheduleWindow } from '../types';

const scheduleWindowSchema = new Schema<IScheduleWindow>({
  period: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  remindersEnabled: { type: Boolean, default: true },
}, { timestamps: true });

const ScheduleWindow = model<IScheduleWindow>('ScheduleWindow', scheduleWindowSchema);

export default ScheduleWindow;
