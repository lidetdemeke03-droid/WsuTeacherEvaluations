import { Schema, model, Document } from 'mongoose';
import { Types } from 'mongoose';

export interface IEvaluationPeriod extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
  department?: any; // optional ref to Department so periods can be scoped per-department
}

const evaluationPeriodSchema = new Schema<IEvaluationPeriod>({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  // Optional department scope. If set, the period applies only to that department.
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: false },
});

const EvaluationPeriod = model<IEvaluationPeriod>('EvaluationPeriod', evaluationPeriodSchema);

export default EvaluationPeriod;
