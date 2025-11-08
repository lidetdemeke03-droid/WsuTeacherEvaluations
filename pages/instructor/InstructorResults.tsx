import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiGetDepartmentReport } from '../../services/api';
import { toast } from 'react-hot-toast';

interface PerformanceData {
    teacher: {
        firstName: string;
        lastName: string;
    };
    period: string;
    studentScore: number;
    peerScore: number;
    deptHeadScore: number;
    finalScore: number;
}

const InstructorResults: React.FC = () => {
    const [reportData, setReportData] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await apiGetDepartmentReport();
                const mapped = data.map((d: any) => ({
                    ...d,
                    period: d.period && typeof d.period === 'object' ? d.period.name : d.period,
                }));

                // Group by teacher to ensure one bar per instructor (pick the most recently updated record)
                const groupedByTeacher = mapped.reduce((acc: Record<string, any>, item: any) => {
                    const teacherId = item.teacher && item.teacher._id ? String(item.teacher._id) : (item.teacher || 'unknown');
                    if (!acc[teacherId]) {
                        acc[teacherId] = item;
                    } else {
                        // prefer the most recently updated entry
                        const existing = acc[teacherId];
                        const existingUpdated = existing.lastUpdated ? new Date(existing.lastUpdated).getTime() : 0;
                        const itemUpdated = item.lastUpdated ? new Date(item.lastUpdated).getTime() : 0;
                        if (itemUpdated > existingUpdated) acc[teacherId] = item;
                    }
                    return acc;
                }, {} as Record<string, any>);

                setReportData(Object.values(groupedByTeacher));
            } catch (error) {
                toast.error("Failed to fetch department report.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    if (loading) return <div>Loading department report...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Instructor Results</h1>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Overall Scores by Instructor</h2>
                {reportData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="teacher.lastName" name="Instructor" className="text-xs" />
                            <YAxis type="number" domain={[0, 100]} className="text-xs" />
                            <Tooltip formatter={(value, name, props) => [`${props.payload.teacher.firstName} ${props.payload.teacher.lastName}: ${value}`, name]} contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                            <Legend />
                            <Bar dataKey="finalScore" name="Final Score" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p>No performance data available for this department yet.</p>
                )}
            </div>
        </motion.div>
    );
};

export default InstructorResults;
