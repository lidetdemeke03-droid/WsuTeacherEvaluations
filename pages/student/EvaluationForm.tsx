import React, { useState, useEffect, useCallback } from 'react';
import { Evaluation, Answer } from '../../types';
import {
  apiSubmitEvaluation,
  apiGetEvaluationPeriods,
  apiSubmitPeerEvaluation,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  studentEvaluationQuestions,
  peerEvaluationQuestions,
  departmentHeadEvaluationQuestions,
} from '../../constants/forms';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EvaluationFormProps {
  evaluation: Evaluation;
  onBack: () => void;
  onComplete: (id: string) => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 600 : -600, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 600 : -600, opacity: 0 }),
};

const EvaluationForm: React.FC<EvaluationFormProps> = ({ evaluation, onBack, onComplete }) => {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuth();

  const questionIndex = page;
  const questionSet =
    user?.role === UserRole.Teacher
      ? peerEvaluationQuestions
      : user?.role === UserRole.DepartmentHead
      ? departmentHeadEvaluationQuestions
      : studentEvaluationQuestions;

  const question = questionSet[questionIndex];

  const paginate = (dir: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage([page + dir, dir]);
  };

  const evalIdForDraft =
    evaluation._id ??
    (typeof evaluation.course === 'string'
      ? evaluation.course
      : evaluation.course?._id ?? 'draft');
  const formType =
    user?.role === UserRole.Teacher
      ? 'peer'
      : user?.role === UserRole.DepartmentHead
      ? 'dept'
      : 'student';
  const draftKey = `evaluation_draft_${evalIdForDraft}_${formType}`;

  // initialize answers (either from draft or default structure)
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
        return;
      } catch {
        localStorage.removeItem(draftKey);
      }
    }

    const init: Record<string, Answer> = {};
    questionSet.forEach((q) => {
      init[q.code] = { questionCode: q.code, score: undefined, response: undefined };
    });
    setAnswers(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, evaluation._id, /*questionSet intentionally not included to avoid overwriting while paging*/]);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(answers));
      setLastSaved(new Date());
    } catch (e) {
      // ignore localStorage failures silently
    }
  }, [answers, draftKey]);

  useEffect(() => {
    const timer = setInterval(saveDraft, 5000);
    return () => clearInterval(timer);
  }, [saveDraft]);

  const handleAnswerChange = (questionCode: string, score?: number, response?: string) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionCode]: {
          ...prev[questionCode],
          questionCode,
          ...(score !== undefined && { score }),
          ...(response !== undefined && { response }),
        },
      };
      return updated;
    });
    // optimistic save
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        ...answers,
        [questionCode]: {
          ...(answers[questionCode] || { questionCode }),
          questionCode,
          ...(score !== undefined && { score }),
          ...(response !== undefined && { response }),
        },
      }));
      setLastSaved(new Date());
    } catch {}
  };

  const handleSubmit = async () => {
    // validate ratings present for rating-type questions
    const firstUnanswered = questionSet.findIndex((q) => q.type === 'rating' && !answers[q.code]?.score);
    if (firstUnanswered !== -1) {
      toast.error(`Please answer question ${firstUnanswered + 1}`);
      // navigate to that question
      setPage([firstUnanswered, firstUnanswered > page ? 1 : -1]);
      return;
    }

    setSubmitting(true);
    try {
      const courseId = typeof evaluation.course === 'string' ? evaluation.course : evaluation.course?._id;
      const teacherId = typeof evaluation.teacher === 'string' ? evaluation.teacher : evaluation.teacher?._id;

      const periods = await apiGetEvaluationPeriods();
      const active = periods.find((p: any) => p.status === 'Active');
      const periodId = active?._id || periods[0]?._id;

      if (!courseId || !teacherId || !periodId) {
        toast.error('Incomplete data — cannot submit.');
        setSubmitting(false);
        return;
      }

      if (user?.role === UserRole.Teacher) {
        await apiSubmitPeerEvaluation({
          courseId,
          teacherId,
          period: periodId,
          answers: Object.values(answers),
        });
      } else {
        await apiSubmitEvaluation({
          courseId,
          teacherId,
          period: periodId,
          answers: Object.values(answers),
        });
      }

      toast.success('Evaluation submitted successfully!');
      localStorage.removeItem(draftKey);
      onComplete(evaluation._id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = Math.round(((questionIndex + 1) / questionSet.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" />
        <div className="absolute bottom-20 right-16 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slower" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Evaluation
          </h1>

          <div className="bg-blue-800/50 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 shadow-2xl transform transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <p className="text-blue-200 font-semibold">Course</p>
                <p className="text-white text-lg font-medium">{evaluation.course?.title ?? '—'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-blue-200 font-semibold">Teacher</p>
                <p className="text-white text-lg font-medium">
                  {evaluation.teacher?.firstName} {evaluation.teacher?.lastName}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-blue-200 text-sm">
                {user?.role === UserRole.Teacher
                  ? 'Peer Evaluation'
                  : user?.role === UserRole.DepartmentHead
                  ? 'Department Head Evaluation'
                  : 'Student Evaluation'}
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
            <span className="text-blue-200 text-sm">
              Question {questionIndex + 1} of {questionSet.length}
            </span>
            <span className="text-blue-200 text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-blue-700/30 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Card / Question Area */}
        <div className="relative">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0"
            >
              <div className="bg-blue-800/30 backdrop-blur-sm border border-blue-600/20 rounded-2xl p-6 shadow-xl transform transition-all duration-300 animate-fade-in-up max-h-[70vh] overflow-auto">
                <p className="text-white text-lg sm:text-xl font-semibold mb-4 leading-snug">
                  {questionIndex + 1}. {question.text}
                </p>

                {/* Rating */}
                {question.type === 'rating' && (
                  <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const selected = answers[question.code]?.score === rating;
                      return (
                        <label
                          key={rating}
                          className="flex items-center cursor-pointer group transform transition-all duration-200 hover:scale-105"
                        >
                          <input
                            type="radio"
                            name={question.code}
                            value={rating}
                            checked={selected}
                            onChange={() => handleAnswerChange(question.code, rating)}
                            className="sr-only"
                          />
                          <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-xl flex items-center justify-center text-white font-semibold transition-all duration-200
                            ${
                              selected
                                ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-lg scale-105'
                                : 'bg-blue-700/50 border-blue-500/30 group-hover:bg-blue-600/70 group-hover:border-blue-400'
                            }`}
                          >
                            {selected ? (
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              rating
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Textarea */}
                {question.type === 'text' && (
                  <textarea
                    placeholder="Your comments..."
                    value={answers[question.code]?.response || ''}
                    onChange={(e) => handleAnswerChange(question.code, undefined, e.target.value)}
                    rows={5}
                    className="w-full mt-4 p-4 bg-blue-900/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none"
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Question Indicators */}
        <div className="flex justify-center mt-6 space-x-2 animate-fade-in-up">
          {questionSet.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPage([idx, idx > page ? 1 : -1])}
              className={`w-3 h-3 rounded-full transition-all duration-300
                ${idx === page ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-125' : 'bg-blue-600/50 hover:bg-blue-500/70'}`}
              aria-label={`Go to question ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 bg-blue-700/30 hover:bg-blue-700/50 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => paginate(-1)}
              disabled={questionIndex === 0}
              className="flex items-center space-x-2 bg-blue-700/50 hover:bg-blue-600/70 disabled:bg-blue-900/30 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:scale-100"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>

            {questionIndex < questionSet.length - 1 ? (
              <button
                type="button"
                onClick={() => paginate(1)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
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

export default EvaluationForm;
