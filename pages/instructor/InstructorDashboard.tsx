
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiGetMyPerformance } from '../../services/api';
import { toast } from 'react-hot-toast';

interface PerformanceData {
    period: string;
    studentAvg: number;
    peerAvg: number;
    deptAvg: number;
    finalScore: number;
}

const InstructorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const data = await apiGetMyPerformance();
                setPerformanceData(data);
            } catch (error) {
                toast.error("Failed to fetch performance data.");
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, []);

    if (loading) return <div>Loading performance data...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">My Performance</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Welcome, {user?.name}. Here is a summary of your recent evaluations.</p>
            
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Scores by Evaluation Period</h2>
                {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="period" className="text-xs" />
                            <YAxis type="number" domain={[0, 5]} className="text-xs" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                            <Legend />
                            <Bar dataKey="studentAvg" name="Student Avg." fill="#3b82f6" />
                            <Bar dataKey="peerAvg" name="Peer Avg." fill="#84cc16" />
                            <Bar dataKey="deptAvg" name="Dept. Head Avg." fill="#f97316" />
                            <Bar dataKey="finalScore" name="Final Score" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p>No performance data available yet.</p>
                )}
            </div>
        </motion.div>
    );
};

export default InstructorDashboard;
