import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiGetUsers, apiGetEvaluationPeriods, apiAssignEvaluation } from '../services/api';
import { Course, User, EvaluationPeriod, UserRole } from '../types';

interface AssignEvaluatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

const AssignEvaluatorModal: React.FC<AssignEvaluatorModalProps> = ({ isOpen, onClose, course }) => {
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [evaluationPeriods, setEvaluationPeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchInitialData = async () => {
        try {
          setLoading(true);
          const [usersData, periodsData] = await Promise.all([
            apiGetUsers(),
            apiGetEvaluationPeriods(),
          ]);
          // Filter users who can be evaluators (e.g., students, department heads, or even other teachers if applicable)
          // For now, let's assume students can evaluate. Adjust as per actual requirements.
          setEvaluators(usersData.filter(u => u.role === UserRole.Student || u.role === UserRole.DepartmentHead));
          setEvaluationPeriods(periodsData.filter(p => p.status === 'Active'));
        } catch (error) {
          toast.error('Failed to load data for evaluator assignment.');
          console.error('Error loading evaluator assignment data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvaluator || !selectedPeriod) {
      toast.error('Please select both an evaluator and an evaluation period.');
      return;
    }

    try {
      await apiAssignEvaluation({
        student: selectedEvaluator, // Assuming student is the evaluator for now
        courseId: course._id,
        teacherId: course.teacher ? course.teacher._id : '', // Assuming course.teacher is populated
        periodId: selectedPeriod,
      });
      toast.success('Evaluator assigned successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to assign evaluator.');
      console.error('Error assigning evaluator:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
        >
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Assign Evaluator for {course.title}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>
            {loading ? (
              <div className="text-center text-gray-500">Loading evaluators and periods...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="evaluator" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Evaluator
                  </label>
                  <select
                    id="evaluator"
                    value={selectedEvaluator}
                    onChange={(e) => setSelectedEvaluator(e.target.value)}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  >
                    <option value="">-- Select an Evaluator --</option>
                    {evaluators.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Evaluation Period
                  </label>
                  <select
                    id="period"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  >
                    <option value="">-- Select a Period --</option>
                    {evaluationPeriods.map((period) => (
                      <option key={period._id} value={period._id}>
                        {period.name} ({period.startDate.substring(0, 10)} to {period.endDate.substring(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    Assign
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssignEvaluatorModal;
