
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Users, Building, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api'; // Import the API service

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

// Define types for dashboard data
interface DashboardStats {
    totalUsers: number;
    totalDepartments: number;
    totalEvaluations: number;
    openComplaints: number;
}

interface EvaluationByDepartment {
    name: string;
    value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6F61', '#6B5B95', '#88B04B']; // More colors for more departments

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [evaluationsByDepartment, setEvaluationsByDepartment] = useState<EvaluationByDepartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, evalByDeptRes] = await Promise.all([
                    api.get('/admin/dashboard/stats'),
                    api.get('/admin/dashboard/evaluations-by-department')
                ]);
                setDashboardStats(statsRes);
                setEvaluationsByDepartment(evalByDeptRes);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="text-center text-gray-500 dark:text-gray-400">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 dark:text-red-400">{error}</div>;
    }

    // Placeholder for data if fetching fails or is empty
    const stats = dashboardStats || { totalUsers: 0, totalDepartments: 0, totalEvaluations: 0, openComplaints: 0 };
    const pieChartData = evaluationsByDepartment.length > 0 ? evaluationsByDepartment : [{ name: 'No Data', value: 1 }]; // Display 'No Data' if empty

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user?.name}!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { title: "Total Users", value: stats.totalUsers.toLocaleString(), icon: <Users className="text-blue-500" /> },
                    { title: "Departments", value: stats.totalDepartments.toLocaleString(), icon: <Building className="text-green-500" /> },
                    { title: "Evaluations", value: stats.totalEvaluations.toLocaleString(), icon: <FileText className="text-yellow-500" /> },
                    { title: "Open Complaints", value: stats.openComplaints.toLocaleString(), icon: <MessageSquare className="text-red-500" /> },
                ].map((item, index) => (
                    <motion.div key={item.title} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.1 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{item.value}</p>
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">{item.icon}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Evaluations by Department</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                                {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
