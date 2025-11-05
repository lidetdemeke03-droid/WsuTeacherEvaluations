import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, CheckCircle } from 'lucide-react';
import { apiGetStudentCourses, apiGetStudentEvaluations } from '../../services/api';
import { Course, Evaluation } from '../../types';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    const [coursesData, evaluationsData] = await Promise.all([
                        apiGetStudentCourses(user._id),
                        apiGetStudentEvaluations(user._id),
                    ]);
                    setCourses(coursesData);
                    setEvaluations(evaluationsData);
                } catch (error) {
                    console.error("Failed to fetch data", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    const pendingEvaluations = evaluations.filter(ev => ev.status === 'Pending');
    const completedEvaluations = evaluations.filter(ev => ev.status === 'Completed');

    if (loading) return <div>Loading...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Student Dashboard</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user?.firstName}!</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Assigned Evaluations</h2>
                    {pendingEvaluations.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingEvaluations.map(evaluation => (
                                    <li key={evaluation._id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-lg text-gray-800 dark:text-white">{evaluation.course.title}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {evaluation.course.code} - Instructor: {evaluation.teacher.firstName} {evaluation.teacher.lastName}
                                            </p>
                                        </div>
                                        <Link to={`/student/evaluations/${evaluation._id}`}>
                                            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center">
                                                <FileText size={18} className="mr-2" />
                                                Start Evaluation
                                            </button>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <CheckCircle size={48} className="mx-auto text-green-500" />
                            <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">All Clear!</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">You have no pending evaluations at this time.</p>
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Completed Evaluations</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {completedEvaluations.map(evaluation => (
                                <li key={evaluation._id} className="p-4 flex items-center justify-between opacity-60">
                                    <div>
                                        <p className="font-semibold text-lg text-gray-800 dark:text-white">{evaluation.course.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {evaluation.teacher.firstName} {evaluation.teacher.lastName}</p>
                                        <p className="text-xs text-gray-500">Submitted on: {new Date(evaluation.submittedAt!).toLocaleDateString()}</p>
                                    </div>
                                    <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                        <CheckCircle size={18} className="mr-2" /> Completed
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default StudentDashboard;
