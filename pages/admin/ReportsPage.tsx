import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { api } from '../../services/api';
import { Printer, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get<any[]>('/departments');
        // If DepartmentHead, only show their department and preselect it
        if (user && user.role === UserRole.DepartmentHead) {
          setDepartments((d || []).filter((dept: any) => dept._id === (user.department as any)));
          setSelectedDept(String(user.department));
        } else {
          setDepartments(d || []);
        }
        const p = await api.get<any[]>('/periods');
        const now = new Date();
        setPeriods((p || []).filter((pp: any) => new Date(pp.endDate) < now));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    (async () => {
      try {
        const t = await api.get<any[]>(`/departments/${selectedDept}/teachers${selectedPeriod ? `?period=${selectedPeriod}` : ''}`);
        setTeachers(t || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedDept, selectedPeriod]);

  const handleGenerate = async (teacher: any, type: 'print' | 'email') => {
    if (!selectedPeriod) {
      setMessage('Please select a completed evaluation period');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post<any>('/reports/generate', { teacherIds: [teacher._id], departmentId: selectedDept, period: selectedPeriod, type });
      const result = res[0];
      if (type === 'print') {
        try {
          const token = sessionStorage.getItem('authToken');
          if (!token) throw new Error('Not authorized, no token');
          const resp = await fetch(`${API_BASE}/reports/${result.reportId}/download`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!resp.ok) throw new Error(await resp.text() || 'Failed to download report');
          const blob = await resp.blob();
          const url = window.URL.createObjectURL(blob);
          const periodObj = periods.find((p: any) => p._id === selectedPeriod);
          const filename = `${teacher.firstName}_${teacher.lastName}_${periodObj?.name || 'report'}.pdf`.replace(/\s+/g, '_');
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => window.URL.revokeObjectURL(url), 15000);
        } catch (err: any) {
          console.error('Download failed', err);
          setMessage(err.message || 'Failed to download report');
        }
      } else {
        setMessage('Detailed report sent successfully to the teacher.');
      }
    } catch (e: any) {
      console.error(e);
      setMessage(e.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Reports</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select disabled={user && user.role === UserRole.DepartmentHead} className="mt-1 block w-full border rounded-lg p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" onChange={e => setSelectedDept(e.target.value)} value={selectedDept || ''}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Evaluation Period (completed)</label>
          <select className="mt-1 block w-full border rounded-lg p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" onChange={e => setSelectedPeriod(e.target.value)} value={selectedPeriod || ''}>
            <option value="">Select period</option>
            {periods.map(p => <option key={p._id} value={p._id}>{p.name} ({new Date(p.endDate).toLocaleDateString()})</option>)}
          </select>
        </div>
        <div className="hidden sm:block">
          <label className="block text-sm font-medium text-transparent">_</label>
          <div className="mt-1 text-sm text-gray-600">Select a department and completed period to list teachers.</div>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg shadow-sm"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {teachers.map(t => (
          <motion.div
            key={t._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white rounded-2xl shadow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800">{t.firstName} {t.lastName}</span>
              <span className="text-sm text-gray-500">{t.email}</span>
            </div>
            <div className="flex space-x-2 justify-end">
              <button disabled={loading} onClick={() => handleGenerate(t, 'print')} className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg transition-colors duration-200">
                <Printer size={18} className="mr-2" /> Print
              </button>
              <button disabled={loading} onClick={() => handleGenerate(t, 'email')} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200">
                <Mail size={18} className="mr-2" /> Send
              </button>
            </div>
          </motion.div>
        ))}

        {teachers.length === 0 && !loading && (
          <div className="text-center text-gray-500 mt-8">No teachers found for the selected department and period.</div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
