import React, { useState, useEffect, useCallback } from 'react';
import { Evaluation, Answer } from '../../types';
import { apiSubmitEvaluation, apiGetEvaluationPeriods, apiSubmitPeerEvaluation } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { studentEvaluationQuestions, peerEvaluationQuestions, departmentHeadEvaluationQuestions } from '../../constants/forms';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EvaluationFormProps {
    evaluation: Evaluation;
    onBack: () => void;
    onComplete: (id: string) => void;
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

const EvaluationForm: React.FC<EvaluationFormProps> = ({ evaluation, onBack, onComplete }) => {
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [submitting, setSubmitting] = useState(false);
    const [[page, direction], setPage] = useState([0, 0]);

    const questionIndex = page;

    const { user } = useAuth();

    // Select question set based on role
    const questionSet = user?.role === UserRole.Teacher
        ? peerEvaluationQuestions
        : user?.role === UserRole.DepartmentHead
            ? departmentHeadEvaluationQuestions
            : studentEvaluationQuestions;

    const question = questionSet[questionIndex];

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const evalIdForDraft = evaluation._id ?? (typeof evaluation.course === 'string' ? evaluation.course : evaluation.course?._id ?? 'draft');
    const draftKey = `evaluation_draft_${evalIdForDraft}`;

    useEffect(() => {
        // Load draft from local storage
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            setAnswers(JSON.parse(savedDraft));
        } else {
            const initialAnswers: Record<string, Answer> = {};
            questionSet.forEach(q => {
                initialAnswers[q.code] = {
                    questionCode: q.code,
                    score: undefined,
                    response: undefined,
                };
            });
            setAnswers(initialAnswers);
        }
    }, [evaluation._id, draftKey, user?.role]);

    const saveDraft = useCallback(() => {
        localStorage.setItem(draftKey, JSON.stringify(answers));
    }, [answers, draftKey]);

    useEffect(() => {
        const timer = setInterval(saveDraft, 5000); // Auto-save every 5 seconds
        return () => clearInterval(timer);
    }, [saveDraft]);

    const handleAnswerChange = (questionCode: string, score?: number, response?: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionCode]: {
                ...prev[questionCode],
                questionCode,
                ...(score !== undefined && { score }),
                ...(response !== undefined && { response }),
            }
        }));
        saveDraft();
    };


    const handleSubmit = async () => {
        const unansweredQuestionIndex = questionSet.findIndex(q => {
            if (q.type === 'rating') {
                const answer = answers[q.code];
                return !answer || answer.score === undefined;
            }
            return false;
        });

        if (unansweredQuestionIndex !== -1) {
            const unansweredQuestion = questionSet[unansweredQuestionIndex];
            setPage([unansweredQuestionIndex, unansweredQuestionIndex > page ? 1 : -1]);
            toast.error(`Please answer question ${unansweredQuestionIndex + 1}: "${unansweredQuestion.text}"`);
            return;
        }
        setSubmitting(true);
        try {
            // Support cases where API returns nested objects or just IDs
            const courseId = typeof evaluation.course === 'string' ? evaluation.course : (evaluation.course?._id ?? (evaluation.course as any)?.id ?? undefined);
            const teacherId = typeof evaluation.teacher === 'string' ? evaluation.teacher : (evaluation.teacher?._id ?? (evaluation.teacher as any)?.id ?? undefined);
            // period may be an object or a string id
            const periodId = typeof evaluation.period === 'string' ? evaluation.period : (evaluation.period?._id ?? (evaluation.period as any)?.id ?? undefined);

            // If periodId is missing, try to resolve an active/current period from the backend as a fallback
            let resolvedPeriodId = periodId;
            if (!resolvedPeriodId) {
                try {
                    const periods = await apiGetEvaluationPeriods();
                    // prefer an Active period, otherwise take the most recent by startDate
                    const active = periods.find((p: any) => p.status === 'Active');
                    if (active) resolvedPeriodId = active._id;
                    else if (periods.length > 0) {
                        // sort by startDate desc
                        periods.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                        resolvedPeriodId = periods[0]._id;
                    }
                } catch (fetchErr) {
                    console.error('Failed to fetch periods for fallback', fetchErr);
                }
            }

            if (!courseId || !teacherId || !resolvedPeriodId) {
                console.error('Missing identifiers for submission', { courseId, teacherId, periodId: resolvedPeriodId, evaluation });
                toast.error('Evaluation data is incomplete. Cannot submit.');
                setSubmitting(false);
                return;
            }

            if (user?.role === UserRole.Teacher) {
                // Peer evaluation submission
                await apiSubmitPeerEvaluation({
                    courseId,
                    teacherId,
                    period: resolvedPeriodId,
                    answers: Object.values(answers),
                });
            } else {
                await apiSubmitEvaluation({
                    courseId,
                    teacherId,
                    period: resolvedPeriodId,
                    answers: Object.values(answers),
                });
            }
            toast.success("Evaluation submitted successfully.");
            localStorage.removeItem(draftKey);
            onComplete(evaluation._id);
        } catch (error) {
            console.error("Failed to submit evaluation", error);
            toast.error("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const progress = Math.round(((questionIndex + 1) / questionSet.length) * 100);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="p-4 sm:p-6">
                <button onClick={onBack} className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline mb-4">
                    <ArrowLeft size={18} />
                    <span>Back to Evaluations</span>
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{evaluation.course.title}</h1>
                <h2 className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-2">For: {evaluation.teacher.firstName} {evaluation.teacher.lastName}</h2>
                <h3 className="text-sm text-gray-500 mb-4">Form: {user?.role === UserRole.Teacher ? 'Peer Evaluation' : user?.role === UserRole.DepartmentHead ? 'Department Head Evaluation' : 'Student Evaluation'}</h3>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                    <motion.div
                        className="bg-blue-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            <div className="flex-grow overflow-hidden relative">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute w-full h-full p-4 sm:p-6"
                    >
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col justify-between">
                            <p className="font-semibold text-lg text-gray-700 dark:text-white mb-4">{questionIndex + 1}. {question.text}</p>

                            {question.type === 'rating' && (
                                <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                                    {[...Array(5)].map((_, i) => {
                                        const scoreValue = i + 1;
                                        return (
                                            <label key={scoreValue} className="flex flex-col items-center space-y-1 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`score-${question.code}`}
                                                    value={scoreValue}
                                                    checked={answers[question.code]?.score === scoreValue}
                                                    onChange={() => handleAnswerChange(question.code, scoreValue)}
                                                    className="sr-only"
                                                />
                                                <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all ${answers[question.code]?.score === scoreValue ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                                                    {scoreValue}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    <label className="flex flex-col items-center space-y-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`score-${question.code}`}
                                            value={-1} // Using -1 to represent NA
                                            checked={answers[question.code]?.score === -1}
                                            onChange={() => handleAnswerChange(question.code, -1)}
                                            className="sr-only"
                                        />
                                        <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all ${answers[question.code]?.score === -1 ? 'bg-gray-500 text-white border-gray-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}>
                                            NA
                                        </span>
                                    </label>
                                </div>
                            )}

                            {question.type === 'text' && (
                                <textarea
                                    placeholder="Your comments..."
                                    value={answers[question.code]?.response || ''}
                                    onChange={(e) => handleAnswerChange(question.code, undefined, e.target.value)}
                                    className="w-full h-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:ring-blue-500 focus:border-blue-500"
                                    rows={5}
                                />
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="p-4 sm:p-6 flex justify-between items-center">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => paginate(-1)}
                    disabled={questionIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                >
                    <ArrowLeft size={18} /> <span>Previous</span>
                </motion.button>

                {questionIndex < questionSet.length - 1 ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => paginate(1)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 text-white"
                    >
                        <span>Next</span> <ArrowRight size={18} />
                    </motion.button>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-green-600 text-white disabled:bg-green-300"
                    >
                        <Send size={18} /> <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default EvaluationForm;
