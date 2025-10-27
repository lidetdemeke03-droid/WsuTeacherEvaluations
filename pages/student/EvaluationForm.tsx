import React, { useState, useEffect, useCallback } from 'react';
import { Evaluation, Criterion } from '../../types';
import { apiGetCriteria, apiSubmitEvaluation } from '../../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EvaluationFormProps {
    evaluation: Evaluation;
    onBack: () => void;
    onComplete: (id: string) => void;
}

interface Answer {
    questionId: string;
    score?: number;
    response?: string;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ evaluation, onBack, onComplete }) => {
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const draftKey = `evaluation_draft_${evaluation.id}`;

    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const data = await apiGetCriteria();
                setCriteria(data);
                const initialAnswers: Record<string, Answer> = {};
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    setAnswers(JSON.parse(savedDraft));
                } else {
                    data.forEach(c => {
                        initialAnswers[c.id] = { questionId: c.id };
                    });
                    setAnswers(initialAnswers);
                }
            } catch (error) {
                console.error("Failed to fetch criteria", error);
                toast.error("Failed to load evaluation form.");
            } finally {
                setLoading(false);
            }
        };
        fetchCriteria();
    }, [evaluation.id, draftKey]);

    const saveDraft = useCallback(() => {
        localStorage.setItem(draftKey, JSON.stringify(answers));
    }, [answers, draftKey]);

    useEffect(() => {
        const timer = setInterval(saveDraft, 5000);
        return () => clearInterval(timer);
    }, [saveDraft]);

    const handleAnswerChange = (criterionId: string, score?: number, response?: string) => {
        setAnswers(prev => {
            const newAnswers = { ...prev };
            newAnswers[criterionId] = {
                ...newAnswers[criterionId],
                ...(score !== undefined && { score }),
                ...(response !== undefined && { response }),
            };
            return newAnswers;
        });
        saveDraft();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allScored = criteria.every(c => answers[c.id]?.score);
        if(!allScored){
            toast.error("Please provide a score for every criterion.");
            return;
        }
        setSubmitting(true);
        try {
            await apiSubmitEvaluation({
                courseId: evaluation.course._id,
                teacherId: evaluation.teacher._id,
                period: evaluation.period,
                answers: Object.values(answers),
            });
            toast.success("Evaluation submitted successfully.");
            localStorage.removeItem(draftKey);
            onComplete(evaluation.id);
        } catch (error) {
            console.error("Failed to submit evaluation", error);
            toast.error("Submission failed. Please try again.");
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
                            {[...Array(5)].map((_, i) => {
                                const scoreValue = i + 1;
                                return (
                                    <label key={scoreValue} className="flex flex-col items-center space-y-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`score-${criterion.id}`}
                                            value={scoreValue}
                                            checked={answers[criterion.id]?.score === scoreValue}
                                            onChange={() => handleAnswerChange(criterion.id, scoreValue)}
                                            className="sr-only"
                                        />
                                        <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${answers[criterion.id]?.score === scoreValue ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                                            {scoreValue}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <textarea
                            placeholder="Optional comments..."
                            value={answers[criterion.id]?.response || ''}
                            onChange={(e) => handleAnswerChange(criterion.id, undefined, e.target.value)}
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
