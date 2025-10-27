import { Schema, model, Document } from 'mongoose';

export interface ICriterion extends Document {
  text: string;
}

const criterionSchema = new Schema<ICriterion>({
  text: { type: String, required: true },
});

const Criterion = model<ICriterion>('Criterion', criterionSchema);

export default Criterion;
