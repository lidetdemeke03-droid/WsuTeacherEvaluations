import { Schema, model, Document } from 'mongoose';

export interface IEvaluationPeriod extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
}

const evaluationPeriodSchema = new Schema<IEvaluationPeriod>({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

const EvaluationPeriod = model<IEvaluationPeriod>('EvaluationPeriod', evaluationPeriodSchema);

export default EvaluationPeriod;
