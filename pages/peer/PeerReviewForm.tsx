import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetPeerAssignmentDetails, apiSubmitPeerEvaluation } from '../../services/api';
import { PeerAssignment } from '../../types';
import { peerEvaluationQuestions } from '../../constants/forms';
import toast from 'react-hot-toast';

const PeerReviewForm: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<PeerAssignment | null>(null);
    const [responses, setResponses] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

    useEffect(() => {
        if (assignmentId) {
            apiGetPeerAssignmentDetails(assignmentId)
                .then(data => {
                    setAssignment(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching assignment details:', err);
                    toast.error('Failed to load assignment details.');
                    setLoading(false);
                });
        }
    }, [assignmentId]);

    const handleInputChange = (code: string, value: any) => {
        setResponses(prev => ({ ...prev, [code]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentId || !assignment) return;

        setSubmitting(true);

        const answers = Object.entries(responses).map(([questionCode, value]) => {
            const question = peerEvaluationQuestions.find(q => q.code === questionCode);
            if (question?.type === 'rating') {
                return { questionCode, score: Number(value) };
            }
            return { questionCode, text: String(value) };
        });

        const submission = {
            courseId: assignment.course._id,
            teacherId: assignment.targetTeacher._id,
            period: assignment.period,
            answers,
        };

        try {
            await apiSubmitPeerEvaluation(submission);
            toast.success('Evaluation submitted successfully!');
            navigate('/peer/review');
        } catch (error) {
            console.error('Error submitting evaluation:', error);
            toast.error('Failed to submit evaluation.');
        } finally {
            setSubmitting(false);
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < peerEvaluationQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const isQuestionAnswered = (questionCode: string) => {
        const qIndex = peerEvaluationQuestions.findIndex(q => q.code === questionCode);
        const qType = peerEvaluationQuestions[qIndex]?.type;

        // Make the last two text questions optional
        if (qType === 'text' && qIndex >= peerEvaluationQuestions.length - 2) {
            return true;
        }

        if (qType === 'rating') {
            return responses[questionCode] !== undefined && responses[questionCode] !== '';
        }

        if (qType === 'text') {
            return responses[questionCode] !== undefined && String(responses[questionCode]).trim() !== '';
        }

        return responses[questionCode] !== undefined && responses[questionCode] !== '';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="text-white text-lg font-medium">Loading evaluation form...</div>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
                <div className="text-center animate-fade-in">
                    <div className="text-white text-2xl font-bold mb-2">Assignment Not Found</div>
                    <p className="text-blue-200">The requested evaluation assignment could not be found.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = peerEvaluationQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / peerEvaluationQuestions.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-6 px-4 sm:px-6 lg:px-8">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slower"></div>
            </div>

            <div className="relative max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8 animate-slide-down">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Peer Evaluation
                    </h1>
                    <div className="bg-blue-800/50 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 shadow-2xl transform transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="space-y-2">
                                <p className="text-blue-200 font-semibold">Teacher to Evaluate</p>
                                <p className="text-white text-lg font-medium">
                                    {assignment.targetTeacher.firstName} {assignment.targetTeacher.lastName}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-blue-200 font-semibold">Course</p>
                                <p className="text-white text-lg font-medium">{assignment.course.title}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-200 text-sm">
                            Question {currentQuestionIndex + 1} of {peerEvaluationQuestions.length}
                        </span>
                        <span className="text-blue-200 text-sm">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-blue-700/50 rounded-full h-3">
                        <div 
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                </div>

                {/* Evaluation Form */}
                <form onSubmit={handleSubmit}>
                    <div 
                        key={currentQuestion.code}
                        className="bg-blue-800/30 backdrop-blur-sm border border-blue-600/20 rounded-2xl p-6 shadow-xl transform transition-all duration-300 animate-fade-in-up"
                    >
                        <label className="block text-white text-lg font-semibold mb-4">
                            {currentQuestion.text}
                        </label>
                        
                        {currentQuestion.type === 'rating' ? (
                            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                                {[1, 2, 3, 4, 5].map((rating) => {
                                    const isSelected = responses[currentQuestion.code] === rating;
                                    return (
                                        <label 
                                            key={rating} 
                                            className="flex items-center cursor-pointer group transform transition-all duration-200 hover:scale-105"
                                        >
                                            <input
                                                type="radio"
                                                name={currentQuestion.code}
                                                value={rating}
                                                onChange={() => handleInputChange(currentQuestion.code, rating)}
                                                required
                                                className="sr-only"
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
                                onChange={(e) => handleInputChange(currentQuestion.code, e.target.value)}
                                value={responses[currentQuestion.code] || ''}
                                
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

                    {currentQuestionIndex < peerEvaluationQuestions.length - 1 ? (
                        <button 
                            type="button"
                            onClick={goToNextQuestion}
                            disabled={!isQuestionAnswered(currentQuestion.code)}
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
                            disabled={submitting || !isQuestionAnswered(currentQuestion.code)}
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

        {/* Question Indicators */}
        <div className="flex justify-center mt-6 space-x-2 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                {peerEvaluationQuestions.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                        w-3 h-3 rounded-full transition-all duration-300
                        ${index === currentQuestionIndex 
                            ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-125'
                            : 'bg-blue-600/50 hover:bg-blue-500/70'
                      }
                `}
                      >
            </button>
        ))}
       </div>
      </div>
    </div>
   </div>        
 );
};

export default PeerReviewForm;