
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import AdminDashboard from './admin/AdminDashboard';
import DepartmentHeadDashboard from './depthead/DepartmentHeadDashboard';
import InstructorDashboard from './instructor/InstructorDashboard';
import StudentDashboard from './student/StudentDashboard';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    const renderDashboard = () => {
        switch (user?.role) {
            case UserRole.Admin:
                return <AdminDashboard />;
            case UserRole.DepartmentHead:
                return <DepartmentHeadDashboard />;
            case UserRole.Teacher:
                return <InstructorDashboard />;
            case UserRole.Student:
                return <StudentDashboard />;
            default:
                return <div>Welcome! Please select an option from the sidebar.</div>;
        }
    };

    return (
        <div>
            {renderDashboard()}
        </div>
    );
};

export default DashboardPage;
