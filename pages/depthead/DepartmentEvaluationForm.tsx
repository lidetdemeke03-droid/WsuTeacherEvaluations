import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { departmentHeadEvaluationQuestions as questions } from '../../constants/forms';
import toast from 'react-hot-toast';
import { User, Course, EvaluationPeriod } from '../../types';
import { format } from 'date-fns';

const DepartmentEvaluationForm: React.FC = () => {
  const { teacherId, courseId, periodId } = useParams<{ teacherId: string; courseId: string; periodId: string }>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, { questionCode: string; score?: number; response?: string }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
        setLoadingDetails(true);
        const [teacherRes, courseRes, periodRes] = await Promise.all([
          api.get<User>(`/users/${teacherId}`),
          api.get<Course>(`/courses/${courseId}`),
          api.get<EvaluationPeriod>(`/periods/${periodId}`),
        ]);
        setTeacher(teacherRes);
        setCourse(courseRes);
        setPeriod(periodRes);

        const init: Record<string, { questionCode: string; score?: number; response?: string }> = {};
        questions.forEach((q) => {
          init[q.code] = { questionCode: q.code, score: undefined, response: undefined };
        });
        setAnswers(init);
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

  const question = questions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isQuestionAnswered = (questionCode: string) => {
    const answer = answers[questionCode];
    if (!answer) return false;
    const questionType = questions.find(q => q.code === questionCode)?.type;
    
    if (questionType === 'rating') {
        return answer.score !== undefined;
    }
    if (questionType === 'text') {
        return answer.response !== undefined && answer.response.trim() !== '';
    }
    return false;
  };

  const handleAnswerChange = (questionCode: string, value: string | number, type: 'rating' | 'text') => {
    setAnswers(prev => ({
      ...prev,
      [questionCode]: {
        ...prev[questionCode],
        questionCode,
        ...(type === 'text' ? { response: String(value) } : { score: Number(value) }),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId || !courseId || !periodId) {
      toast.error('Evaluation details are missing. Please go back and select them again.');
      return;
    }

    const allAnswered = questions.every(q => isQuestionAnswered(q.code));
    if (!allAnswered) {
      const firstUnanswered = questions.findIndex(q => !isQuestionAnswered(q.code));
      toast.error(`Please provide an answer for question ${firstUnanswered + 1}.`);
      setCurrentQuestionIndex(firstUnanswered);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slower"></div>
        </div>

        <div className="relative max-w-4xl mx-auto">
            {/* Header Section */}
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
                    <div className="mt-4">
                        <p className="text-blue-200 text-sm text-left">
                            Period: {period.name} ({format(new Date(period.startDate), 'MMM yyyy')} - {format(new Date(period.endDate), 'MMM yyyy')})
                        </p>
                    </div>
                </div>
            </div>

            {/* Back Button */}
            <div className="mb-6 flex justify-start animate-fade-in-up">
              <button
                onClick={() => navigate('/department/new-evaluation')}
                className="flex items-center space-x-2 bg-blue-700/50 hover:bg-blue-600/70 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 border border-blue-600/30"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" transform="rotate(180 12 12)" /></svg>
                  <span>Back</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 animate-fade-in-up">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-200 text-sm">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-blue-200 text-sm">
                        {progress}%
                    </span>
                </div>
                <div className="w-full bg-blue-700/50 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Evaluation Form */}
            <form onSubmit={handleSubmit}>
                <div
                    key={question.code}
                    className="bg-blue-800/30 backdrop-blur-sm border border-blue-600/20 rounded-2xl p-6 shadow-xl transform transition-all duration-300 animate-fade-in-up"
                >
                    <label className="block text-white text-lg font-semibold mb-4">
                        {question.text}
                    </label>

                    {question.type === 'rating' ? (
                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                            {[1, 2, 3, 4, 5].map((rating) => {
                                const isSelected = answers[question.code]?.score === rating;
                                return (
                                    <label
                                        key={rating}
                                        className="flex items-center cursor-pointer group transform transition-all duration-200 hover:scale-105"
                                    >
                                        <input
                                            type="radio"
                                            name={question.code}
                                            value={rating}
                                            onChange={() => handleAnswerChange(question.code, rating, 'rating')}
                                            required
                                            className="sr-only"
                                            checked={isSelected}
                                        />
                                        <div
                                            className={`
                                                w-10 h-10 sm:w-12 sm:h-12
                                                border-2 rounded-xl flex items-center justify-center
                                                text-white font-semibold transition-all duration-200
                                                ${isSelected
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-lg scale-110'
                                                    : 'bg-blue-700/50 border-blue-500/30 group-hover:bg-blue-600/70 group-hover:border-blue-400'
                                                }
                                            `}
                                        >
                                            {isSelected ? (
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
                    ) : (
                        <textarea
                            className="w-full p-4 bg-blue-900/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none"
                            rows={4}
                            placeholder="Enter your feedback here..."
                            onChange={(e) => handleAnswerChange(question.code, e.target.value, 'text')}
                            value={answers[question.code]?.response || ''}
                            required
                        />
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 space-x-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <button
                        type="button"
                        onClick={goToPreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center space-x-2 bg-blue-700/50 hover:bg-blue-600/70 disabled:bg-blue-900/30 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:scale-100 border border-blue-600/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Previous</span>
                    </button>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            type="button"
                            onClick={goToNextQuestion}
                            disabled={!isQuestionAnswered(question.code)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            <span>Next</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting || !isQuestionAnswered(question.code)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            <span className="relative z-10">
                                {submitting ? (
                                    <span className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Submitting...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center space-x-2">
                                        <span>Submit Evaluation</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    )}
                </div>
            </form>

            <div className="flex justify-center mt-6 space-x-2 animate-fade-in-up"
                style={{ animationDelay: '500ms' }}>
                {questions.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(index)}
                        disabled={!isQuestionAnswered(questions[index].code) && index > currentQuestionIndex}
                        className={`
                            w-3 h-3 rounded-full transition-all duration-300
                            ${index === currentQuestionIndex 
                                ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-125'
                                : 'bg-blue-600/50 hover:bg-blue-500/70'
                            }
                            ${!isQuestionAnswered(questions[index].code) && index > currentQuestionIndex ? 'cursor-not-allowed' : ''}
                        `}
                    >
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default DepartmentEvaluationForm;