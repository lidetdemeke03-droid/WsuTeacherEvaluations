import { User, Evaluation, EvaluationSubmission, Department, Course, Complaint, EvaluationPeriod, UserRole, EvaluationType, PeerAssignment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('API_BASE_URL:', API_BASE_URL); // Debugging line

const apiRequest = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                // Try to parse error response as JSON
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Something went wrong');
            } catch (e) {
                // If it's not JSON, the text itself is the error.
                throw new Error(errorText || 'An unknown server error occurred.');
            }
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Auth
export const apiLogin = async (email: string, pass: string): Promise<{ user: User, accessToken: string }> => {
    const { user, accessToken } = await apiRequest<{ user: User, accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
    });
    return { user, accessToken };
};

export const apiGetMe = (): Promise<User> => apiRequest<User>('/users/me');
export const apiLogout = (): Promise<void> => {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');
    return Promise.resolve();
};

export const apiVerifyResetToken = (token: string): Promise<void> =>
    apiRequest<void>(`/auth/reset-password/${token}`);

export const apiResetPassword = async (token: string, password: string): Promise<User> => {
    const { user, accessToken } = await apiRequest<{ user: User, accessToken: string }>(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
    sessionStorage.setItem('authToken', accessToken);
    return user;
};

// Request password reset (sends reset email)
export const apiRequestPasswordReset = (email: string): Promise<{ message?: string }> =>
    apiRequest<{ message?: string }>('/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) });

// Update current user's profile
export const apiUpdateProfile = (profileData: Partial<User>): Promise<User> =>
    apiRequest<User>('/users/me', { method: 'PATCH', body: JSON.stringify(profileData) });

// Change current user's password
export const apiChangePassword = (currentPassword: string, newPassword: string): Promise<{ message?: string }> =>
    apiRequest<{ message?: string }>('/users/me/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });

// Users
export const apiGetUsers = (): Promise<User[]> => apiRequest<User[]>('/users');
export const apiUpdateUser = (userId: string, userData: Partial<User>): Promise<User> => apiRequest<User>(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
export const apiDeleteUser = (userId: string): Promise<void> => apiRequest<void>(`/users/${userId}`, { method: 'DELETE' });
export const apiCreateUser = (userData: { firstName: string, lastName: string, email: string, role: UserRole, password?: string, department?: string, isDeptHead?: boolean }): Promise<User> => apiRequest<User>('/admin/users', { method: 'POST', body: JSON.stringify(userData) });

// SuperAdmin
export const apiGetAdmins = (): Promise<User[]> => apiRequest<User[]>('/superadmin/admins');
export const apiCreateAdmin = (userData: { firstName: string, lastName: string, email: string, password?: string }): Promise<User> => apiRequest<User>('/superadmin/admins', { method: 'POST', body: JSON.stringify(userData) });
export const apiUpdateAdmin = (userId: string, userData: Partial<User>): Promise<User> => apiRequest<User>(`/superadmin/admins/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
export const apiDeleteAdmin = (userId: string): Promise<void> => apiRequest<void>(`/superadmin/admins/${userId}`, { method: 'DELETE' });
// Audit logs (SuperAdmin)
export const apiGetAuditLogs = (page = 1, limit = 100): Promise<any> => apiRequest<any>(`/superadmin/audit-logs?page=${page}&limit=${limit}`);

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
export const apiSubmitPeerEvaluation = (submission: EvaluationSubmission): Promise<any> => apiRequest<any>('/evaluations/peer', { method: 'POST', body: JSON.stringify(submission) });
export const apiGetDepartmentHeadEvaluations = (teacherId?: string): Promise<Evaluation[]> => {
    const url = teacherId ? `/evaluations/department-head-evaluations?teacherId=${teacherId}` : '/evaluations/department-head-evaluations';
    return apiRequest<Evaluation[]>(url);
};
interface AssignEvaluationPayload {
  evaluatorIds: string[];
  courseId: string;
  teacherId: string;
  periodId: string;
  evaluationType: EvaluationType;
  window: {
    start: string;
    end: string;
  };
}

// Departments
export const apiGetDepartments = (): Promise<Department[]> => apiRequest<Department[]>('/departments');
export const apiCreateDepartment = (data: { name: string, code: string, head?: string[] | string }): Promise<Department> => apiRequest<Department>('/departments', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateDepartment = (deptId: string, data: { name: string, code: string, head?: string[] }): Promise<Department> => apiRequest<Department>(`/departments/${deptId}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteDepartment = (deptId: string): Promise<void> => apiRequest<void>(`/departments/${deptId}`, { method: 'DELETE' });
export const apiGetDepartmentTeachers = (deptId: string, periodId?: string): Promise<User[]> => apiRequest<User[]>(`/departments/${deptId}/teachers${periodId ? `?period=${periodId}` : ''}`);
export const apiGetTeacherCourses = (teacherId: string, departmentId?: string): Promise<Course[]> => {
    const url = departmentId ? `/courses/by-teacher/${teacherId}?departmentId=${departmentId}` : `/courses/by-teacher/${teacherId}`;
    return apiRequest<Course[]>(url);
};
export const apiGetPeerAssignments = (teacherId: string): Promise<any[]> => apiRequest<any[]>(`/peers/${teacherId}/assignments`);
export const apiGetPeerAssignmentDetails = (assignmentId: string): Promise<PeerAssignment> =>
    apiRequest<PeerAssignment>(`/peers/assignments/${assignmentId}`);

// Courses
export const apiGetCourses = (): Promise<Course[]> => apiRequest<Course[]>('/courses');
export const apiCreateCourse = (courseData: Partial<Course>): Promise<Course> => apiRequest<Course>('/courses', { method: 'POST', body: JSON.stringify(courseData) });
export const apiUpdateCourse = (courseId: string, courseData: Partial<Course>): Promise<Course> => apiRequest<Course>(`/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(courseData) });
export const apiDeleteCourse = (courseId: string): Promise<void> => apiRequest<void>(`/courses/${courseId}`, { method: 'DELETE' });

// Complaints
export const apiGetComplaints = (): Promise<Complaint[]> => apiRequest<Complaint[]>('/complaints');
export const apiCreateComplaint = (complaintData: { subject: string, message: string }): Promise<Complaint> => apiRequest<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(complaintData) });
export const apiUpdateComplaint = (complaintId: string, complaintData: { status: string, assignedTo?: string }): Promise<Complaint> => apiRequest<Complaint>(`/complaints/${complaintId}`, { method: 'PUT', body: JSON.stringify(complaintData) });
export const apiRespondComplaint = (complaintId: string, data: { responseText: string, status?: string }): Promise<Complaint> => apiRequest<Complaint>(`/complaints/${complaintId}/respond`, { method: 'POST', body: JSON.stringify(data) });

// Notifications
export const apiGetNotifications = (): Promise<any[]> => apiRequest<any[]>('/notifications');
export const apiMarkNotificationRead = (id: string): Promise<any> => apiRequest<any>(`/notifications/${id}/read`, { method: 'PATCH' });

// Evaluation Periods
export const apiGetEvaluationPeriods = (): Promise<EvaluationPeriod[]> => apiRequest<EvaluationPeriod[]>('/periods');
export const apiCreateEvaluationPeriod = (periodData: Partial<EvaluationPeriod>): Promise<EvaluationPeriod> => apiRequest<EvaluationPeriod>('/periods', { method: 'POST', body: JSON.stringify(periodData) });
export const apiUpdateEvaluationPeriod = (periodId: string, periodData: Partial<EvaluationPeriod>): Promise<EvaluationPeriod> => apiRequest<EvaluationPeriod>(`/periods/${periodId}`, { method: 'PUT', body: JSON.stringify(periodData) });
export const apiDeleteEvaluationPeriod = (periodId: string): Promise<void> => apiRequest<void>(`/periods/${periodId}`, { method: 'DELETE' });

export const apiGetActiveEvaluationPeriods = (): Promise<EvaluationPeriod[]> => apiRequest<EvaluationPeriod[]>('/periods/active');

export const apiGetUsersByRoleAndDepartment = (
  role: UserRole,
  departmentId: string,
  excludeUserId?: string
): Promise<User[]> => {
  const params = new URLSearchParams({ role, departmentId });
  if (excludeUserId) {
    params.append('excludeUserId', excludeUserId);
  }
  return apiRequest<User[]>(`/users/by-role-department?${params.toString()}`);
};

export const apiAssignEvaluation = async (payload: AssignEvaluationPayload): Promise<{ message: string }> => {
    const token = sessionStorage.getItem('authToken');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/evaluations/assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to assign evaluators.');
    }

    return data;
};

// Reports
export const apiGetMyPerformance = (): Promise<any[]> => apiRequest<any[]>('/reports/my-performance');
export const apiGetDepartmentReport = (): Promise<any[]> => apiRequest<any[]>('/reports/department');

export const api = {
    get: <T>(url: string) => apiRequest<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: any) => apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(url: string, body: any) => apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(url: string) => apiRequest<T>(url, { method: 'DELETE' })
};