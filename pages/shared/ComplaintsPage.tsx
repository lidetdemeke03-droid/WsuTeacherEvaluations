
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
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        if (!formData.subject.trim() || !formData.message.trim()) {
            toast.error('Please provide a subject and message');
            return;
        }
        setIsSubmitting(true);
        try {
            if (user?.role === UserRole.Student || user?.role === UserRole.Teacher) {
                await apiCreateComplaint({ subject: formData.subject.trim(), message: formData.message.trim() });
                toast.success('Complaint submitted successfully');
                // after submit, refresh list (user will see own complaints)
                fetchComplaints();
            } else if (currentComplaint) {
                // Admin responding/updating
                if ((user?.role === UserRole.Admin || user?.role === UserRole.DepartmentHead) && formData.responseText.trim()) {
                    await apiRespondComplaint(currentComplaint._id || (currentComplaint as any).id, { responseText: formData.responseText.trim(), status: formData.status });
                    toast.success('Response saved successfully');
                } else {
                    await apiUpdateComplaint(currentComplaint._id || (currentComplaint as any).id, { status: formData.status as ComplaintStatus });
                    toast.success('Complaint updated successfully');
                }
                // refresh for admin view
                fetchComplaints();
            }
            closeModal();
        } catch (error) {
            toast.error(`Failed to ${currentComplaint ? 'update' : 'submit'} complaint`);
        } finally {
            setIsSubmitting(false);
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
                {(user.role === UserRole.Student || user.role === UserRole.Teacher) && (
                    <button onClick={() => openModal()} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
                        Submit Complaint
                    </button>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-md w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">{currentComplaint ? 'Complaint' : 'Submit Complaint'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" disabled={!!currentComplaint && !(user.role === UserRole.Student || user.role === UserRole.Teacher)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Message</label>
                                <textarea name="message" value={formData.message} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={4} disabled={!!currentComplaint && !(user.role === UserRole.Student || user.role === UserRole.Teacher)} />
                            </div>

                            {(user.role === UserRole.Admin || user.role === UserRole.DepartmentHead) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                            {Object.values(ComplaintStatus).map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Response</label>
                                        <textarea name="responseText" value={formData.responseText} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={4} placeholder="Write a response to the complainant" />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded border">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting ? (currentComplaint ? 'Saving...' : 'Submitting...') : (currentComplaint ? 'Save' : 'Submit')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {(user.role === UserRole.Admin || user.role === UserRole.DepartmentHead || user.role === UserRole.Teacher || user.role === UserRole.Student) && (
                isLoading ? (
                    <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                ) : (
                    <div className="bg-white shadow-md rounded-lg">
                        <div className="divide-y">
                            {complaints.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">No complaints yet.</div>
                            ) : (
                                complaints.map((c: any) => (
                                    <motion.div key={c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium text-lg">{c.subject}</div>
                                                <div className="text-sm text-gray-500">{c.submitter ? `${c.submitter.firstName} ${c.submitter.lastName}` : 'System'} • {new Date(c.createdAt).toLocaleString()}</div>
                                                <div className="mt-3 text-sm text-gray-700">{c.message}</div>
                                                {c.response && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-gray-50 rounded">
                                                        <div className="text-sm font-medium">Response</div>
                                                        <div className="text-sm">{c.response}</div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="ml-4 flex-shrink-0 text-right">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${c.status === ComplaintStatus.New ? 'bg-yellow-100 text-yellow-800' : c.status === ComplaintStatus.InProgress ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{c.status}</div>
                                                <div className="mt-4">
                                                    <button onClick={() => openModal(c)} className="text-indigo-600 hover:text-indigo-900">View/Respond</button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default ComplaintsPage;
