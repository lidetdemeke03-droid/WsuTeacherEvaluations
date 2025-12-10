
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { apiGetAdmins, apiCreateAdmin, apiUpdateAdmin, apiDeleteAdmin } from '../../services/api';
import toast from 'react-hot-toast';
import PasswordResetButton from '../../components/PasswordResetButton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const ManageAdminsPage: React.FC = () => {
    const [admins, setAdmins] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });

    const { user: currentUser } = useAuth();

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
            if (isEditing && currentAdmin) {
                await apiUpdateAdmin(currentAdmin.id, formData);
                toast.success('Admin updated successfully');
            } else {
                await apiCreateAdmin(formData);
                toast.success('Admin created successfully');
            }
            fetchAdmins();
            closeModal();
        } catch (error) {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} admin`);
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

    const openModal = (admin: User | null = null) => {
        if (admin) {
            setIsEditing(true);
            setCurrentAdmin(admin);
            setFormData({
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                password: '',
            });
        } else {
            setIsEditing(false);
            setCurrentAdmin(null);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">SA</div>
                    <div>
                        <h1 className="text-2xl font-bold">SuperAdmin Console</h1>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Welcome back{currentUser ? `, ${currentUser.firstName} ${currentUser.lastName}` : ''}</div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600 text-right">
                        <div className="font-medium">Role: SuperAdmin</div>
                        <div className="text-xs text-gray-500">{currentUser?.email}</div>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                        <Plus size={18} />
                        Add Admin
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                    Use this panel to manage administrator accounts. You can add, update, or remove administrators and review recent audit events in the Audit Logs section.
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
                    <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">{isEditing ? 'Edit' : 'Add'} Admin</h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">Close</button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={isEditing ? 'Leave blank to keep current password' : ''} />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">{isEditing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-8">Loading admins...</div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="th">Name</th>
                                <th className="th">Email</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {admins.map((admin) => (
                                <tr key={admin.id}>
                                    <td className="td">{`${admin.firstName} ${admin.lastName}`}</td>
                                    <td className="td">{admin.email}</td>
                                    <td className="td text-right flex justify-end items-center space-x-3">
                                        <PasswordResetButton email={admin.email} />
                                        <button onClick={() => openModal(admin)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(admin.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
};

export default ManageAdminsPage;
