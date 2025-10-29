import { Schema, model } from 'mongoose';
import { IPeerAssignment } from '../types';

const peerAssignmentSchema = new Schema<IPeerAssignment>({
  evaluator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetTeacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  active: { type: Boolean, default: true },
  window: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
}, { timestamps: true });

const PeerAssignment = model<IPeerAssignment>('PeerAssignment', peerAssignmentSchema);

export default PeerAssignment;
