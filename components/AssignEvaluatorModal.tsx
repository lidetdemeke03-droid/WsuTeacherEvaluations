import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiAssignEvaluation, apiGetActiveEvaluationPeriods, apiGetUsersByRoleAndDepartment } from '../services/api';
import { Course, User, Department, EvaluationPeriod, UserRole, Evaluation, EvaluationType } from '../types';

interface AssignEvaluatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onAssignmentSuccess: () => void;
}



const AssignEvaluatorModal: React.FC<AssignEvaluatorModalProps> = ({ isOpen, onClose, course, onAssignmentSuccess }) => {
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [evaluationPeriods, setEvaluationPeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [evaluatorType, setEvaluatorType] = useState<'teacher' | 'student'>('student');
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchInitialData = async () => {
        try {
          setLoading(true);
          setSelectedEvaluatorIds([]); // Clear selections on modal open
          setSelectAll(false); // Reset select all

          const activePeriods = await apiGetActiveEvaluationPeriods();
          setEvaluationPeriods(activePeriods);
          if (activePeriods.length === 0) {
            toast.error('There is no active evaluation period.');
          } else {
            setSelectedPeriod(activePeriods[0]._id); // Pre-select the first active period
          }

          // Fetch evaluators based on type
          let fetchedEvaluators: User[] = [];
          if (course.department && course.department._id) {
            if (evaluatorType === 'teacher') {
              fetchedEvaluators = await apiGetUsersByRoleAndDepartment(
                UserRole.Teacher,
                course.department._id,
                course.teacher?._id // Exclude the course owner
              );
            } else if (evaluatorType === 'student') {
              fetchedEvaluators = await apiGetUsersByRoleAndDepartment(
                UserRole.Student,
                course.department._id
              );
            }
          }
          setEvaluators(fetchedEvaluators);
        } catch (error) {
          toast.error('Failed to load data for evaluator assignment.');
          console.error('Error loading evaluator assignment data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [isOpen, evaluatorType, course.department, course.teacher]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedEvaluatorIds(evaluators.map((evaluator) => evaluator._id));
    } else {
      setSelectedEvaluatorIds([]);
    }
  };

  const handleEvaluatorToggle = (evaluatorId: string) => {
    setSelectedEvaluatorIds((prev) =>
      prev.includes(evaluatorId)
        ? prev.filter((id) => id !== evaluatorId)
        : [...prev, evaluatorId]
    );
  };

      const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (selectedEvaluatorIds.length === 0 || !selectedPeriod) {
              toast.error('Please select at least one evaluator and an evaluation period.');
              return;
          }
          if (evaluationPeriods.length === 0) {
              toast.error('Cannot assign: No active evaluation period.');
              return;
          }
          if (!course.teacher) {
              toast.error('This course has no assigned teacher and cannot be evaluated.');
              return;
          }
  
          const period = evaluationPeriods.find(p => p._id === selectedPeriod);
          if (!period) {
              toast.error('Selected evaluation period not found.');
              return;
          }
  
          try {
              await apiAssignEvaluation({
                  evaluatorIds: selectedEvaluatorIds,
                  courseId: course._id,
                  teacherId: course.teacher ? course.teacher._id : '',
                  periodId: selectedPeriod,
                  evaluationType: evaluatorType === 'student' ? EvaluationType.Student : EvaluationType.Peer,
                  window: {
                      start: period.startDate,
                      end: period.endDate,
                  },
              });
              toast.success('Evaluators assigned successfully!');
              onClose();
              onAssignmentSuccess(); // Refresh courses in parent component
          } catch (error) {
              toast.error('Failed to assign evaluators.');
              console.error('Error assigning evaluators:', error);
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
              <div className="text-center text-gray-500 dark:text-gray-400">Loading evaluators and periods...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Evaluator Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Evaluator Type
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="evaluatorType"
                        value="teacher"
                        checked={evaluatorType === 'teacher'}
                        onChange={() => setEvaluatorType('teacher')}
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Teacher</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="evaluatorType"
                        value="student"
                        checked={evaluatorType === 'student'}
                        onChange={() => setEvaluatorType('student')}
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Student</span>
                    </label>
                  </div>
                </div>

                {/* Evaluation Period Selection */}
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
                    disabled={evaluationPeriods.length === 0}
                  >
                    {evaluationPeriods.length === 0 ? (
                      <option value="">No active periods</option>
                    ) : (
                      <>
                        <option value="">-- Select a Period --</option>
                        {evaluationPeriods.map((period) => (
                          <option key={period._id} value={period._id}>
                            {period.name} ({new Date(period.startDate).toLocaleDateString()} to {new Date(period.endDate).toLocaleDateString()})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {evaluationPeriods.length === 0 && (
                    <p className="text-red-500 text-xs mt-1">No active evaluation periods available.</p>
                  )}
                </div>

                {/* Evaluator List */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Evaluator(s)
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-blue-600"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Select All</span>
                    </label>
                  </div>
                  <div className="border rounded-xl p-3 max-h-48 overflow-y-auto dark:border-gray-700">
                    {evaluators.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No {evaluatorType}s found in this department.</p>
                    ) : (
                      evaluators.map((user) => (
                        <label key={user._id} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            className="form-checkbox text-blue-600"
                            checked={selectedEvaluatorIds.includes(user._id)}
                            onChange={() => handleEvaluatorToggle(user._id)}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">
                            {user.firstName} {user.lastName}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
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
                    disabled={selectedEvaluatorIds.length === 0 || evaluationPeriods.length === 0}
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
