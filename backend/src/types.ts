import { Document, Types } from 'mongoose';

export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
  DepartmentHead = 'department_head',
  Admin = 'admin',
  SuperAdmin = 'superadmin',
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  department: Types.ObjectId;
  employeeId?: string;
  studentId?: string;
  courses: Types.ObjectId[];
  isActive: boolean;
  deleted?: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  avatar?: string;
  gender?: 'male' | 'female';
  comparePassword(password: string): Promise<boolean>;
}

export interface IDepartment extends Document {
  name: string;
  code: string;
  head: Types.ObjectId[];
}

export interface ICourse extends Document {
  title: string;
  code: string;
  department: Types.ObjectId;
  teacher?: Types.ObjectId;
  students: Types.ObjectId[];
}

export enum QuestionType {
  Rating = 'rating',
  Text = 'text',
}

export enum EvaluationType {
  Student = 'student',
  Peer = 'peer',
  DepartmentHead = 'dept'
}

export interface IEvaluationQuestion {
  code: string;
  text: string;
  type: 'rating' | 'text';
}

export interface IEvaluationResponse extends Document {
  type: EvaluationType;
  evaluator: Types.ObjectId; // User who submitted the evaluation
  targetTeacher: Types.ObjectId; // Teacher being evaluated
  anonymousToken?: string; // Should be optional now
  course: Types.ObjectId;
  period: Types.ObjectId;
  answers: {
      questionCode: string;
      response?: string;
      score?: number;
      conflict?: boolean;
      reason?: string;
      evidence?: string;
  }[];
  totalScore: number;
  submittedAt: Date;
  meta?: {
      ip?: string;
      ua?: string;
  };
}

export interface IEvaluationPeriod extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive' | 'archived';
  department?: Types.ObjectId;
}

export interface IPeerAssignment extends Document {
  evaluator: Types.ObjectId; // Teacher
  targetTeacher: Types.ObjectId; // Teacher
  course: Types.ObjectId;
  period: Types.ObjectId;
  active: boolean;
  window: {
    start: Date;
    end: Date;
  };
}

export interface IScheduleWindow extends Document {
  period: string; // e.g., "2025-Spring"
  startDate: Date;
  endDate: Date;
  remindersEnabled: boolean;
}

export interface IStatsCache extends Document {
  teacher: Types.ObjectId;
  course?: Types.ObjectId;
  period: Types.ObjectId;
  studentScore: number;
  peerScore: number;
  deptHeadScore: number;
  finalScore: number;
  lastUpdated: Date;
}

export enum LogLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

export enum ComplaintStatus {
  New = 'New',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
}

export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  action: string;
  level: LogLevel;
  details?: Record<string, any>;
}

export interface INotification extends Document {
  user: Types.ObjectId;
  message: string;
  read: boolean;
}
