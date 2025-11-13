import React, { useState, useEffect, useCallback } from 'react';
import { Evaluation, Answer } from '../../types';
import { apiSubmitEvaluation, apiGetEvaluationPeriods, apiSubmitPeerEvaluation } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { studentEvaluationQuestions, peerEvaluationQuestions, departmentHeadEvaluationQuestions } from '../../constants/forms';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EvaluationFormProps {
  evaluation: Evaluation;
  onBack: () => void;
  onComplete: (id: string) => void;
}

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 }),
};

const EvaluationForm: React.FC<EvaluationFormProps> = ({ evaluation, onBack, onComplete }) => {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [[page, direction], setPage] = useState([0, 0]);
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

  const paginate = (newDirection: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage([page + newDirection, newDirection]);
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

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
      } catch {
        localStorage.removeItem(draftKey);
      }
    } else {
      const init: Record<string, Answer> = {};
      questionSet.forEach((q) => {
        init[q.code] = { questionCode: q.code, score: undefined, response: undefined };
      });
      setAnswers(init);
    }
  }, [draftKey, evaluation._id, questionSet]);

  const saveDraft = useCallback(() => {
    localStorage.setItem(draftKey, JSON.stringify(answers));
    setLastSaved(new Date());
  }, [answers, draftKey]);

  useEffect(() => {
    const timer = setInterval(saveDraft, 5000);
    return () => clearInterval(timer);
  }, [saveDraft]);

  const handleAnswerChange = (questionCode: string, score?: number, response?: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionCode]: {
        ...prev[questionCode],
        questionCode,
        ...(score !== undefined && { score }),
        ...(response !== undefined && { response }),
      },
    }));
    saveDraft();
  };

  const handleSubmit = async () => {
    const unanswered = questionSet.findIndex((q) => q.type === 'rating' && !answers[q.code]?.score);
    if (unanswered !== -1) {
      toast.error(`Please answer question ${unanswered + 1}`);
      setPage([unanswered, unanswered > page ? 1 : -1]);
      return;
    }

    setSubmitting(true);
    try {
      const courseId =
        typeof evaluation.course === 'string' ? evaluation.course : evaluation.course?._id;
      const teacherId =
        typeof evaluation.teacher === 'string' ? evaluation.teacher : evaluation.teacher?._id;

      const periods = await apiGetEvaluationPeriods();
      const active = periods.find((p: any) => p.status === 'Active');
      const periodId = active?._id || periods[0]?._id;

      if (!courseId || !teacherId || !periodId) {
        toast.error('Incomplete data — cannot submit.');
        setSubmitting(false);
        return;
      }

      if (user?.role === UserRole.Teacher) {
        await apiSubmitPeerEvaluation({ courseId, teacherId, period: periodId, answers: Object.values(answers) });
      } else {
        await apiSubmitEvaluation({ courseId, teacherId, period: periodId, answers: Object.values(answers) });
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full max-w-3xl mx-auto px-4 sm:px-6 pb-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          {lastSaved && (
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle size={14} className="text-green-500" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {evaluation.course.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          For: {evaluation.teacher.firstName} {evaluation.teacher.lastName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {user?.role === UserRole.Teacher
            ? 'Peer Evaluation'
            : user?.role === UserRole.DepartmentHead
            ? 'Department Head Evaluation'
            : 'Student Evaluation'}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
          <motion.div
            className="bg-blue-600 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question Section */}
      <div className="flex-grow relative overflow-visible">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <div
              className="
                bg-white dark:bg-gray-800 
                p-4 sm:p-6 
                rounded-xl shadow-md 
                flex flex-col 
                justify-between 
                h-full 
                overflow-y-auto 
                max-h-[70vh] 
                scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700
              "
            >
              <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4 leading-snug">
                {questionIndex + 1}. {question.text}
              </p>

              {/* Rating Question */}
              {question.type === 'rating' && (
                <div
                  className="
                    flex 
                    justify-center 
                    flex-wrap 
                    gap-3 sm:gap-4 
                    mt-4 
                    w-full 
                    px-1 
                    overflow-visible
                  "
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <motion.button
                      key={score}
                      whileTap={{ scale: 0.9 }}
                      className={`
                        w-12 h-12 sm:w-14 sm:h-14 
                        rounded-full border-2 
                        font-medium 
                        text-base sm:text-lg
                        transition-all
                        flex items-center justify-center
                        ${
                          answers[question.code]?.score === score
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        }
                      `}
                      onClick={() => handleAnswerChange(question.code, score)}
                    >
                      {score}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Text Question */}
              {question.type === 'text' && (
                <textarea
                  placeholder="Your comments..."
                  value={answers[question.code]?.response || ''}
                  onChange={(e) => handleAnswerChange(question.code, undefined, e.target.value)}
                  className="
                    w-full 
                    mt-4 
                    p-3 
                    border border-gray-300 dark:border-gray-600 
                    rounded-lg 
                    bg-transparent 
                    focus:ring-blue-500 
                    focus:border-blue-500 
                    resize-none 
                    h-32 sm:h-40 
                    text-sm sm:text-base
                  "
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => paginate(-1)}
          disabled={questionIndex === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white w-full sm:w-auto disabled:opacity-50"
        >
          <ArrowLeft size={18} /> <span>Previous</span>
        </motion.button>

        {questionIndex < questionSet.length - 1 ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(1)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white w-full sm:w-auto"
          >
            <span>Next</span> <ArrowRight size={18} />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white w-full sm:w-auto disabled:bg-green-400"
          >
            <Send size={18} /> <span>{submitting ? 'Submitting...' : 'Submit'}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default EvaluationForm;
