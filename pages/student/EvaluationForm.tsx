
import React, { useState, useEffect } from 'react';
import { Evaluation, Criterion } from '../../types';
import { apiGetCriteria, apiSubmitEvaluation } from '../../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';

interface EvaluationFormProps {
    evaluation: Evaluation;
    onBack: () => void;
    onComplete: (id: string) => void;
}

interface Score {
    criterionId: string;
    score: number;
    comment: string;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ evaluation, onBack, onComplete }) => {
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scores, setScores] = useState<Record<string, Score>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const data = await apiGetCriteria();
                setCriteria(data);
                const initialScores: Record<string, Score> = {};
                data.forEach(c => {
                    initialScores[c.id] = { criterionId: c.id, score: 0, comment: '' };
                });
                setScores(initialScores);
            } catch (error) {
                console.error("Failed to fetch criteria", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCriteria();
    }, []);

    const handleScoreChange = (criterionId: string, score: number) => {
        setScores(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], score } }));
    };

    const handleCommentChange = (criterionId: string, comment: string) => {
        setScores(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], comment } }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allScored = Object.values(scores).every(s => s.score > 0);
        if(!allScored){
            alert("Please provide a score for every criterion.");
            return;
        }
        setSubmitting(true);
        try {
            await apiSubmitEvaluation({
                // These would come from the evaluation object or user context
                studentId: 'student-1',
                instructorId: 'instructor-1',
                periodId: 'period-1',
                scores: Object.values(scores)
            });
            onComplete(evaluation.id);
        } catch (error) {
            console.error("Failed to submit evaluation", error);
            alert("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading form...</div>;

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <button onClick={onBack} className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline mb-6">
                <ArrowLeft size={18} />
                <span>Back to Evaluations</span>
            </button>

            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{evaluation.courseName}</h1>
            <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-6">Evaluation for {evaluation.instructorName}</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {criteria.map((criterion, index) => (
                    <motion.div
                        key={criterion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                    >
                        <p className="font-semibold text-gray-700 dark:text-white">{index + 1}. {criterion.text}</p>
                        <div className="flex items-center space-x-4 mt-4">
                            {[...Array(criterion.maxScore)].map((_, i) => {
                                const scoreValue = i + 1;
                                return (
                                    <label key={scoreValue} className="flex flex-col items-center space-y-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`score-${criterion.id}`}
                                            value={scoreValue}
                                            checked={scores[criterion.id]?.score === scoreValue}
                                            onChange={() => handleScoreChange(criterion.id, scoreValue)}
                                            className="sr-only"
                                        />
                                        <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${scores[criterion.id]?.score === scoreValue ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                                            {scoreValue}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <textarea
                            placeholder="Optional comments..."
                            value={scores[criterion.id]?.comment}
                            onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                            className="mt-4 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                        />
                    </motion.div>
                ))}

                 <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  <Send size={18} />
                  <span>{submitting ? 'Submitting...' : 'Submit Evaluation'}</span>
                </motion.button>
            </form>
        </motion.div>
    );
};

export default EvaluationForm;
