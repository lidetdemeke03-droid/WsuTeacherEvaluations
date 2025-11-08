import { Schema, model } from 'mongoose';
import { IEvaluationResponse, EvaluationType } from '../types';

const evaluationResponseSchema = new Schema<IEvaluationResponse>({
  type: { type: String, enum: Object.values(EvaluationType), required: true },
  evaluator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetTeacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  anonymousToken: { type: String, unique: true, sparse: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    period: { type: Schema.Types.ObjectId, ref: 'EvaluationPeriod', required: true },
  answers: [
      {
          questionCode: { type: String, required: true },
          response: { type: String },
          score: { type: Number },
          conflict: { type: Boolean, default: false },
          reason: { type: String },
          evidence: { type: String },
      },
  ],
  totalScore: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  meta: {
      ip: { type: String },
      ua: { type: String },
  },
}, { timestamps: true });

evaluationResponseSchema.index({ targetTeacher: 1, type: 1, submittedAt: -1 });
// Prevent duplicate evaluations by the same evaluator for the same teacher/period/type
evaluationResponseSchema.index({ targetTeacher: 1, period: 1, type: 1, evaluator: 1 }, { unique: true, sparse: true });

const EvaluationResponse = model<IEvaluationResponse>('EvaluationResponse', evaluationResponseSchema);

export default EvaluationResponse;
