import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageDepartmentsPage from './pages/admin/ManageDepartmentsPage';
import ManageEvaluationPeriodsPage from './pages/admin/ManageEvaluationPeriodsPage';
import StudentEvaluationsPage from './pages/student/StudentEvaluationsPage';
import ComplaintsPage from './pages/shared/ComplaintsPage';
import ReportsPage from './pages/shared/ReportsPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { UserRole } from './types';
import ManageCriteriaPage from './pages/admin/ManageCriteriaPage';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import HomePage from './pages/HomePage';
import Profile from './pages/profile/Profile';
import NewEvaluation from './pages/evaluation/NewEvaluation';
import InstructorResults from './pages/instructor/InstructorResults';

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

            {/* Private Routes */}
            <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                <Route path="/admin/users" element={<RoleProtectedRoute roles={[UserRole.Admin]}><ManageUsersPage /></RoleProtectedRoute>} />
                <Route path="/admin/departments" element={<RoleProtectedRoute roles={[UserRole.Admin]}><ManageDepartmentsPage /></RoleProtectedRoute>} />
                <Route path="/admin/periods" element={<RoleProtectedRoute roles={[UserRole.Admin]}><ManageEvaluationPeriodsPage /></RoleProtectedRoute>} />
                <Route path="/admin/criteria" element={<RoleProtectedRoute roles={[UserRole.Admin, UserRole.DepartmentHead]}><ManageCriteriaPage /></RoleProtectedRoute>} />
                
                <Route path="/student/evaluations" element={<RoleProtectedRoute roles={[UserRole.Student]}><StudentEvaluationsPage /></RoleProtectedRoute>} />

                <Route path="/instructor/performance" element={<RoleProtectedRoute roles={[UserRole.Instructor]}><InstructorDashboard /></RoleProtectedRoute>} />

                <Route path="/complaints" element={<RoleProtectedRoute roles={[UserRole.Admin, UserRole.DepartmentHead, UserRole.Instructor, UserRole.Student]}><ComplaintsPage /></RoleProtectedRoute>} />
                <Route path="/reports" element={<RoleProtectedRoute roles={[UserRole.Admin, UserRole.DepartmentHead]}><ReportsPage /></RoleProtectedRoute>} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/evaluation/new" element={<RoleProtectedRoute roles={[UserRole.Instructor, UserRole.DepartmentHead]}><NewEvaluation /></RoleProtectedRoute>} />
                <Route path="/instructor/results" element={<RoleProtectedRoute roles={[UserRole.DepartmentHead]}><InstructorResults /></RoleProtectedRoute>} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
