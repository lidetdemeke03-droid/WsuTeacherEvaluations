import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageAdminsPage from './pages/superadmin/ManageAdminsPage';
import AuditLogsPage from './pages/superadmin/AuditLogsPage';
import ManageDepartmentsPage from './pages/admin/ManageDepartmentsPage';
import ManageEvaluationPeriodsPage from './pages/admin/ManageEvaluationPeriodsPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import StudentEvaluationsPage from './pages/student/StudentEvaluationsPage';
import ComplaintsPage from './pages/shared/ComplaintsPage';
import ReportsPage from './pages/shared/ReportsPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { UserRole } from './types';
import ManageCoursesPage from './pages/admin/ManageCoursesPage';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import HomePage from './pages/HomePage';
import Profile from './pages/profile/Profile';
import NewEvaluation from './pages/evaluation/NewEvaluation';
import DepartmentEvaluationForm from './pages/depthead/DepartmentEvaluationForm';
import InstructorResults from './pages/instructor/InstructorResults';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
// Peer review pages removed from public routes per request

const ProtectedLayout: React.FC = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};


const RoleProtectedRoute: React.FC<{ children: React.ReactElement; roles: UserRole[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const AppContent: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Private Routes */}
            <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                <Route path="/superadmin/admins" element={<RoleProtectedRoute roles={[UserRole.SuperAdmin]}><ManageAdminsPage /></RoleProtectedRoute>} />
                <Route path="/superadmin/audit-logs" element={<RoleProtectedRoute roles={[UserRole.SuperAdmin]}><AuditLogsPage /></RoleProtectedRoute>} />

                <Route path="/admin/users" element={<RoleProtectedRoute roles={[UserRole.Admin]}><ManageUsersPage /></RoleProtectedRoute>} />
                <Route path="/admin/courses" element={<RoleProtectedRoute roles={[UserRole.Admin]}><ManageCoursesPage /></RoleProtectedRoute>} />
                <Route path="/admin/departments" element={<RoleProtectedRoute roles={[UserRole.Admin]}><ManageDepartmentsPage /></RoleProtectedRoute>} />
                <Route path="/admin/periods" element={<RoleProtectedRoute roles={[UserRole.Admin]}><ManageEvaluationPeriodsPage /></RoleProtectedRoute>} />
                <Route path="/admin/reports" element={<RoleProtectedRoute roles={[UserRole.Admin]}><AdminReportsPage /></RoleProtectedRoute>} />
                
                <Route path="/student/evaluations" element={<RoleProtectedRoute roles={[UserRole.Student]}><StudentEvaluationsPage /></RoleProtectedRoute>} />

                <Route path="/instructor/performance" element={<RoleProtectedRoute roles={[UserRole.Teacher]}><InstructorDashboard /></RoleProtectedRoute>} />
                {/* Peer review routes disabled - not needed */}

                <Route path="/complaints" element={<RoleProtectedRoute roles={[UserRole.Admin, UserRole.DepartmentHead, UserRole.Teacher, UserRole.Student]}><ComplaintsPage /></RoleProtectedRoute>} />
                <Route path="/reports" element={<RoleProtectedRoute roles={[UserRole.Admin, UserRole.DepartmentHead]}><ReportsPage /></RoleProtectedRoute>} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/evaluation/new" element={<RoleProtectedRoute roles={[UserRole.Teacher, UserRole.DepartmentHead]}><NewEvaluation /></RoleProtectedRoute>} />
                <Route path="/department/evaluate/:teacherId" element={<RoleProtectedRoute roles={[UserRole.DepartmentHead]}><DepartmentEvaluationForm /></RoleProtectedRoute>} />
                <Route path="/instructor/results" element={<RoleProtectedRoute roles={[UserRole.DepartmentHead]}><InstructorResults /></RoleProtectedRoute>} />
            </route>
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" reverseOrder={false} />
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
