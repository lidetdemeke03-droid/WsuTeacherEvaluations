
export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
  DepartmentHead = 'department_head',
  Admin = 'admin',
  SuperAdmin = 'superadmin',
}

export interface User {
  _id: string;
    firstName: string;
    lastName: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  head?: { _id: string; firstName: string; lastName: string; email: string }[];
}

export interface Course {
  _id: string;
  title: string;
  code: string;
  teacher?: User;
  department: Department;
}

export interface EvaluationPeriod {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive';
}

export interface EvaluationSubmission {
    courseId: string;
    teacherId: string;
    period: string;
    answers: Answer[];
}


export interface Evaluation {
  _id: string;
  status: 'Pending' | 'Completed';
  course: Course;
  teacher: User;
  period: EvaluationPeriod;
}

export interface Answer {
    questionCode: string;
    score?: number;
    response?: string;
}

export enum ComplaintStatus {
    New = 'New',
    InProgress = 'In Progress',
    Resolved = 'Resolved',
}

export interface Complaint {
    _id: string;
    subject: string;
    message: string;
    submitterName: string;
    submitterId: string;
    status: ComplaintStatus;
    assignedToName?: string;
    submissionDate: string;
}
