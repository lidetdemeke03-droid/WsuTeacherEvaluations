import { Schema, model } from 'mongoose';
import { IEvaluationResponse } from '../types';

const evaluationResponseSchema = new Schema<IEvaluationResponse>({
  anonymousToken: { type: String, required: true, unique: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  answers: [
      {
          questionId: { type: Schema.Types.ObjectId, required: true },
          response: { type: String },
          score: { type: Number },
      },
  ],
  totalScore: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  meta: {
      ip: { type: String },
      ua: { type: String },
  },
}, { timestamps: true });

const EvaluationResponse = model<IEvaluationResponse>('EvaluationResponse', evaluationResponseSchema);

export default EvaluationResponse;
