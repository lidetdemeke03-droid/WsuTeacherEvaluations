import { Schema, model, Document } from 'mongoose';

export interface IPeerAssignment extends Document {
  evaluator: Schema.Types.ObjectId;
  targetTeacher: Schema.Types.ObjectId;
  course: Schema.Types.ObjectId;
  period: Schema.Types.ObjectId;
  active: boolean;
  window: {
    start: Date;
    end: Date;
  };
}

const peerAssignmentSchema = new Schema<IPeerAssignment>({
  evaluator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetTeacher: { type: Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  period: { type: Schema.Types.ObjectId, ref: 'EvaluationPeriod', required: true },
  active: { type: Boolean, default: true },
  window: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
}, { timestamps: true });

peerAssignmentSchema.index({ evaluator: 1, targetTeacher: 1, course: 1, period: 1 }, { unique: true });

const PeerAssignment = model<IPeerAssignment>('PeerAssignment', peerAssignmentSchema);

export default PeerAssignment;
