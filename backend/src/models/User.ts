import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../../types';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string; // Not optional
  role: UserRole;
  department: Schema.Types.ObjectId;
  deleted: boolean;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(UserRole), required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  deleted: { type: Boolean, default: false, select: false },
}, { timestamps: true });

// Use async pre-hook WITHOUT `next` parameter.
userSchema.pre<IUser>('save', async function (this: IUser) {
  // If password not modified, do nothing
  if (!this.isModified('password')) return;

  const saltRounds = 10;
  // Use an explicit local variable with typed string
  const hashed: string = await bcrypt.hash(this.password, saltRounds);
  this.password = hashed;
});

// Compare passwords
userSchema.methods.comparePassword = function (this: IUser, candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser>('User', userSchema);

export default User;
