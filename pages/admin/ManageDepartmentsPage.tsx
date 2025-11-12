import React, { useState, useEffect } from 'react';
import { Department, User, UserRole } from '../../types';
import { apiGetDepartments, apiCreateDepartment, apiUpdateDepartment, apiDeleteDepartment, apiGetUsers } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [selectedHead, setSelectedHead] = useState<string | null>(null);

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
        await apiUpdateDepartment(currentDepartment.id, { ...formData, head: selectedHead ? [selectedHead] : [] });
        toast.success('Department updated successfully');
      } else {
        await apiCreateDepartment({ ...formData, head: selectedHead ? [selectedHead] : [] });
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
      setFormData({ name: department.name, code: department.code });
      setSelectedHead(department.head && department.head.length ? (department.head[0]._id || (department.head[0] as any).id) : null);
    } else {
      setIsEditing(false);
      setCurrentDepartment(null);
      setFormData({ name: '', code: '' });
      setSelectedHead(null);
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    apiGetUsers().then(list => setUsers(list.filter(u => u.role === UserRole.DepartmentHead))).catch(() => setUsers([]));
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Building2 className="text-blue-600" /> Manage Departments
        </h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all"
        >
          <Plus size={20} className="mr-2" /> Add Department
        </motion.button>
      </div>

      {isModalOpen && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">{isEditing ? 'Edit' : 'Add'} Department</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Department Name" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="Department Code" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <select value={selectedHead || ''} onChange={e => setSelectedHead(e.target.value || null)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select Department Head (Optional) --</option>
                  {users.map(u => <option key={u._id} value={u._id}>{`${u.firstName} ${u.lastName} (${u.email})`}</option>)}
                </select>
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">{isEditing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-2xl">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Department Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Code</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {departments.map((dept) => (
                <motion.tr key={dept.id} whileHover={{ scale: 1.01 }} className="transition-all">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-gray-100">{dept.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{dept.code}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button onClick={() => openModal(dept)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default ManageDepartmentsPage;
