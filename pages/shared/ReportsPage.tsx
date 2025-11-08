
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Navigate } from 'react-router-dom';

const ReportsPage: React.FC = () => {
    const { user } = useAuth();

    // If admin, redirect to the admin reports page we implemented
    if (user && user.role === UserRole.Admin) {
        return <Navigate to="/admin/reports" replace />;
    }

    // Department heads see a simplified reports list (or we can extend later)
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reports</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Use this page to view previously generated reports. If you are an admin, you'll be redirected to the admin reports interface.</p>
        </div>
    );
};

export default ReportsPage;
