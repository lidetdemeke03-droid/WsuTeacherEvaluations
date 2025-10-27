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
  isDeptHead: boolean;
  isActive: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IDepartment extends Document {
  name: string;
  code: string;
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
  Boolean = 'boolean',
  MCQ = 'mcq',
}

export interface IQuestion extends Document {
  code: string;
  text: string;
  type: QuestionType;
  weight: number;
  options?: string[];
}

export interface IEvaluationForm extends Document {
  formCode: string;
  title: string;
  anonymous: boolean;
  questions: IQuestion[];
}

export interface IEvaluationResponse extends Document {
  anonymousToken: string;
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  period: string;
  answers: {
      questionId: Types.ObjectId;
      response?: string;
      score?: number;
  }[];
  totalScore: number;
  submittedAt: Date;
  meta?: {
      ip?: string;
      ua?: string;
  };
}

export interface IPeerAssignment extends Document {
  evaluator: Types.ObjectId; // Student
  evaluatee: Types.ObjectId; // Student
  course: Types.ObjectId;
  period: string;
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
  period: string;
  studentSubmissionCount: number;
  studentScoreSum: number;
  studentAvg: number;
  peerAvg: number;
  deptAvg: number;
  finalScore: number;
  lastUpdated: Date;
}

export enum LogLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
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
