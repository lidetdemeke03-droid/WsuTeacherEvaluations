
import React, { useState, useEffect } from 'react';
import { EvaluationPeriod } from '../../types';
import { apiGetEvaluationPeriods, apiCreateEvaluationPeriod, apiUpdateEvaluationPeriod, apiDeleteEvaluationPeriod } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

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
        status: 'Inactive'
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                await apiUpdateEvaluationPeriod(currentPeriod.id, periodData);
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
                status: period.status,
            });
        } else {
            setIsEditing(false);
            setCurrentPeriod(null);
            setFormData({
                name: '',
                startDate: '',
                endDate: '',
                status: 'Inactive',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Manage Evaluation Periods</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
                >
                    <Plus size={20} className="mr-2" />
                    Add Period
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit' : 'Add'} Evaluation Period</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Period Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2">Cancel</button>
                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">{isEditing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white shadow-md rounded-lg">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {periods.map((period) => (
                                <tr key={period.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{period.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(period.startDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(period.endDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${period.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {period.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button onClick={() => openModal(period)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={20} /></button>
                                        <button onClick={() => handleDelete(period.id)} className="text-red-600 hover:text-red-900"><Trash2 size={20} /></button>
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
