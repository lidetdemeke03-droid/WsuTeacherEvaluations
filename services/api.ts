
import { User, UserRole, Evaluation, Criterion, EvaluationSubmission } from '../types';

// --- MOCK DATABASE ---
const mockUsers: User[] = [
    { id: 'admin-1', name: 'Admin User', email: 'admin@wsu.edu', role: UserRole.Admin },
    { id: 'dept-1', name: 'Dr. Ananiya', email: 'jane.smith@wsu.edu', role: UserRole.DepartmentHead, departmentId: 'cs-1', departmentName: 'Computer Science' },
    { id: 'inst-1', name: 'Prof. Chala', email: 'john.doe@wsu.edu', role: UserRole.Instructor, departmentId: 'cs-1', departmentName: 'Computer Science' },
    { id: 'stud-1', name: 'Mahilet Wazema', email: 'alice.j@wsu.edu', role: UserRole.Student },
];

const mockEvaluations: Evaluation[] = [
    { id: 'eval-1', instructorName: 'Prof. John Doe', courseName: 'Introduction to Programming', periodName: 'Fall 2024', status: 'Pending' },
    { id: 'eval-2', instructorName: 'Dr. Emily White', courseName: 'Data Structures', periodName: 'Fall 2024', status: 'Pending' },
    { id: 'eval-3', instructorName: 'Prof. Michael Brown', courseName: 'Calculus I', periodName: 'Fall 2024', status: 'Completed' },
];

const mockCriteria: Criterion[] = [
    { id: 'crit-1', text: 'The instructor was well-prepared for class.', maxScore: 5 },
    { id: 'crit-2', text: 'The instructor explained concepts clearly.', maxScore: 5 },
    { id: 'crit-3', text: 'The instructor was engaging and enthusiastic.', maxScore: 5 },
    { id: 'crit-4', text: 'The instructor provided useful feedback on assignments.', maxScore: 5 },
    { id: 'crit-5', text: 'The instructor was fair in grading.', maxScore: 5 },
];


// --- MOCK API FUNCTIONS ---
const simulateDelay = <T,>(data: T, delay = 500): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

export const apiLogin = (email: string, pass: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockUsers.find(u => u.email === email);
            if (user && pass === 'password') { // Simple password check
                sessionStorage.setItem('authToken', user.id);
                resolve(user);
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1000);
    });
};

export const apiGetMe = (): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const userId = sessionStorage.getItem('authToken');
            if (userId) {
                const user = mockUsers.find(u => u.id === userId);
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error('User not found'));
                }
            } else {
                reject(new Error('Not authenticated'));
            }
        }, 200);
    });
};

export const apiLogout = (): Promise<void> => {
    sessionStorage.removeItem('authToken');
    return simulateDelay(undefined, 200);
}

export const apiGetStudentEvaluations = (studentId: string): Promise<Evaluation[]> => {
    // In a real app, this would filter by studentId
    return simulateDelay(mockEvaluations);
};

export const apiGetCriteria = (): Promise<Criterion[]> => {
    return simulateDelay(mockCriteria);
}

export const apiSubmitEvaluation = (submission: EvaluationSubmission): Promise<{ success: boolean }> => {
    console.log("Submitting evaluation:", submission);
    // Find the evaluation and mark it as completed
    const evaluationToUpdate = mockEvaluations.find(e => e.status === 'Pending'); // simplified logic
    if(evaluationToUpdate){
        evaluationToUpdate.status = 'Completed';
    }
    return simulateDelay({ success: true }, 1500);
}
