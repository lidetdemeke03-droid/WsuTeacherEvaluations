import { Schema, model } from 'mongoose';
import { IQuestion, QuestionType } from '../types';

const questionSchema = new Schema<IQuestion>({
  code: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  type: { type: String, enum: Object.values(QuestionType), required: true },
  weight: { type: Number, default: 1 },
  options: [{ type: String }],
});

const Question = model<IQuestion>('Question', questionSchema);

export default Question;
