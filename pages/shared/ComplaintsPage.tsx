
import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus, UserRole } from '../../types';
import { apiGetComplaints, apiUpdateComplaint, apiCreateComplaint } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ComplaintsPage: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentComplaint, setCurrentComplaint] = useState<Complaint | null>(null);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        status: ComplaintStatus.New,
    });

    useEffect(() => {
        if (user?.role === UserRole.Admin || user?.role === UserRole.DepartmentHead) {
            fetchComplaints();
        }
    }, [user]);

    const fetchComplaints = async () => {
        try {
            const data = await apiGetComplaints();
            setComplaints(data);
        } catch (error) {
            toast.error('Failed to fetch complaints');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (user?.role === UserRole.Student) {
                await apiCreateComplaint({ subject: formData.subject, message: formData.message });
                toast.success('Complaint submitted successfully');
            } else if (currentComplaint) {
                await apiUpdateComplaint(currentComplaint.id, { status: formData.status as ComplaintStatus });
                toast.success('Complaint updated successfully');
            }
            closeModal();
            if (user?.role !== UserRole.Student) {
                fetchComplaints();
            }
        } catch (error) {
            toast.error(`Failed to ${currentComplaint ? 'update' : 'submit'} complaint`);
        }
    };

    const openModal = (complaint: Complaint | null = null) => {
        setCurrentComplaint(complaint);
        if (complaint) {
            setFormData({
                subject: complaint.subject,
                message: complaint.message,
                status: complaint.status,
            });
        } else {
            setFormData({
                subject: '',
                message: '',
                status: ComplaintStatus.New,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (!user) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Complaints</h1>
                {user.role === UserRole.Student && (
                    <button onClick={() => openModal()} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                        Submit Complaint
                    </button>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md">
                        <h2 className="text-xl font-bold mb-4">{currentComplaint ? 'Update Complaint' : 'Submit Complaint'}</h2>
                        <form onSubmit={handleSubmit}>
                            {user.role === UserRole.Student ? (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                                        <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Message</label>
                                        <textarea name="message" value={formData.message} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                        {Object.values(ComplaintStatus).map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2">Cancel</button>
                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">{currentComplaint ? 'Update' : 'Submit'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(user.role === UserRole.Admin || user.role === UserRole.DepartmentHead) && (
                isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitter</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {complaints.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{c.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{c.submitterName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(c.submissionDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{c.status}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button onClick={() => openModal(c)} className="text-indigo-600 hover:text-indigo-900">View/Update</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

export default ComplaintsPage;
