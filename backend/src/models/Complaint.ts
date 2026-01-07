import { Schema, model, Document } from 'mongoose';
import { ComplaintStatus } from '../types';

export interface IComplaint extends Document {
  subject: string;
  message: string;
  submitter: any; // user ref
  status: ComplaintStatus;
  response?: string;
  attachments?: string[];
  assignedTo?: any; // optional user ref for who the complaint is assigned to
}

const complaintSchema = new Schema<IComplaint>({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  submitter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: Object.values(ComplaintStatus), default: ComplaintStatus.New },
  response: { type: String },
  attachments: [{ type: String }],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Complaint = model<IComplaint>('Complaint', complaintSchema);

export default Complaint;
