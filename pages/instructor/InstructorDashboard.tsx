
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiGetMyPerformance } from '../../services/api';
import { toast } from 'react-hot-toast';

interface PerformanceData {
    period: string;
    studentScore: number;
    peerScore: number;
    deptHeadScore: number;
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
                // Normalize period to human-readable name if populated
                const mapped = data.map((d: any) => ({
                    ...d,
                    period: d.period && typeof d.period === 'object' ? d.period : d.period,
                }));

                // Group by period so each period appears once and contains the four scores
                const groupedByPeriod = mapped.reduce((acc: Record<string, any>, item: any) => {
                    const periodId = item.period && item.period._id ? String(item.period._id) : (item.period || 'unknown');

                    const record = {
                        period: item.period && item.period.name ? item.period.name : (typeof item.period === 'string' ? item.period : String(item.period)),
                        studentScore: item.studentScore || 0,
                        peerScore: item.peerScore || 0,
                        deptHeadScore: item.deptHeadScore || 0,
                        finalScore: item.finalScore || 0,
                        lastUpdated: item.lastUpdated || item.updatedAt || null,
                    };

                    if (!acc[periodId]) {
                        acc[periodId] = record;
                    } else {
                        // keep the most recently updated record for the period
                        const existingUpdated = acc[periodId].lastUpdated ? new Date(acc[periodId].lastUpdated).getTime() : 0;
                        const itemUpdated = record.lastUpdated ? new Date(record.lastUpdated).getTime() : 0;
                        if (itemUpdated > existingUpdated) acc[periodId] = record;
                    }

                    return acc;
                }, {} as Record<string, any>);

                // Sort by newest period first (by lastUpdated)
                const ordered = Object.values(groupedByPeriod).sort((a: any, b: any) => {
                    const ta = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                    const tb = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                    return tb - ta;
                });

                setPerformanceData(ordered);
            } catch (error) {
                toast.error("Failed to fetch performance data.");
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchPerformance();
    }, []);

    if (loading) return <div>Loading performance data...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">My Performance</h1>
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">Welcome, {user ? `${user.firstName} ${user.lastName}` : ''}. Here is a summary of your recent evaluations.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h3 className="text-sm text-gray-500">Periods with Scores</h3>
                    <p className="text-2xl font-semibold">{performanceData.length}</p>
                    <p className="text-sm text-gray-400">Historical performance periods</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h3 className="text-sm text-gray-500">Final Score (latest)</h3>
                    <p className="text-2xl font-semibold">{performanceData.length ? performanceData[0].finalScore : 'N/A'}</p>
                    <p className="text-sm text-gray-400">Calculated from student/peer/dept weights</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Scores by Evaluation Period</h2>
                {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="period" className="text-xs" />
                            <YAxis type="number" domain={[0, 100]} className="text-xs" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                            <Legend />
                            <Bar dataKey="studentScore" name="Student Score" fill="#3b82f6" />
                            <Bar dataKey="peerScore" name="Peer Score" fill="#84cc16" />
                            <Bar dataKey="deptHeadScore" name="Dept. Head Score" fill="#f97316" />
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
