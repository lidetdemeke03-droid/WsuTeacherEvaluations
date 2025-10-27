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
                        apiGetStudentCourses(user.id),
                        apiGetStudentEvaluations(user.id),
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
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user?.name}!</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Assigned Courses</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {courses.map(course => (
                                <li key={course.id} className="p-4">
                                    <p className="font-semibold text-lg text-gray-800 dark:text-white">{course.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{course.code} - {course.teacherName}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Pending Evaluations</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {pendingEvaluations.map(evaluation => (
                                <Link to={`/student/evaluations/${evaluation.id}`} key={evaluation.id}>
                                    <li className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div>
                                            <p className="font-semibold text-lg text-gray-800 dark:text-white">{evaluation.courseName}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {evaluation.instructorName}</p>
                                        </div>
                                        <ChevronRight className="text-gray-400" />
                                    </li>
                                </Link>
                            ))}
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Completed Evaluations</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {completedEvaluations.map(evaluation => (
                                <li key={evaluation.id} className="p-4 flex items-center justify-between opacity-60">
                                    <div>
                                        <p className="font-semibold text-lg text-gray-800 dark:text-white">{evaluation.courseName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {evaluation.instructorName}</p>
                                        <p className="text-xs text-gray-500">Submitted on: {new Date(evaluation.submittedAt).toLocaleDateString()}</p>
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
