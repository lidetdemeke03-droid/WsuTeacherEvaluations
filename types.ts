
export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
  DepartmentHead = 'department_head',
  Admin = 'admin',
  SuperAdmin = 'superadmin',
}

export interface User {
  id: string;
    firstName: string;
    lastName: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface EvaluationPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive';
}

export interface Criterion {
  id: string;
  text: string;
  maxScore: number;
}

export interface EvaluationSubmission {
    studentId: string;
    instructorId: string;
    periodId: string;
    scores: { criterionId: string; score: number; comment: string }[];
}


export interface Evaluation {
  id: string;
  instructorName: string;
  courseName: string;
  periodName: string;
  status: 'Pending' | 'Completed';
}

export enum ComplaintStatus {
    New = 'New',
    InProgress = 'In Progress',
    Resolved = 'Resolved',
}

export interface Complaint {
    id: string;
    subject: string;
    message: string;
    submitterName: string;
    submitterId: string;
    status: ComplaintStatus;
    assignedToName?: string;
    submissionDate: string;
}
