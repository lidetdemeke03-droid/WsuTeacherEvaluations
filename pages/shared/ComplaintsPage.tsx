import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus, UserRole } from '../../types';
import { apiGetComplaints, apiUpdateComplaint, apiCreateComplaint, apiRespondComplaint } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

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
                fetchComplaints();
            } else if (currentComplaint) {
                if ((user?.role === UserRole.Admin || user?.role === UserRole.DepartmentHead) && formData.responseText.trim()) {
                    await apiRespondComplaint(currentComplaint._id || (currentComplaint as any).id, { responseText: formData.responseText.trim(), status: formData.status });
                    toast.success('Response saved successfully');
                } else {
                    await apiUpdateComplaint(currentComplaint._id || (currentComplaint as any).id, { status: formData.status as ComplaintStatus });
                    toast.success('Complaint updated successfully');
                }
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case ComplaintStatus.New:
                return <AlertCircle className="w-4 h-4" />;
            case ComplaintStatus.InProgress:
                return <Clock className="w-4 h-4" />;
            case ComplaintStatus.Resolved:
                return <CheckCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case ComplaintStatus.New:
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case ComplaintStatus.InProgress:
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case ComplaintStatus.Resolved:
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-3 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3"
                    >
                        <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                        Complaints
                    </motion.h1>
                    {(user.role === UserRole.Teacher) && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openModal()}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 font-medium"
                        >
                            <Send className="w-5 h-5" />
                            Submit Complaint
                        </motion.button>
                    )}
                </div>

                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={closeModal}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-blue-500/20 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        {currentComplaint ? 'View Complaint' : 'Submit New Complaint'}
                                    </h2>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-white transition"
                                    >
                                        <X className="w-6 h-6" />
                                    </motion.button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-blue-200 mb-2">Subject</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-blue-500/30 bg-slate-800/50 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-500"
                                            disabled={!!currentComplaint && !(user.role === UserRole.Student || user.role === UserRole.Teacher)}
                                            placeholder="Brief description of the issue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-200 mb-2">Message</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-blue-500/30 bg-slate-800/50 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-500 resize-none"
                                            rows={4}
                                            disabled={!!currentComplaint && !(user.role === UserRole.Student || user.role === UserRole.Teacher)}
                                            placeholder="Detailed description of your complaint"
                                        />
                                    </div>

                                    {(user.role === UserRole.Admin || user.role === UserRole.DepartmentHead) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-5 border-t border-blue-500/20 pt-5"
                                        >
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">Status</label>
                                                <select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-xl border border-blue-500/30 bg-slate-800/50 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                >
                                                    {Object.values(ComplaintStatus).map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">Response</label>
                                                <textarea
                                                    name="responseText"
                                                    value={formData.responseText}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-xl border border-blue-500/30 bg-slate-800/50 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-500 resize-none"
                                                    rows={4}
                                                    placeholder="Write your response to the complainant"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={closeModal}
                                            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-blue-500/30 text-blue-200 hover:bg-blue-500/10 transition font-medium"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-500/30 font-medium flex items-center justify-center gap-2"
                                            disabled={isSubmitting}
                                        >
                                            <Send className="w-4 h-4" />
                                            {isSubmitting ? (currentComplaint ? 'Saving...' : 'Submitting...') : (currentComplaint ? 'Save Changes' : 'Submit')}
                                        </motion.button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {(user.role === UserRole.Admin || user.role === UserRole.Teacher || user.role === UserRole.DepartmentHead) && (
                    isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-blue-500/20"
                                >
                                    <div className="space-y-3">
                                        <div className="h-6 bg-blue-500/20 rounded-lg w-3/4 animate-pulse" />
                                        <div className="h-4 bg-blue-500/10 rounded w-1/2 animate-pulse" />
                                        <div className="h-20 bg-blue-500/10 rounded-lg animate-pulse" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {complaints.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-12 text-center border border-blue-500/20"
                                >
                                    <MessageSquare className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
                                    <p className="text-gray-400 text-lg">No complaints yet.</p>
                                </motion.div>
                            ) : (
                                complaints.map((c: any, index) => (
                                    <motion.div
                                        key={c._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-4 sm:p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-lg hover:shadow-blue-500/10"
                                    >
                                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <h3 className="font-semibold text-lg sm:text-xl text-white flex-1 break-words">{c.subject}</h3>
                                                    <div className="lg:hidden flex-shrink-0">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(c.status)}`}>
                                                            {getStatusIcon(c.status)}
                                                            <span className="hidden sm:inline">{c.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-200/70 mb-4">
                                                    <span className="font-medium">{c.submitter ? `${c.submitter.firstName} ${c.submitter.lastName}` : 'System'}</span>
                                                    <span className="text-blue-400">•</span>
                                                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                                    <span className="hidden sm:inline text-blue-400">•</span>
                                                    <span className="hidden sm:inline">{new Date(c.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-sm sm:text-base text-gray-300 leading-relaxed break-words">{c.message}</p>
                                                {c.response && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20"
                                                    >
                                                        <div className="text-xs sm:text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                                                            <Send className="w-4 h-4" />
                                                            Admin Response
                                                        </div>
                                                        <p className="text-sm text-gray-300 leading-relaxed break-words">{c.response}</p>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 lg:gap-4 flex-shrink-0 lg:ml-4">
                                                <div className={`hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(c.status)}`}>
                                                    {getStatusIcon(c.status)}
                                                    {c.status}
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => openModal(c)}
                                                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition border border-blue-500/30 font-medium text-sm"
                                                >
                                                    View Details
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )
                )}
            </motion.div>
        </div>
    );
};

export default ComplaintsPage;