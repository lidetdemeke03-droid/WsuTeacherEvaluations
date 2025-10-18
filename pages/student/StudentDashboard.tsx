
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare } from 'lucide-react';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Student Dashboard</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user?.name}!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div whileHover={{ scale: 1.03 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <Link to="/student/evaluations" className="flex flex-col items-center text-center">
                        <FileText size={48} className="text-blue-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-white">My Evaluations</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">View and complete your assigned teacher evaluations.</p>
                    </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <Link to="/complaints" className="flex flex-col items-center text-center">
                        <MessageSquare size={48} className="text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-white">Submit a Complaint</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Have an issue? Submit a complaint here.</p>
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default StudentDashboard;
