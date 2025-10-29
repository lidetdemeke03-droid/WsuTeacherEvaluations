
import React, { useState, useEffect, useRef } from 'react';
import { apiGetUsers, apiCreateUser, apiBulkImportUsers, apiUpdateUser, apiDeleteUser } from '../../services/api';
import { User, UserRole } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Upload, MoreVertical, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManageUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const fetchedUsers = await apiGetUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (userData: Partial<User>) => {
        try {
            const newUser = await apiCreateUser(userData);
            setUsers([...users, newUser]);
            setIsCreateModalOpen(false);
            toast.success('User created successfully!');
        } catch (err) {
            toast.error('Failed to create user.');
        }
    };

    const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
        try {
            const updatedUser = await apiUpdateUser(userId, userData);
            setUsers(users.map(u => u._id === userId ? updatedUser : u));
            setIsEditModalOpen(false);
            toast.success('User updated successfully!');
        } catch (err) {
            toast.error('Failed to update user.');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await apiDeleteUser(userId);
                setUsers(users.filter(u => u._id !== userId));
                toast.success('User deleted successfully!');
            } catch (err) {
                toast.error('Failed to delete user.');
            }
        }
    };

    const handleBulkImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const toastId = toast.loading('Importing users...');
            try {
                await apiBulkImportUsers(file);
                toast.success('Users imported successfully!', { id: toastId });
                fetchUsers();
            } catch (err) {
                toast.error('Bulk import failed.', { id: toastId });
            }
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    if (loading && !users.length) return <div>Loading users...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manage Users</h1>
                <div className="flex space-x-2">
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary"><PlusCircle size={20} className="mr-2" />New User</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                    <button onClick={handleBulkImportClick} className="btn-secondary"><Upload size={20} className="mr-2" />Bulk Import</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th">Name</th>
                            <th className="th">Email</th>
                            <th className="th">Role</th>
                            <th className="th">Department</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <td className="td">{user.name}</td>
                                <td className="td">{user.email}</td>
                                <td className="td"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></td>
                                <td className="td">{user.department?.name || 'N/A'}</td>
                                <td className="td text-right">
                                    <button onClick={() => openEditModal(user)} className="text-blue-500 hover:text-blue-700 mr-2"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteUser(user._id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateUser} />
            {selectedUser && <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} onUpdate={handleUpdateUser} />}
        </motion.div>
    );
};

// Modal Components...
interface CreateUserModalProps { isOpen: boolean; onClose: () => void; onCreate: (userData: Partial<User>) => void; }
const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Student);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ name, email, password, role });
    };

    return (<AnimatePresence>{isOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop"><motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="modal-content"><div className="modal-header"><h2 className="text-2xl font-bold">Create New User</h2><button onClick={onClose}><X size={24} /></button></div><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="input" required /><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" required /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input" required /><select value={role} onChange={e => setRole(e.target.value as UserRole)} className="input">{Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}</select><div className="modal-footer"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div></form></motion.div></motion.div>)}</AnimatePresence>);
};

interface EditUserModalProps { isOpen: boolean; onClose: () => void; user: User; onUpdate: (userId: string, userData: Partial<User>) => void; }
const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState<UserRole>(user.role);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(user._id, { name, email, role });
    };

    return (<AnimatePresence>{isOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop"><motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="modal-content"><div className="modal-header"><h2 className="text-2xl font-bold">Edit User</h2><button onClick={onClose}><X size={24} /></button></div><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="input" required /><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" required /><select value={role} onChange={e => setRole(e.target.value as UserRole)} className="input">{Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}</select><div className="modal-footer"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Update</button></div></form></motion.div></motion.div>)}</AnimatePresence>);
};


export default ManageUsersPage;
