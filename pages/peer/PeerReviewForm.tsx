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
        return <div>Loading...</div>;
    }

    if (!assignment) {
        return <div>Assignment not found.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Peer Evaluation</h1>
            <div className="mb-4 p-4 border rounded-lg">
                <p><b>Teacher to Evaluate:</b> {assignment.targetTeacher.firstName} {assignment.targetTeacher.lastName}</p>
                <p><b>Course:</b> {assignment.course.title}</p>
            </div>
            <form onSubmit={handleSubmit}>
                {peerEvaluationQuestions.map(q => (
                    <div key={q.code} className="mb-4">
                        <label className="block text-lg mb-2">{q.text}</label>
                        {q.type === 'rating' ? (
                            <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <label key={rating} className="flex items-center space-x-1">
                                        <input
                                            type="radio"
                                            name={q.code}
                                            value={rating}
                                            onChange={() => handleInputChange(q.code, rating)}
                                            required
                                        />
                                        <span>{rating}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                className="w-full p-2 border rounded"
                                rows={3}
                                onChange={(e) => handleInputChange(q.code, e.target.value)}
                                required
                            />
                        )}
                    </div>
                ))}
                <button type="submit" disabled={submitting} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
                    {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
            </form>
        </div>
    );
};

export default PeerReviewForm;