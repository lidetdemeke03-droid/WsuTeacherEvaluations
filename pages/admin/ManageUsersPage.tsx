import React, { useState, useEffect, useRef } from 'react';
import { apiGetUsers, apiCreateUser, apiBulkImportUsers, apiUpdateUser, apiDeleteUser, apiGetDepartments } from '../../services/api';
import { User, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Upload, X, Edit, Trash2, Search } from 'lucide-react';
import PasswordResetButton from '../../components/PasswordResetButton';
import { toast } from 'react-hot-toast';

const ManageUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { user: currentUser } = useAuth();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const fetchedUsers = await apiGetUsers();
            let filtered = fetchedUsers;
            if (currentUser && currentUser.role === UserRole.Admin) {
                filtered = fetchedUsers.filter((u: User) => u.role !== UserRole.Admin && u.role !== UserRole.SuperAdmin);
            }
            setUsers(filtered);
            setFilteredUsers(filtered);
        } catch (err) {
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [currentUser]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        const results = users.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
        setFilteredUsers(results);
        setCurrentPage(1);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const handleCreateUser = async (userData: any) => {
        try {
            await apiCreateUser(userData);
            fetchUsers();
            setIsCreateModalOpen(false);
            toast.success('User created successfully!');
        } catch (err) {
            toast.error('Failed to create user.');
        }
    };

    const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
        try {
            await apiUpdateUser(userId, userData);
            fetchUsers();
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

    const handleBulkImportClick = () => fileInputRef.current?.click();

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

    if (loading) return <div className="text-center p-6 text-gray-500">Loading users...</div>;
    if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Users</h1>
                <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                    <div className="relative w-full sm:w-64">
                        <input type="text" placeholder="Search user..." value={searchTerm} onChange={handleSearch} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500" />
                        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center"><PlusCircle size={18} className="mr-1"/>New</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                    <button onClick={handleBulkImportClick} className="btn-secondary flex items-center"><Upload size={18} className="mr-1"/>Import</button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th">Name</th>
                            <th className="th">Email</th>
                            <th className="th">Role</th>
                            <th className="th">Department</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentItems.map(user => (
                            <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <td className="td">{`${user.firstName} ${user.lastName}`}</td>
                                <td className="td">{user.email}</td>
                                <td className="td"><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                                <td className="td">{user.department?.name || 'N/A'}</td>
                                <td className="td text-right flex justify-end space-x-2">
                                    <PasswordResetButton email={user.email} />
                                    <button onClick={() => openEditModal(user)} className="text-blue-500 hover:text-blue-700"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteUser(user._id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-4 space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => paginate(i + 1)} className={`px-3 py-1 rounded-md ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}>{i + 1}</button>
                ))}
            </div>

            <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateUser} />
            {selectedUser && <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} onUpdate={handleUpdateUser} />}
        </motion.div>
    );
};

// --- Modal Components ---
interface CreateUserModalProps { isOpen: boolean; onClose: () => void; onCreate: (userData: Partial<User>) => void; }
const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate }) => {
    const { user: currentUser } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Student);
    const [departmentId, setDepartmentId] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ firstName, lastName, email, password, role, department: departmentId || undefined });
    };

    useEffect(() => {
        if (isOpen) apiGetDepartments().then(setDepartments).catch(() => setDepartments([]));
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="modal-backdrop">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content max-w-sm sm:max-w-md">
                        <div className="modal-header">
                            <h2 className="text-xl font-semibold">Create New User</h2>
                            <button onClick={onClose}><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="input" required />
                            <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="input" required />
                            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
                            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input" />
                            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="input">
                                {Object.values(UserRole)
                                    .filter(r => !(currentUser && currentUser.role === UserRole.Admin && (r === UserRole.Admin || r === UserRole.SuperAdmin)))
                                    .map(r => <option key={r} value={r}>{r}</option>)}
                            </select>

                            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="input">
                                <option value="">-- Select Department (optional) --</option>
                                {departments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
                            </select>

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface EditUserModalProps { isOpen: boolean; onClose: () => void; user: User; onUpdate: (userId: string, userData: Partial<User>) => void; }
const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const { user: currentUser } = useAuth();
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState<UserRole>(user.role);
    const [departments, setDepartments] = useState<any[]>([]);
    const [departmentId, setDepartmentId] = useState<string | undefined>(user.department?._id || user.departmentId);

    useEffect(() => { apiGetDepartments().then(setDepartments).catch(() => setDepartments([])); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(user._id, { firstName, lastName, email, role, department: departmentId });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="modal-backdrop">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content max-w-sm sm:max-w-md">
                        <div className="modal-header">
                            <h2 className="text-xl font-semibold">Edit User</h2>
                            <button onClick={onClose}><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="input" required />
                            <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="input" required />
                            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
                            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="input">
                                {Object.values(UserRole)
                                    .filter(r => !(currentUser && currentUser.role === UserRole.Admin && (r === UserRole.Admin || r === UserRole.SuperAdmin)))
                                    .map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select value={departmentId || ''} onChange={e => setDepartmentId(e.target.value || undefined)} className="input">
                                <option value="">-- Select Department (optional) --</option>
                                {departments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
                            </select>

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Update</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ManageUsersPage;
