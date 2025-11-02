
import React, { useState, useEffect } from 'react';
import { Department } from '../../types';
import { apiGetDepartments, apiCreateDepartment, apiUpdateDepartment, apiDeleteDepartment } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ManageDepartmentsPage: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const data = await apiGetDepartments();
            setDepartments(data);
        } catch (error) {
            toast.error('Failed to fetch departments');
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
            if (isEditing && currentDepartment) {
                await apiUpdateDepartment(currentDepartment.id, formData.name);
                toast.success('Department updated successfully');
            } else {
                await apiCreateDepartment(formData.name);
                toast.success('Department created successfully');
            }
            fetchDepartments();
            closeModal();
        } catch (error) {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} department`);
        }
    };

    const handleDelete = async (deptId: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await apiDeleteDepartment(deptId);
                toast.success('Department deleted successfully');
                fetchDepartments();
            } catch (error) {
                toast.error('Failed to delete department');
            }
        }
    };

    const openModal = (department: Department | null = null) => {
        if (department) {
            setIsEditing(true);
            setCurrentDepartment(department);
            setFormData({ name: department.name });
        } else {
            setIsEditing(false);
            setCurrentDepartment(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Manage Departments</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
                >
                    <Plus size={20} className="mr-2" />
                    Add Department
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit' : 'Add'} Department</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Name</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {departments.map((dept) => (
                                <tr key={dept.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{dept.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button onClick={() => openModal(dept)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <Edit size={20} />
                                        </button>
                                        <button onClick={() => handleDelete(dept.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 size={20} />
                                        </button>
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

export default ManageDepartmentsPage;
