
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Clarity', 'Your Score': 4.5, 'Dept. Avg.': 4.2 },
  { name: 'Engagement', 'Your Score': 4.7, 'Dept. Avg.': 4.3 },
  { name: 'Fairness', 'Your Score': 4.3, 'Dept. Avg.': 4.4 },
  { name: 'Feedback', 'Your Score': 4.8, 'Dept. Avg.': 4.1 },
];

const InstructorDashboard: React.FC = () => {
    const { user } = useAuth();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">My Performance</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome, {user?.name}. Here is a summary of your recent evaluations.</p>
            
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Scores by Criterion</h2>
                 <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                        <XAxis type="number" domain={[0, 5]} className="text-xs" />
                        <YAxis type="category" dataKey="name" width={100} className="text-xs"/>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}/>
                        <Legend />
                        <Bar dataKey="Your Score" fill="#3b82f6" />
                        <Bar dataKey="Dept. Avg." fill="#84cc16" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </motion.div>
    );
};

export default InstructorDashboard;
