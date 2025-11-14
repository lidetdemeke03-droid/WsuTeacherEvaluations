import { Schema, model } from 'mongoose';
import { ICourse } from '../types';

export { ICourse };

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

courseSchema.index({ teacher: 1 });

const Course = model<ICourse>('Course', courseSchema);

export default Course;
