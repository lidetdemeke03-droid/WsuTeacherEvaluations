import { Schema, model } from 'mongoose';
import { IDepartment } from '../types';

const departmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  head: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Department = model<IDepartment>('Department', departmentSchema);

export default Department;
