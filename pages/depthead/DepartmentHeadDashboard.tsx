
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const DepartmentHeadDashboard: React.FC = () => {
    const { user } = useAuth();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Department Head Dashboard</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome, {user?.name}!</p>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-white">Your Department's Overview</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">Here you can view analytics and manage evaluations for your department.</p>
            </div>
        </motion.div>
    );
};

export default DepartmentHeadDashboard;
