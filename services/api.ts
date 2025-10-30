import { User, Evaluation, Criterion, EvaluationSubmission, Department, Course, Complaint, EvaluationPeriod, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiRequest = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
    const token = sessionStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        return data.data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Auth
export const apiLogin = async (email: string, pass: string): Promise<User> => {
    const { user, accessToken } = await apiRequest<{ user: User, accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
    });
    sessionStorage.setItem('authToken', accessToken);
    return user;
};

export const apiGetMe = (): Promise<User> => apiRequest<User>('/users/me');
export const apiLogout = (): Promise<void> => {
    sessionStorage.removeItem('authToken');
    return Promise.resolve();
};

// Users
export const apiGetUsers = (): Promise<User[]> => apiRequest<User[]>('/users');
export const apiUpdateUser = (userId: string, userData: Partial<User>): Promise<User> => apiRequest<User>(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
export const apiDeleteUser = (userId: string): Promise<void> => apiRequest<void>(`/users/${userId}`, { method: 'DELETE' });
export const apiCreateUser = (userData: { firstName: string, lastName: string, email: string, role: UserRole, password?: string }): Promise<User> => apiRequest<User>('/admin/users', { method: 'POST', body: JSON.stringify(userData) });

export const apiBulkImportUsers = async (file: File): Promise<{ success: boolean, message: string }> => {
    const token = sessionStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/admin/users/import`, {
        method: 'POST',
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Bulk import failed');
    }
    return data;
};

// Evaluations
export const apiGetStudentCourses = (studentId: string): Promise<Course[]> => apiRequest<Course[]>(`/students/${studentId}/courses`);
export const apiGetStudentEvaluations = (studentId: string): Promise<Evaluation[]> => apiRequest<Evaluation[]>(`/evaluations/assigned?studentId=${studentId}`);
export const apiSubmitEvaluation = (submission: EvaluationSubmission): Promise<any> => apiRequest<any>('/evaluations/student', { method: 'POST', body: JSON.stringify(submission) });
export const apiAssignEvaluation = (assignData: { studentId: string, courseId: string, teacherId: string }): Promise<any> => apiRequest<any>('/evaluations/assign', { method: 'POST', body: JSON.stringify(assignData) });

// Criteria
export const apiGetCriteria = (): Promise<Criterion[]> => apiRequest<Criterion[]>('/criteria');

// Departments
export const apiGetDepartments = (): Promise<Department[]> => apiRequest<Department[]>('/departments');
export const apiCreateDepartment = (name: string): Promise<Department> => apiRequest<Department>('/departments', { method: 'POST', body: JSON.stringify({ name }) });
export const apiUpdateDepartment = (deptId: string, name: string): Promise<Department> => apiRequest<Department>(`/departments/${deptId}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const apiDeleteDepartment = (deptId: string): Promise<void> => apiRequest<void>(`/departments/${deptId}`, { method: 'DELETE' });

// Courses
export const apiGetCourses = (): Promise<Course[]> => apiRequest<Course[]>('/courses');
export const apiCreateCourse = (courseData: Partial<Course>): Promise<Course> => apiRequest<Course>('/courses', { method: 'POST', body: JSON.stringify(courseData) });
export const apiUpdateCourse = (courseId: string, courseData: Partial<Course>): Promise<Course> => apiRequest<Course>(`/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(courseData) });
export const apiDeleteCourse = (courseId: string): Promise<void> => apiRequest<void>(`/courses/${courseId}`, { method: 'DELETE' });

// Complaints
export const apiGetComplaints = (): Promise<Complaint[]> => apiRequest<Complaint[]>('/complaints');
export const apiCreateComplaint = (complaintData: { subject: string, message: string }): Promise<Complaint> => apiRequest<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(complaintData) });
export const apiUpdateComplaint = (complaintId: string, complaintData: { status: string, assignedTo?: string }): Promise<Complaint> => apiRequest<Complaint>(`/complaints/${complaintId}`, { method: 'PUT', body: JSON.stringify(complaintData) });

// Evaluation Periods
export const apiGetEvaluationPeriods = (): Promise<EvaluationPeriod[]> => apiRequest<EvaluationPeriod[]>('/periods');
export const apiCreateEvaluationPeriod = (periodData: Partial<EvaluationPeriod>): Promise<EvaluationPeriod> => apiRequest<EvaluationPeriod>('/periods', { method: 'POST', body: JSON.stringify(periodData) });
export const apiUpdateEvaluationPeriod = (periodId: string, periodData: Partial<EvaluationPeriod>): Promise<EvaluationPeriod> => apiRequest<EvaluationPeriod>(`/periods/${periodId}`, { method: 'PUT', body: JSON.stringify(periodData) });
export const apiDeleteEvaluationPeriod = (periodId: string): Promise<void> => apiRequest<void>(`/periods/${periodId}`, { method: 'DELETE' });

// Reports
export const apiGetMyPerformance = (): Promise<any[]> => apiRequest<any[]>('/reports/my-performance');

export const api = {
    get: <T>(url: string) => apiRequest<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: any) => apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(url: string, body: any) => apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(url: string) => apiRequest<T>(url, { method: 'DELETE' })
};
