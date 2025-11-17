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
                    <div className="bg-blue-800/50 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 shadow-2xl transform transition-all duration-300 hover:scale-105">
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

                {/* Evaluation Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {peerEvaluationQuestions.map((q, index) => (
                        <div 
                            key={q.code} 
                            className="bg-blue-800/30 backdrop-blur-sm border border-blue-600/20 rounded-2xl p-6 shadow-xl transform transition-all duration-300 hover:scale-102 animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <label className="block text-white text-lg font-semibold mb-4">
                                {q.text}
                            </label>
                            {q.type === 'rating' ? (
                                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <label 
                                        key={rating} 
                                        className="flex items-center space-x-2 cursor-pointer group transform transition-all duration-200 hover:scale-110"
                                    >
                                        <input
                                            type="radio"
                                            name={q.code}
                                            value={rating}
                                            onChange={() => handleInputChange(q.code, rating)}
                                            required
                                            className="sr-only" // Hide default radio, we'll style the custom one
                                        />
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-700/50 border-2 border-blue-500/30 rounded-xl flex items-center justify-center text-white font-semibold transition-all duration-200 group-hover:bg-blue-600/70 group-hover:border-blue-400 peer-checked:bg-gradient-to-br peer-checked:from-blue-500 peer-checked:to-purple-500 peer-checked:border-transparent shadow-lg">
                                            {rating}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                className="w-full p-4 bg-blue-900/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none"
                                rows={4}
                                placeholder="Enter your feedback here..."
                                onChange={(e) => handleInputChange(q.code, e.target.value)}
                                required
                            />
                        )}
                    </div>
                ))}

                {/* Submit Button */}
                <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                        <span className="relative z-10">
                            {submitting ? (
                                <span className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Submitting...</span>
                                </span>
                            ) : (
                                'Submit Evaluation'
                            )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 </button>
                </div>
              </form>
           </div>
        </div>
    </div>
    );
};

export default PeerReviewForm;