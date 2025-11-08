
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGetDepartmentTeachers, apiGetDepartmentReport, apiGetComplaints } from '../../services/api';
import { User } from '../../types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DepartmentHeadDashboard: React.FC = () => {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [analytics, setAnalytics] = useState<any | null>(null);
    const [complaints, setComplaints] = useState<any[]>([]);

    useEffect(() => {
        const deptId = String((user as any).department || user?.departmentId || '');
        if (user && deptId) {
            Promise.all([
                apiGetDepartmentTeachers(deptId),
                apiGetDepartmentReport(),
                apiGetComplaints(),
            ]).then(([list, report, complaintsList]) => {
                setTeachers(list || []);
                setAnalytics(report || null);
                // filter complaints to department if necessary; backend already restricts for department head
                setComplaints(complaintsList || []);
            }).catch(err => console.error('Error fetching department data:', err))
            .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Department Head Dashboard</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome, {user?.name}!</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-sm text-gray-500">Teachers</h3>
                    <p className="text-2xl font-semibold">{teachers.length}</p>
                    <p className="text-sm text-gray-400">Total teachers in your department</p>
                    <Link to="/reports" className="text-sm text-blue-500 mt-2 inline-block">View reports</Link>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-sm text-gray-500">Complaints</h3>
                    <p className="text-2xl font-semibold">{complaints.length}</p>
                    <p className="text-sm text-gray-400">Open / recent complaints</p>
                    <Link to="/complaints" className="text-sm text-blue-500 mt-2 inline-block">Manage complaints</Link>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-sm text-gray-500">Department Analytics</h3>
                    <p className="text-2xl font-semibold">{analytics ? analytics.average.toFixed(2) : 'N/A'}</p>
                    <p className="text-sm text-gray-400">Average final score</p>
                    <Link to="/reports" className="text-sm text-blue-500 mt-2 inline-block">See analytics</Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-white">Teachers in Your Department</h2>
                {loading ? (
                    <p>Loading teachers...</p>
                ) : (
                    <ul className="mt-4 space-y-4">
                        {teachers.map(teacher => (
                            <li key={teacher._id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{teacher.firstName} {teacher.lastName}</p>
                                    <p className="text-sm text-gray-500">Evaluation Status: Pending</p>
                                </div>
                                <Link to={`/department/evaluate/${teacher._id}`} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    Evaluate
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </motion.div>
    );
};

export default DepartmentHeadDashboard;
