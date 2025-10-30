import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '../types';

export { IUser };

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  role: { type: String, enum: Object.values(UserRole), required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  employeeId: { type: String },
  studentId: { type: String },
  isDeptHead: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User = model<IUser>('User', userSchema);

export default User;
