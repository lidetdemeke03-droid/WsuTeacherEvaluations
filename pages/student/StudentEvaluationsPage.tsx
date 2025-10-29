
import React, { useState, useEffect } from 'react';
import { apiGetStudentEvaluations } from '../../services/api';
import { Evaluation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle } from 'lucide-react';
import EvaluationForm from './EvaluationForm';

const StudentEvaluationsPage: React.FC = () => {
    const { user } = useAuth();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

    useEffect(() => {
        const fetchEvaluations = async () => {
            if (!user) return;
            try {
                const data = await apiGetStudentEvaluations(user._id);
                setEvaluations(data);
            } catch (error) {
                console.error("Failed to fetch evaluations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, []);
    
    const handleEvaluationComplete = (completedId: string) => {
        setEvaluations(prev => prev.map(ev => ev.id === completedId ? { ...ev, status: 'Completed' } : ev));
        setSelectedEvaluation(null);
    }

    if (loading) return <div>Loading evaluations...</div>;

    if (selectedEvaluation) {
        return <EvaluationForm evaluation={selectedEvaluation} onBack={() => setSelectedEvaluation(null)} onComplete={handleEvaluationComplete} />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">My Evaluations</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    <AnimatePresence>
                        {evaluations.map((evaluation, index) => (
                            <motion.li
                                key={evaluation.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div onClick={() => evaluation.status === 'Pending' && setSelectedEvaluation(evaluation)} className={`p-4 flex items-center justify-between ${evaluation.status === 'Pending' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'opacity-60'}`}>
                                    <div>
                                        <p className="font-semibold text-lg text-gray-800 dark:text-white">{evaluation.courseName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {evaluation.instructorName}</p>
                                        <p className="text-xs text-gray-500">{evaluation.periodName}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {evaluation.status === 'Completed' ? (
                                            <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                                <CheckCircle size={18} className="mr-2" /> Completed
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full">
                                                Pending
                                            </span>
                                        )}
                                        {evaluation.status === 'Pending' && <ChevronRight className="text-gray-400" />}
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                     {evaluations.length === 0 && <p className="p-4 text-center text-gray-500">No evaluations found.</p>}
                </ul>
            </div>
        </motion.div>
    );
};

export default StudentEvaluationsPage;
