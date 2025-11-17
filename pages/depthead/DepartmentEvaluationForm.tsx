import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { departmentHeadEvaluationQuestions as questions } from '../../constants/forms';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, Course, EvaluationPeriod } from '../../types';
import { format } from 'date-fns';

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 600 : -600, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 600 : -600, opacity: 0 }),
};

const DepartmentEvaluationForm: React.FC = () => {
  const { teacherId, courseId, periodId } = useParams<{ teacherId: string; courseId: string; periodId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, { questionCode: string; score?: number; response?: string }>>({});
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [submitting, setSubmitting] = useState(false);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // initialize and fetch details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!teacherId || !courseId || !periodId) {
        toast.error('Missing evaluation parameters.');
        navigate('/department/new-evaluation');
        return;
      }
      try {
        setLoadingDetails(true);
        const [teacherRes, courseRes, periodRes] = await Promise.all([
          api.get<User>(`/users/${teacherId}`),
          api.get<Course>(`/courses/${courseId}`),
          api.get<EvaluationPeriod>(`/periods/${periodId}`),
        ]);
        setTeacher(teacherRes);
        setCourse(courseRes);
        setPeriod(periodRes);

        // try to load draft specific to this department evaluation
        const draftKey = `dept_eval_draft_${teacherId}_${courseId}_${periodId}`;
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          try {
            setAnswers(JSON.parse(saved));
          } catch {
            localStorage.removeItem(draftKey);
            // init below
            const init: Record<string, { questionCode: string; score?: number; response?: string }> = {};
            questions.forEach((q) => {
              init[q.code] = { questionCode: q.code, score: undefined, response: undefined };
            });
            setAnswers(init);
          }
        } else {
          const init: Record<string, { questionCode: string; score?: number; response?: string }> = {};
          questions.forEach((q) => {
            init[q.code] = { questionCode: q.code, score: undefined, response: undefined };
          });
          setAnswers(init);
        }
      } catch (err) {
        console.error('Error fetching evaluation details:', err);
        toast.error('Failed to load evaluation details.');
        navigate('/department/new-evaluation');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [teacherId, courseId, periodId, navigate]);

  // Auto-save draft every 5s
  useEffect(() => {
    const draftKey = `dept_eval_draft_${teacherId}_${courseId}_${periodId}`;
    const save = () => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(answers));
        setLastSaved(new Date());
      } catch {}
    };
    const timer = setInterval(save, 5000);
    return () => clearInterval(timer);
  }, [answers, teacherId, courseId, periodId]);

  const questionIndex = page;
  const question = questions[questionIndex];
  const progress = Math.round(((questionIndex + 1) / questions.length) * 100);

  const paginate = (newDirection: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage([page + newDirection, newDirection]);
  };

  const handleAnswerChange = (questionCode: string, value: string | number, type: 'rating' | 'text' = 'rating') => {
    setAnswers(prev => {
      const updated = {
        ...prev,
        [questionCode]: {
          ...prev[questionCode],
          questionCode,
          ...(type === 'text' ? { response: String(value) } : { score: Number(value) }),
        },
      };
      return updated;
    });

    // optimistic save once
    try {
      const draftKey = `dept_eval_draft_${teacherId}_${courseId}_${periodId}`;
      const next = {
        ...answers,
        [questionCode]: {
          ...(answers[questionCode] || { questionCode }),
          questionCode,
          ...(type === 'text' ? { response: String(value) } : { score: Number(value) }),
        },
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
      setLastSaved(new Date());
    } catch {}
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof (e as any).preventDefault === 'function') (e as React.FormEvent).preventDefault();

    if (!teacherId || !courseId || !periodId) {
      toast.error('Evaluation details are missing. Please go back and select them again.');
      return;
    }

    const allScored = questions.filter(q => q.type === 'rating').every(q => !!answers[q.code]?.score);
    if (!allScored) {
      const firstUnanswered = questions.findIndex(q => q.type === 'rating' && !answers[q.code]?.score);
      toast.error(`Please provide a score for question ${firstUnanswered + 1}.`);
      setPage([firstUnanswered, firstUnanswered > page ? 1 : -1]);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/evaluations/department', {
        teacherId,
        courseId,
        period: periodId,
        answers: Object.values(answers),
      });

      toast.success('Evaluation submitted successfully!');
      // clear draft
      try {
        const draftKey = `dept_eval_draft_${teacherId}_${courseId}_${periodId}`;
        localStorage.removeItem(draftKey);
      } catch {}
      navigate('/department/new-evaluation');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-400 rounded-full animate-bounce" />
          <div className="text-white text-lg font-medium">Loading evaluation details...</div>
        </div>
      </div>
    );
  }

  if (!teacher || !course || !period) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="text-white text-2xl font-bold mb-2">Error loading details</div>
          <p className="text-blue-200">Could not retrieve teacher, course, or period information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-12 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" />
        <div className="absolute bottom-24 right-20 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slower" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Department Head Evaluation
          </h1>

          <div className="bg-blue-800/50 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 shadow-2xl transform transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <p className="text-blue-200 font-semibold">Teacher</p>
                <p className="text-white text-lg font-medium">{teacher.firstName} {teacher.lastName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-blue-200 font-semibold">Course</p>
                <p className="text-white text-lg font-medium">{course.title} ({course.code})</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-blue-200 text-sm">
                Period: {period.name} ({format(new Date(period.startDate), 'MMM yyyy')} - {format(new Date(period.endDate), 'MMM yyyy')})
              </p>
              {lastSaved && (
                <div className="flex items-center space-x-2 text-sm text-blue-200">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 animate-fade-in-up">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-200 text-sm">Question {questionIndex + 1} of {questions.length}</span>
            <span className="text-blue-200 text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-blue-700/30 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="relative">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0"
            >
              <div className="bg-blue-800/30 backdrop-blur-sm border border-blue-600/20 rounded-2xl p-6 shadow-xl transform transition-all duration-300 animate-fade-in-up max-h-[65vh] overflow-auto">
                <p className="text-white text-lg sm:text-xl font-semibold mb-4 leading-snug">
                  {questionIndex + 1}. {question.text}
                </p>

                {question.type === 'text' ? (
                  <textarea
                    className="w-full mt-4 p-4 bg-blue-900/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none h-36"
                    placeholder="Write your comments..."
                    value={answers[question.code]?.response || ''}
                    onChange={(e) => handleAnswerChange(question.code, e.target.value, 'text')}
                  />
                ) : (
                  <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 w-full px-1 justify-center sm:justify-start">
                    {[1,2,3,4,5].map((score) => {
                      const selected = answers[question.code]?.score === score;
                      return (
                        <label key={score} className="flex items-center cursor-pointer group transform transition-all duration-200 hover:scale-105">
                          <input
                            type="radio"
                            name={`score-${question.code}`}
                            value={score}
                            checked={selected}
                            onChange={() => handleAnswerChange(question.code, score, 'rating')}
                            className="sr-only"
                          />
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-semibold transition-all duration-200
                            ${selected ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white shadow-lg scale-105' : 'bg-blue-700/50 border-blue-500/30 text-white group-hover:bg-blue-600/70 group-hover:border-blue-400'}`}>
                            {selected ? (
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              score
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicators */}
        <div className="flex justify-center mt-6 space-x-2 animate-fade-in-up">
          {questions.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPage([idx, idx > page ? 1 : -1])}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === page ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-125' : 'bg-blue-600/50 hover:bg-blue-500/70'}`}
              aria-label={`Go to question ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/department/new-evaluation')}
            className="flex items-center space-x-2 bg-blue-700/30 hover:bg-blue-700/50 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => paginate(-1)}
              disabled={questionIndex === 0}
              className="flex items-center space-x-2 bg-blue-700/50 hover:bg-blue-600/70 disabled:bg-blue-900/30 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:scale-100"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>

            {questionIndex < questions.length - 1 ? (
              <button
                onClick={() => paginate(1)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="relative overflow-hidden group flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Evaluation</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentEvaluationForm;
