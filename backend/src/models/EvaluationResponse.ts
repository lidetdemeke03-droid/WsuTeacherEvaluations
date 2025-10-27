import { Schema, model } from 'mongoose';
import { IEvaluationResponse } from '../types';

const evaluationResponseSchema = new Schema<IEvaluationResponse>({
  form: { type: Schema.Types.ObjectId, ref: 'EvaluationForm', required: true },
  evaluator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  period: { type: String, required: true },
  answers: [
    {
      question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
      value: { type: Schema.Types.Mixed, required: true },
    },
  ],
  totalScore: { type: Number, default: 0 },
}, { timestamps: true });

const EvaluationResponse = model<IEvaluationResponse>('EvaluationResponse', evaluationResponseSchema);

export default EvaluationResponse;
