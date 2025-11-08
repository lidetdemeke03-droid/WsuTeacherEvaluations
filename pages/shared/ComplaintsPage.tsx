
import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus, UserRole } from '../../types';
import { apiGetComplaints, apiUpdateComplaint, apiCreateComplaint, apiRespondComplaint } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

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
        responseText: '',
    });

    useEffect(() => {
        // Admins/DeptHead fetch all complaints; students and teachers fetch their own
        if (user) {
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
                if (user?.role === UserRole.Student || user?.role === UserRole.Teacher) {
                await apiCreateComplaint({ subject: formData.subject, message: formData.message });
                toast.success('Complaint submitted successfully');
            } else if (currentComplaint) {
                // Admin responding/updating
                if ((user?.role === UserRole.Admin || user?.role === UserRole.DepartmentHead) && formData.responseText) {
                    await apiRespondComplaint(currentComplaint._id || currentComplaint.id, { responseText: formData.responseText, status: formData.status });
                    toast.success('Response saved successfully');
                } else {
                    await apiUpdateComplaint(currentComplaint._id || currentComplaint.id, { status: formData.status as ComplaintStatus });
                    toast.success('Complaint updated successfully');
                }
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
                responseText: (complaint as any).response || '',
            });
        } else {
            setFormData({
                subject: '',
                message: '',
                status: ComplaintStatus.New,
                responseText: '',
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
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-md w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">{currentComplaint ? 'Update Complaint' : 'Submit Complaint'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {(user.role === UserRole.Student || user.role === UserRole.Teacher) ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                                        <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Message</label>
                                        <textarea name="message" value={formData.message} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                        {Object.values(ComplaintStatus).map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{currentComplaint ? 'Update' : 'Submit'}</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {(user.role === UserRole.Admin || user.role === UserRole.DepartmentHead || user.role === UserRole.Teacher || user.role === UserRole.Student) && (
                isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg">
                        <div className="divide-y">
                            {complaints.map((c: any) => (
                                <motion.div key={c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{c.subject}</div>
                                            <div className="text-sm text-gray-500">{c.submitter ? `${c.submitter.firstName} ${c.submitter.lastName}` : 'System'} • {new Date(c.createdAt).toLocaleString()}</div>
                                        </div>
                                        <div className="text-sm text-gray-700">{c.status}</div>
                                    </div>
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-3 text-sm text-gray-700">
                                        <div>{c.message}</div>
                                        {c.response && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-gray-50 rounded">
                                                <div className="text-sm font-medium">Response</div>
                                                <div className="text-sm">{c.response}</div>
                                            </motion.div>
                                        )}
                                        <div className="mt-3 text-right">
                                            <button onClick={() => openModal(c)} className="text-indigo-600 hover:text-indigo-900">View/Respond</button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default ComplaintsPage;
