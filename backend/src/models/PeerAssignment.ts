import { Schema, model } from 'mongoose';
import { IPeerAssignment } from '../types';

const peerAssignmentSchema = new Schema<IPeerAssignment>({
  evaluator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  period: { type: String, required: true },
}, { timestamps: true });

const PeerAssignment = model<IPeerAssignment>('PeerAssignment', peerAssignmentSchema);

export default PeerAssignment;
