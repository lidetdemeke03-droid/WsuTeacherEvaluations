
import React, { useState, useEffect } from 'react';
import { Criterion } from '../../types';
import { apiGetCriteria, apiCreateCriterion, apiUpdateCriterion, apiDeleteCriterion } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ManageCriteriaPage: React.FC = () => {
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCriterion, setCurrentCriterion] = useState<Criterion | null>(null);
    const [formData, setFormData] = useState({
        text: '',
        maxScore: 5,
    });

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const data = await apiGetCriteria();
            setCriteria(data);
        } catch (error) {
            toast.error('Failed to fetch criteria');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentCriterion) {
                await apiUpdateCriterion(currentCriterion.id, formData);
                toast.success('Criterion updated successfully');
            } else {
                await apiCreateCriterion(formData);
                toast.success('Criterion created successfully');
            }
            fetchCriteria();
            closeModal();
        } catch (error) {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} criterion`);
        }
    };

    const handleDelete = async (criterionId: string) => {
        if (window.confirm('Are you sure you want to delete this criterion?')) {
            try {
                await apiDeleteCriterion(criterionId);
                toast.success('Criterion deleted successfully');
                fetchCriteria();
            } catch (error) {
                toast.error('Failed to delete criterion');
            }
        }
    };

    const openModal = (criterion: Criterion | null = null) => {
        if (criterion) {
            setIsEditing(true);
            setCurrentCriterion(criterion);
            setFormData({ text: criterion.text, maxScore: criterion.maxScore });
        } else {
            setIsEditing(false);
            setCurrentCriterion(null);
            setFormData({ text: '', maxScore: 5 });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Manage Evaluation Criteria</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
                >
                    <Plus size={20} className="mr-2" />
                    Add Criterion
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit' : 'Add'} Criterion</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Criterion Text</label>
                                <input
                                    type="text"
                                    name="text"
                                    value={formData.text}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Max Score</label>
                                <input
                                    type="number"
                                    name="maxScore"
                                    value={formData.maxScore}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                                >
                                    {isEditing ? 'Update' : 'Create'}
                                </button>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Text</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Score</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {criteria.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{c.text}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{c.maxScore}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button onClick={() => openModal(c)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={20} /></button>
                                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900"><Trash2 size={20} /></button>
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

export default ManageCriteriaPage;
