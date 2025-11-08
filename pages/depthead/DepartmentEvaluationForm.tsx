import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { departmentHeadEvaluationQuestions as questions } from '../../constants/forms';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGetTeacherCourses, apiGetEvaluationPeriods } from '../../services/api';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
};

const DepartmentEvaluationForm: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [answers, setAnswers] = useState<Record<string, { questionCode: string; score?: number; response?: string }>>({});
    const [[page, direction], setPage] = useState([0, 0]);
    const [submitting, setSubmitting] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');

    React.useEffect(() => {
        if (teacherId) {
            apiGetTeacherCourses(teacherId).then(list => setCourses(list)).catch(() => setCourses([]));
        }
    }, [teacherId]);

    const questionIndex = page;
    const question = questions[questionIndex];

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const handleAnswerChange = (questionCode: string, value: string | number, type: string = 'rating') => {
        setAnswers(prev => ({
            ...prev,
            [questionCode]: {
                ...prev[questionCode],
                questionCode,
                [type === 'text' ? 'response' : 'score']: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allScored = questions.filter(q => q.type === 'rating').every(q => answers[q.code]?.score);
        if (!allScored) {
            toast.error("Please provide a score for all rating questions.");
            return;
        }

        if (!selectedCourse) {
            toast.error('Please select a course for this evaluation.');
            setSubmitting(false);
            return;
        }

        setSubmitting(true);
        try {
            // Resolve periodId (use active period or most recent) to send the ObjectId to the server
            let resolvedPeriodId: string | undefined = undefined;
            try {
                const periods = await apiGetEvaluationPeriods();
                const active = periods.find((p: any) => p.status === 'Active');
                if (active) resolvedPeriodId = active._id;
                else if (periods.length > 0) {
                    periods.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                    resolvedPeriodId = periods[0]._id;
                }
            } catch (periodErr) {
                console.error('Failed to resolve evaluation period', periodErr);
            }

            if (!resolvedPeriodId) {
                toast.error('Could not determine the evaluation period. Try again later.');
                setSubmitting(false);
                return;
            }

            await api.post('/evaluations/department', {
                evaluatorId: user?.id,
                teacherId,
                courseId: selectedCourse || undefined,
                period: resolvedPeriodId,
                answers: Object.values(answers),
            });
            toast.success('Evaluation submitted successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Error submitting evaluation:', err);
            toast.error('Failed to submit evaluation.');
        } finally {
            setSubmitting(false);
        }
    };

    const progress = Math.round(((questionIndex + 1) / questions.length) * 100);

    return (
        <div className="container mx-auto p-4 flex flex-col h-full">
            <h1 className="text-3xl font-bold mb-4">Department Head Evaluation</h1>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Course (required)</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">-- Select course --</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
                </select>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <motion.div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
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
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute w-full h-full"
                    >
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <label className="block text-lg font-semibold mb-3">{questionIndex + 1}. {question.text}</label>
                            {question.type === 'text' ? (
                                <textarea
                                    className="p-2 border rounded w-full h-32"
                                    placeholder="Comments"
                                    value={answers[question.code]?.response || ''}
                                    onChange={e => handleAnswerChange(question.code, e.target.value, 'text')}
                                ></textarea>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    {[1, 2, 3, 4, 5].map(score => (
                                        <label key={score} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`score-${question.code}`}
                                                value={score}
                                                checked={answers[question.code]?.score === score}
                                                onChange={() => handleAnswerChange(question.code, score, 'rating')}
                                                className="sr-only"
                                            />
                                            <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${answers[question.code]?.score === score ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                                {score}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex justify-between items-center mt-6">
                <button onClick={() => paginate(-1)} disabled={questionIndex === 0} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
                    <ArrowLeft size={20} />
                </button>
                {questionIndex < questions.length - 1 ? (
                    <button onClick={() => paginate(1)} className="px-4 py-2 bg-blue-500 text-white rounded">
                        <ArrowRight size={20} />
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-green-500 text-white rounded flex items-center space-x-2">
                        <Send size={20} />
                        <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default DepartmentEvaluationForm;
