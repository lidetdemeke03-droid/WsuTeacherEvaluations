import { Schema, model, Document } from 'mongoose';

export interface IEvaluationPeriod extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
}

const evaluationPeriodSchema = new Schema<IEvaluationPeriod>({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
});

const EvaluationPeriod = model<IEvaluationPeriod>('EvaluationPeriod', evaluationPeriodSchema);

export default EvaluationPeriod;
