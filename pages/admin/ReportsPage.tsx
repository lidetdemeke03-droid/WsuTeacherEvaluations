import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ReportsPage: React.FC = () => {
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
        setDepartments(d || []);
        const p = await api.get<any[]>('/periods');
        // only show completed periods (endDate in the past)
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

  const handleGenerate = async (teacherId: string, type: 'print' | 'email') => {
    if (!selectedPeriod) {
      setMessage('Please select a completed evaluation period');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post<any>('/reports/generate', { teacherIds: [teacherId], departmentId: selectedDept, period: selectedPeriod, type });
      // res should be array of results
      const result = res[0];
      if (type === 'print') {
        // The download endpoint requires Authorization header. Fetch the file with token and open as blob URL.
        try {
          const token = sessionStorage.getItem('authToken');
          if (!token) throw new Error('Not authorized, no token');
          const resp = await fetch(`${API_BASE}/reports/${result.reportId}/download`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(txt || 'Failed to download report');
          }
          const blob = await resp.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium">Department</label>
          <select className="mt-1 block w-full border rounded p-2" onChange={e => setSelectedDept(e.target.value)} value={selectedDept || ''}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Evaluation Period (completed)</label>
          <select className="mt-1 block w-full border rounded p-2" onChange={e => setSelectedPeriod(e.target.value)} value={selectedPeriod || ''}>
            <option value="">Select period</option>
            {periods.map(p => <option key={p._id} value={p._id}>{p.name} ({new Date(p.endDate).toLocaleDateString()})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium"> </label>
          <div className="mt-1 text-sm text-gray-600">Select a department and completed period to list teachers.</div>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">{message}</div>}

      <div className="space-y-3">
        {teachers.map(t => (
          <div key={t._id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{t.firstName} {t.lastName}</div>
              <div className="text-sm text-gray-500">{t.email}</div>
            </div>
            <div className="space-x-2">
              <button disabled={loading} onClick={() => handleGenerate(t._id, 'print')} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">🖨 Print Report</button>
              <button disabled={loading} onClick={() => handleGenerate(t._id, 'email')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">📧 Send by Email</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
