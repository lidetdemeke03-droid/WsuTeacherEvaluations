import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, apiGetPeerAssignments } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { peerEvaluationQuestions as questions } from '../../constants/forms';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const pageVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

const PeerReviewForm: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, { questionCode: string; score?: number; response?: string }>>({});
  const [conflict, setConflict] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [[page, direction], setPage] = useState([0, 0]);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentData, setAssignmentData] = useState<any | null>(null);

  const questionIndex = page;
  const question = questions[questionIndex];
  const progress = Math.round(((questionIndex + 1) / questions.length) * 100);

  // load assignment data
  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId || !user) return;
      try {
        const list = await apiGetPeerAssignments((user as any)._id);
        const found = (list || []).find((a: any) => a._id === assignmentId);
        setAssignmentData(found || null);
      } catch (err) {
        console.error('Failed to load assignment data', err);
      }
    };
    loadAssignment();
  }, [assignmentId, user]);

  const paginate = (newDirection: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage([Math.max(0, page + newDirection), newDirection]);
  };

  const handleAnswerChange = (questionCode: string, value: string | number, type: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionCode]: {
        ...prev[questionCode],
        questionCode,
        [type === 'text' ? 'response' : 'score']: value,
      },
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!conflict) {
      const allScored = questions.filter(q => q.type === 'rating').every(q => answers[q.code]?.score !== undefined);
      if (!allScored) {
        toast.error('Please provide a score for all rating questions.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        teacherId: assignmentData ? assignmentData.targetTeacher._id : undefined,
        courseId: assignmentData ? assignmentData.course._id : undefined,
        answers: conflict ? [{ conflict: true, reason }] : Object.values(answers),
      };
      await api.post('/peers/evaluations', payload);
      toast.success('Peer evaluation submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      toast.error('Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  // small helper to render rating buttons (consistent with EvaluationForm)
  const RatingButtons: React.FC<{ qCode: string }> = ({ qCode }) => (
    <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mt-2 w-full px-1">
      {[1, 2, 3, 4, 5].map(score => {
        const selected = answers[qCode]?.score === score;
        return (
          <motion.button
            key={score}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleAnswerChange(qCode, score, 'rating')}
            className={`
              w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 font-medium text-base sm:text-lg
              flex items-center justify-center transition-all
              ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-900/40 border-blue-700 text-gray-200 hover:bg-blue-800/60'}
            `}
            aria-pressed={selected}
          >
            {score}
          </motion.button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-5 md:p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-sm text-white/85">Peer Evaluation</div>
        </div>

        {/* Conflict toggle */}
        <div className="mb-4">
          <label className="flex items-center space-x-3 text-white">
            <input
              type="checkbox"
              checked={conflict}
              onChange={e => setConflict(e.target.checked)}
              className="w-5 h-5 accent-blue-400 bg-white/5 rounded"
            />
            <span className="select-none">Declare Conflict of Interest</span>
          </label>
        </div>

        {/* Progress bar (visible and compact) */}
        <div className="mb-4">
          <div className="w-full bg-blue-950 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-blue-500 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-xs text-white/80 mt-2 text-right">{progress}%</div>
        </div>

        {/* Question container */}
        <div className="relative overflow-visible">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0"
            >
              <div className="bg-blue-950/60 rounded-lg shadow-lg border border-blue-700 p-4 sm:p-6 max-h-[72vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700">
                {/* Question or conflict area */}
                <AnimatePresence>
                  {conflict ? (
                    <motion.div
                      key="conflict"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                    >
                      <label htmlFor="reason" className="block text-lg font-semibold mb-3 text-white">
                        Reason for Conflict
                      </label>
                      <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-40 p-3 rounded-lg bg-blue-900/60 text-white border border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none"
                        placeholder="Explain why you have a conflict of interest..."
                        required
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="question"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                    >
                      <div className="mb-4">
                        <div className="text-lg sm:text-xl font-semibold text-white mb-3 leading-snug">
                          {questionIndex + 1}. {question.text}
                        </div>

                        {question.type === 'rating' ? (
                          <RatingButtons qCode={question.code} />
                        ) : (
                          <textarea
                            value={answers[question.code]?.response || ''}
                            onChange={(e) => handleAnswerChange(question.code, e.target.value, 'text')}
                            className="w-full p-3 rounded-lg bg-blue-900/60 text-white border border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none resize-none h-36"
                            placeholder="Your comments..."
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => paginate(-1)}
            disabled={questionIndex === 0}
            className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-white/6 hover:bg-white/10 transition disabled:opacity-40"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft size={16} />
              <span className="text-white">Previous</span>
            </div>
          </button>

          {questionIndex < questions.length - 1 && !conflict ? (
            <button
              type="button"
              onClick={() => paginate(1)}
              className="flex-1 sm:flex-none px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 transition flex items-center justify-center gap-2"
            >
              <span className="text-white">Next</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none px-5 py-2 rounded-full bg-green-600 hover:bg-green-500 transition flex items-center justify-center gap-2"
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit'}</span>
            </button>
          )}
        </div>
      </motion.form>
    </div>
  );
};

export default PeerReviewForm;
