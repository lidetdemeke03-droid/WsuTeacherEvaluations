import React, { useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DepartmentEvaluationForm: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const { user } = useAuth();
    const history = useHistory();
    const [answers, setAnswers] = useState<any[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            evaluatorId: user?.id,
            teacherId,
            period: '2025-Spring', // This should be dynamic
            answers,
        };

        api.post('/evaluations/department', payload)
            .then(() => {
                history.push('/dashboard');
            })
            .catch(err => {
                console.error('Error submitting evaluation:', err);
            });
    };

    // Questions from seed.ts
    const questions = [
        { code: 'D1', text: 'Overall teaching effectiveness (clarity, preparation)' },
        { code: 'D2', text: 'Contribution to curriculum and course planning' },
        { code: 'D3', text: 'Mentoring and student advising effectiveness' },
        { code: 'D4', text: 'Participation in departmental responsibilities' },
        { code: 'D5', text: 'Professional behavior & ethics' },
        { code: 'D6', text: 'Time management & consultation availability' },
        { code: 'DC1', text: 'Overall comments', type: 'text' },
    ];

    const handleAnswerChange = (questionCode: string, value: string | number, type: string = 'rating') => {
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
            <h1 className="text-2xl font-bold mb-4">Department Head Evaluation</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {questions.map(q => (
                    <div key={q.code} className="mb-4">
                        <label className="block mb-1">{q.text}</label>
                        {q.type === 'text' ? (
                            <textarea 
                                className="p-2 border rounded w-full mt-2" 
                                placeholder="Comments"
                                onChange={e => handleAnswerChange(q.code, e.target.value, 'text')}
                            ></textarea>
                        ) : (
                            <input 
                                type="number" 
                                min="1" max="5" 
                                className="p-2 border rounded w-full" 
                                placeholder="Score (1-5)"
                                onChange={e => handleAnswerChange(q.code, parseInt(e.target.value))}
                            />
                        )}
                    </div>
                ))}
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Submit Evaluation</button>
            </form>
        </div>
    );
};

export default DepartmentEvaluationForm;
