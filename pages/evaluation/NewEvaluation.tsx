
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGetStudentEvaluations, apiGetDepartmentTeachers, apiGetEvaluationPeriods } from '../../services/api';
import { Evaluation, UserRole } from '../../types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EvaluationForm from '../student/EvaluationForm';

const NewEvaluation: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Evaluation | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      try {
        if (user.role === UserRole.DepartmentHead) {
          // Fetch active period
          const periods = await apiGetEvaluationPeriods();
          const active = periods.find(p => p.status === 'Active');
          const periodId = active?._id;
          const teachers = await apiGetDepartmentTeachers(String((user as any).department), periodId);
          const mapped = teachers.map((t: any) => ({
            _id: t._id,
            status: t.evaluated ? 'Completed' : 'Pending',
            course: { title: '' },
            teacher: t,
          } as Evaluation));
          setAssignments(mapped);
        } else {
          const data = await apiGetStudentEvaluations(user._id);
          setAssignments(data);
        }
      } catch (e) {
        console.error('Failed to fetch assignments', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  if (selected) return <EvaluationForm evaluation={selected} onBack={() => setSelected(null)} onComplete={(id: string) => { setAssignments(prev => prev.map(a => a._id === id ? { ...a, status: 'Completed' } : a)); setSelected(null); }} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Make Evaluation</h1>
      {assignments.length === 0 ? (
        <p className="text-lg text-gray-600 dark:text-gray-300">No assignments to evaluate.</p>
      ) : (
        <div className="grid gap-4">
          {assignments.map(a => (
            <div key={a._id} className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">{a.course?.title || ''}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">For: {a.teacher.firstName} {a.teacher.lastName}</div>
              </div>
              <div className="flex items-center space-x-2">
                {user.role === UserRole.DepartmentHead ? (
                  <Link to={`/department/evaluate/${a._id}`} className={`px-3 py-2 rounded ${a.status === 'Completed' ? 'bg-gray-300 text-gray-600 pointer-events-none' : 'bg-blue-600 text-white'}`}>
                    Evaluate
                  </Link>
                ) : (
                  <>
                    <button onClick={() => setSelected(a)} className="px-3 py-2 bg-blue-600 text-white rounded">Evaluate</button>
                    <span className="text-sm text-gray-500">{a.status}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default NewEvaluation;
