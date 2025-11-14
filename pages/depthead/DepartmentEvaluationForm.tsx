import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { departmentHeadEvaluationQuestions as questions } from '../../constants/forms';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, Course, EvaluationPeriod } from '../../types';
import { format } from 'date-fns';

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
};

const DepartmentEvaluationForm: React.FC = () => {
  const { teacherId, courseId, periodId } = useParams<{ teacherId: string; courseId: string; periodId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, { questionCode: string; score?: number; response?: string }>>({});
  const [[page, direction], setPage] = useState([0, 0]);
  const [submitting, setSubmitting] = useState(false);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!teacherId || !courseId || !periodId) {
        toast.error('Missing evaluation parameters.');
        navigate('/department/new-evaluation');
        return;
      }
      try {
        const [teacherDetails, courseDetails, periodDetails] = await Promise.all([
          api.get<User>(`/users/${teacherId}`),
          api.get<Course>(`/courses/${courseId}`),
          api.get<EvaluationPeriod>(`/periods/${periodId}`),
        ]);
        setTeacher(teacherDetails);
        setCourse(courseDetails);
        setPeriod(periodDetails);
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

  const questionIndex = page;
  const question = questions[questionIndex];
  const progress = Math.round(((questionIndex + 1) / questions.length) * 100);

  const paginate = (newDirection: number) => setPage([page + newDirection, newDirection]);

  const handleAnswerChange = (questionCode: string, value: string | number, type = 'rating') => {
    setAnswers(prev => ({
      ...prev,
      [questionCode]: {
        ...prev[questionCode],
        questionCode,
        [type === 'text' ? 'response' : 'score']: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId || !courseId || !periodId) {
      toast.error('Evaluation details are missing. Please go back and select them again.');
      return;
    }

    const allScored = questions.filter(q => q.type === 'rating').every(q => answers[q.code]?.score);
    if (!allScored) {
      toast.error('Please provide a score for all rating questions.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/evaluations/department', {
        teacherId,
        courseId,
        period: periodId, // Use the periodId from URL params
        answers: Object.values(answers),
      });

      toast.success('Evaluation submitted successfully!');
      navigate('/department/new-evaluation'); // Navigate back to the new evaluation page
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white flex items-center justify-center p-4">
        <p>Loading evaluation details...</p>
      </div>
    );
  }

  if (!teacher || !course || !period) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white flex items-center justify-center p-4">
        <p className="text-red-500">Error: Could not load all evaluation details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-white">
          Department Head Evaluation
        </h1>

        {/* Display Evaluation Details */}
        <div className="mb-6 p-4 bg-blue-950/60 rounded-lg shadow-md border border-blue-700">
          <h2 className="text-xl font-semibold text-white mb-2">Evaluation for:</h2>
          <p className="text-gray-200">
            <span className="font-medium">Teacher:</span> {teacher.firstName} {teacher.lastName}
          </p>
          <p className="text-gray-200">
            <span className="font-medium">Course:</span> {course.title} ({course.code})
          </p>
          <p className="text-gray-200">
            <span className="font-medium">Period:</span> {period.name} ({format(new Date(period.startDate), 'MMM yyyy')} - {format(new Date(period.endDate), 'MMM yyyy')})
          </p>
        </div>

        <div className="w-full bg-blue-950 rounded-full h-2.5 mb-6">
          <motion.div
            className="bg-blue-500 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="flex-grow overflow-hidden relative min-h-[200px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute w-full"
            >
              <div className="p-4 md:p-6 bg-blue-950/60 rounded-lg shadow-lg border border-blue-700">
                <label className="block text-lg font-semibold mb-3 text-white">
                  {questionIndex + 1}. {question.text}
                </label>
                {question.type === 'text' ? (
                  <textarea
                    className="w-full h-32 p-3 rounded-lg bg-blue-900/60 text-white border border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none"
                    placeholder="Write your comments..."
                    value={answers[question.code]?.response || ''}
                    onChange={e => handleAnswerChange(question.code, e.target.value, 'text')}
                  />
                ) : (
                  <div className="flex justify-between flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(score => (
                      <label key={score} className="cursor-pointer flex-1 min-w-[50px]">
                        <input
                          type="radio"
                          name={`score-${question.code}`}
                          value={score}
                          checked={answers[question.code]?.score === score}
                          onChange={() => handleAnswerChange(question.code, score, 'rating')}
                          className="sr-only"
                        />
                        <span
                          className={`w-full h-12 flex items-center justify-center rounded-full border-2 transition-all ${
                            answers[question.code]?.score === score
                              ? 'bg-blue-500 text-white border-blue-400 scale-110'
                              : 'bg-blue-900/40 border-blue-700 text-gray-300 hover:bg-blue-800/70'
                          }`}
                        >
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

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => paginate(-1)}
            disabled={questionIndex === 0}
            className="p-3 bg-blue-700 hover:bg-blue-600 rounded-full transition disabled:opacity-40"
          >
            <ArrowLeft size={20} />
          </button>

          {questionIndex < questions.length - 1 ? (
            <button
              onClick={() => paginate(1)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium flex items-center space-x-2 transition"
            >
              <ArrowRight size={20} />
              <span>Next</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-semibold flex items-center space-x-2 transition disabled:opacity-50"
            >
              <Send size={20} />
              <span>{submitting ? 'Submitting...' : 'Submit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentEvaluationForm;