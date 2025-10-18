
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Users, Building, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const data = [
  { name: 'Jan', 'Avg Score': 4.2 },
  { name: 'Feb', 'Avg Score': 4.4 },
  { name: 'Mar', 'Avg Score': 4.1 },
  { name: 'Apr', 'Avg Score': 4.5 },
  { name: 'May', 'Avg Score': 4.6 },
  { name: 'Jun', 'Avg Score': 4.3 },
];

const pieData = [
    { name: 'Computer Science', value: 400 },
    { name: 'Business', value: 300 },
    { name: 'Engineering', value: 300 },
    { name: 'Health Science', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user?.name}!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { title: "Total Users", value: "1,250", icon: <Users className="text-blue-500" /> },
                    { title: "Departments", value: "12", icon: <Building className="text-green-500" /> },
                    { title: "Evaluations", value: "8,940", icon: <FileText className="text-yellow-500" /> },
                    { title: "Open Complaints", value: "5", icon: <MessageSquare className="text-red-500" /> },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Average Scores Over Time</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}/>
                            <Legend />
                            <Bar dataKey="Avg Score" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Evaluations by Department</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
