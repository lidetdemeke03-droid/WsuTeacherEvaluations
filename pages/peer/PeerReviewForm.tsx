import React, { useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { peerEvaluationQuestions as questions } from '../../constants/forms';

const PeerReviewForm: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const { user } = useAuth();
    const history = useHistory();
    const [answers, setAnswers] = useState<any[]>([]);
    const [conflict, setConflict] = useState<boolean>(false);
    const [reason, setReason] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            evaluatorId: user?.id,
            // These would come from the assignment data, fetched separately
            teacherId: 'TARGET_TEACHER_ID', 
            courseId: 'COURSE_ID', 
            formId: 'FORM_ID',
            answers: conflict ? [{ conflict: true, reason }] : answers,
        };

        api.post('/peers/evaluations', payload)
            .then(() => {
                history.push('/peer/reviews');
            })
            .catch(err => {
                console.error('Error submitting evaluation:', err);
            });
    };

    const handleAnswerChange = (questionCode: string, value: string | number, type: string) => {
        const newAnswers = [...answers];
        const existingAnswerIndex = newAnswers.findIndex(a => a.questionCode === questionCode);

        if (existingAnswerIndex > -1) {
            newAnswers[existingAnswerIndex] = { ...newAnswers[existingAnswerIndex], [type === 'text' ? 'response' : 'score']: value };
        } else {
            newAnswers.push({ questionCode, [type === 'text' ? 'response' : 'score']: value });
        }
        setAnswers(newAnswers);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Peer Evaluation Form</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center">
                    <input type="checkbox" id="conflict" checked={conflict} onChange={e => setConflict(e.target.checked)} />
                    <label htmlFor="conflict" className="ml-2">Declare Conflict of Interest</label>
                </div>

                {conflict ? (
                    <div>
                        <label htmlFor="reason">Reason for conflict:</label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded" required />
                    </div>
                ) : (
                    <div>
                        {questions.map(q => (
                            <div key={q.code} className="mb-4">
                                <label className="block mb-1">{q.text}</label>
                                {q.type === 'rating' ? (
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        className="p-2 border rounded w-full"
                                        placeholder="Score (1-5)"
                                        onChange={e => handleAnswerChange(q.code, parseInt(e.target.value), 'rating')}
                                    />
                                ) : (
                                    <textarea
                                        className="p-2 border rounded w-full mt-2"
                                        placeholder="Comments"
                                        onChange={e => handleAnswerChange(q.code, e.target.value, 'text')}
                                    ></textarea>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Submit Evaluation</button>
            </form>
        </div>
    );
};

export default PeerReviewForm;
