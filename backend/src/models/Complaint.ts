import { Schema, model, Document } from 'mongoose';

export interface IComplaint extends Document {
  title: string;
  description: string;
}

const complaintSchema = new Schema<IComplaint>({
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const Complaint = model<IComplaint>('Complaint', complaintSchema);

export default Complaint;
