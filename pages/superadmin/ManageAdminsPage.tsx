
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { apiGetAdmins, apiCreateAdmin, apiUpdateAdmin, apiDeleteAdmin } from '../../services/api';
import toast from 'react-hot-toast';

const ManageAdminsPage: React.FC = () => {
    const [admins, setAdmins] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const data = await apiGetAdmins();
            setAdmins(data);
        } catch (error) {
            toast.error('Failed to fetch admins');
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
            await apiCreateAdmin(formData);
            toast.success('Admin created successfully');
            fetchAdmins();
            setIsModalOpen(false);
        } catch (error) {
            toast.error('Failed to create admin');
        }
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                await apiDeleteAdmin(userId);
                toast.success('Admin deleted successfully');
                fetchAdmins();
            } catch (error) {
                toast.error('Failed to delete admin');
            }
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Manage Admins</h1>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
            >
                Add Admin
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-md">
                        <h2 className="text-xl font-bold mb-4">Add New Admin</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2">First Name</th>
                            <th className="py-2">Last Name</th>
                            <th className="py-2">Email</th>
                            <th className="py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map((admin) => (
                            <tr key={admin.id}>
                                <td className="border px-4 py-2">{admin.firstName}</td>
                                <td className="border px-4 py-2">{admin.lastName}</td>
                                <td className="border px-4 py-2">{admin.email}</td>
                                <td className="border px-4 py-2">
                                    <button
                                        onClick={() => handleDelete(admin.id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded-md"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ManageAdminsPage;
