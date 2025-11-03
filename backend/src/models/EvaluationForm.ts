import { Schema, model } from 'mongoose';
import { IEvaluationForm } from '../types';

export { IEvaluationForm };

const evaluationFormSchema = new Schema<IEvaluationForm>({
  formCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  anonymous: { type: Boolean, default: true },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
}, { timestamps: true });

const EvaluationForm = model<IEvaluationForm>('EvaluationForm', evaluationFormSchema);

export default EvaluationForm;
