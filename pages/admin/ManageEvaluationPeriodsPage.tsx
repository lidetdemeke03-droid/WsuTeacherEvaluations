import React, { useState, useEffect } from 'react';
import { EvaluationPeriod } from '../../types';
import { apiGetEvaluationPeriods, apiCreateEvaluationPeriod, apiUpdateEvaluationPeriod, apiDeleteEvaluationPeriod } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageEvaluationPeriodsPage: React.FC = () => {
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState<EvaluationPeriod | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        status: 'active'
    });

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            const data = await apiGetEvaluationPeriods();
            setPeriods(data);
        } catch (error) {
            toast.error('Failed to fetch evaluation periods');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'status' ? value.toLowerCase() : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const periodData = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            };

            if (isEditing && currentPeriod) {
                await apiUpdateEvaluationPeriod(currentPeriod._id, periodData);
                toast.success('Evaluation period updated successfully');
            } else {
                await apiCreateEvaluationPeriod(periodData);
                toast.success('Evaluation period created successfully');
            }
            fetchPeriods();
            closeModal();
        } catch (error) {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} evaluation period`);
        }
    };

    const handleDelete = async (periodId: string) => {
        if (window.confirm('Are you sure you want to delete this evaluation period?')) {
            try {
                await apiDeleteEvaluationPeriod(periodId);
                toast.success('Evaluation period deleted successfully');
                fetchPeriods();
            } catch (error) {
                toast.error('Failed to delete evaluation period');
            }
        }
    };

    const openModal = (period: EvaluationPeriod | null = null) => {
        if (period) {
            setIsEditing(true);
            setCurrentPeriod(period);
            setFormData({
                name: period.name,
                startDate: new Date(period.startDate).toISOString().split('T')[0],
                endDate: new Date(period.endDate).toISOString().split('T')[0],
                status: (period.status || '').toString().toLowerCase(),
            });
        } else {
            setIsEditing(false);
            setCurrentPeriod(null);
            setFormData({ name: '', startDate: '', endDate: '', status: 'active' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
                <h1 className="text-2xl font-bold text-gray-800">Manage Evaluation Periods</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 transition"
                >
                    <Plus size={20} className="mr-2" />
                    Add Period
                </button>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-11/12 sm:w-2/3 md:w-1/3 p-6 rounded-2xl shadow-xl"
                        >
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
                                {isEditing ? 'Edit' : 'Add'} Evaluation Period
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Period Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-3">
                                    <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                        {isEditing ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <p className="text-center text-gray-500">Loading...</p>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-2xl">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Name</th>
                                <th className="px-4 py-3 text-left font-semibold">Start Date</th>
                                <th className="px-4 py-3 text-left font-semibold">End Date</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 bg-gray-800 text-gray-100">
                            {periods.map((period) => (
                                <tr key={period._id} className="hover:bg-blue-900 transition">
                                    <td className="px-4 py-3">{period.name}</td>
                                    <td className="px-4 py-3">{new Date(period.startDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{new Date(period.endDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${String(period.status).toLowerCase() === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {period.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-3">
                                        <button onClick={() => openModal(period)} className="text-blue-400 hover:text-blue-200"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(period._id)} className="text-red-400 hover:text-red-200"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageEvaluationPeriodsPage;
