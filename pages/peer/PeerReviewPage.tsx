import React, { useState, useEffect } from 'react';
import { api } from '../../services/api'; // Assuming api service is set up
import { IPeerAssignment } from '../../backend/src/types'; // Assuming path is correct
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PeerReviewPage: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<IPeerAssignment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (user) {
            api.get(`/peers/${user.id}/assignments`)
                .then(res => {
                    setAssignments(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching peer assignments:', err);
                    setLoading(false);
                });
        }
    }, [user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Peer Evaluation Assignments</h1>
            {assignments.length === 0 ? (
                <p>You have no pending peer evaluations.</p>
            ) : (
                <ul className="space-y-4">
                    {assignments.map(assignment => (
                        <li key={assignment._id} className="p-4 border rounded-lg shadow-sm">
                            <p><b>Teacher to Evaluate:</b> {assignment.targetTeacher.firstName} {assignment.targetTeacher.lastName}</p>
                            <p><b>Course:</b> {assignment.course.title}</p>
                            <p><b>Evaluation Window:</b> {new Date(assignment.window.start).toLocaleDateString()} - {new Date(assignment.window.end).toLocaleDateString()}</p>
                            <Link to={`/peer/evaluate/${assignment._id}`} className="text-blue-500 hover:underline">Start Evaluation</Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PeerReviewPage;
