import React, { useState, useEffect, useCallback } from 'react';
import { Evaluation, Answer } from '../../types';
import {
  apiSubmitEvaluation,
  apiGetEvaluationPeriods,
} from '../../services/api';
import { studentEvaluationQuestions } from '../../constants/forms';
import { CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EvaluationFormProps {
  evaluation: Evaluation;
  onBack: () => void;
  onComplete: (id: string) => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ evaluation, onBack, onComplete }) => {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const questionSet = studentEvaluationQuestions;
  const question = questionSet[currentQuestionIndex];

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questionSet.length - 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
      if (currentQuestionIndex > 0) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setCurrentQuestionIndex(prev => prev - 1);
      }
  };

  const isQuestionAnswered = (questionCode: string) => {
    const answer = answers[questionCode];
    if (!answer) return false;
    const questionType = questionSet.find(q => q.code === questionCode)?.type;
    
    if (questionType === 'rating') {
        return answer.score !== undefined;
    }
    if (questionType === 'text') {
        return answer.response !== undefined && answer.response.trim() !== '';
    }
    return false;
  };

  const evalIdForDraft =
    evaluation._id ??
    (typeof evaluation.course === 'string'
      ? evaluation.course
      : evaluation.course?._id ?? 'draft');
  const draftKey = `evaluation_draft_${evalIdForDraft}_student`;

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
  }, [draftKey, evaluation._id]);

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
    const currentAnswer = answers[questionCode] || { questionCode };
    const newAnswer = {
        ...currentAnswer,
        ...(score !== undefined && { score }),
        ...(response !== undefined && { response }),
    };

    const newAnswers = {
        ...answers,
        [questionCode]: newAnswer,
    };
    
    setAnswers(newAnswers);
    
    // optimistic save
    try {
      localStorage.setItem(draftKey, JSON.stringify(newAnswers));
      setLastSaved(new Date());
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstUnanswered = questionSet.findIndex((q) => !isQuestionAnswered(q.code));
    if (firstUnanswered !== -1) {
      toast.error(`Please answer question ${firstUnanswered + 1}`);
      setCurrentQuestionIndex(firstUnanswered);
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

      await apiSubmitEvaluation({
        courseId,
        teacherId,
        period: periodId,
        answers: Object.values(answers),
      });

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

  const progress = Math.round(((currentQuestionIndex + 1) / questionSet.length) * 100);

  if (!question) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="animate-pulse flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="text-white text-lg font-medium">Loading evaluation form...</div>
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
                 Student Evaluation
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
                        Student Evaluation
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

            {/* Back Button */}
            <div className="mb-6 flex justify-start animate-fade-in-up">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 bg-blue-700/50 hover:bg-blue-600/70 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 border border-blue-600/30"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" transform="rotate(180 12 12)" /></svg>
                  <span>Back to List</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 animate-fade-in-up">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-200 text-sm">
                        Question {currentQuestionIndex + 1} of {questionSet.length}
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
                                            onChange={() => handleAnswerChange(question.code, rating)}
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
                            onChange={(e) => handleAnswerChange(question.code, undefined, e.target.value)}
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

                    {currentQuestionIndex < questionSet.length - 1 ? (
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
                {questionSet.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(index)}
                        disabled={!isQuestionAnswered(questionSet[index].code) && index > currentQuestionIndex}
                        className={`
                            w-3 h-3 rounded-full transition-all duration-300
                            ${index === currentQuestionIndex 
                                ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-125'
                                : 'bg-blue-600/50 hover:bg-blue-500/70'
                            }
                            ${!isQuestionAnswered(questionSet[index].code) && index > currentQuestionIndex ? 'cursor-not-allowed' : ''}
                        `}
                    >
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default EvaluationForm;