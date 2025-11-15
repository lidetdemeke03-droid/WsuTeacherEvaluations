import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGetUsersByRoleAndDepartment, apiGetTeacherCourses, apiGetActiveEvaluationPeriods, apiGetDepartmentHeadEvaluations } from '../../services/api';
import { User, UserRole, Course, EvaluationPeriod, Evaluation } from '../../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const NewEvaluation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [coursesForSelectedTeacher, setCoursesForSelectedTeacher] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activePeriods, setActivePeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<EvaluationPeriod | null>(null);
  const [previousEvaluations, setPreviousEvaluations] = useState<Evaluation[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departmentId = user?.department;

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== UserRole.DepartmentHead || !departmentId) {
        setLoading(false);
        return;
      }

      try {
        const [periodsData, teachersData] = await Promise.all([
          apiGetActiveEvaluationPeriods(),
          apiGetUsersByRoleAndDepartment(UserRole.Teacher, String(departmentId._id)),
        ]);

        setActivePeriods(periodsData);
        setTeachers(teachersData);
        if (periodsData.length === 1) {
          setSelectedPeriod(periodsData[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch initial data.');
        toast.error(err.message || 'Failed to fetch initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, departmentId]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (selectedTeacher) {
        setLoadingCourses(true);
        setCoursesForSelectedTeacher([]);
        setSelectedCourse(null);
        try {
          const coursesData = await apiGetTeacherCourses(String(selectedTeacher._id), departmentId);
          if (Array.isArray(coursesData)) {
            setCoursesForSelectedTeacher(coursesData);
            if (coursesData.length === 1) {
              setSelectedCourse(coursesData[0]);
            }
          } else {
            console.error("Expected an array of courses, but received:", coursesData);
            toast.error('Received an invalid format for courses.');
            setCoursesForSelectedTeacher([]);
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to fetch courses for teacher.');
          setCoursesForSelectedTeacher([]);
        } finally {
          setLoadingCourses(false);
        }
      } else {
        setCoursesForSelectedTeacher([]);
        setSelectedCourse(null);
      }
    };
    fetchCourses();
  }, [selectedTeacher]);

  useEffect(() => {
    const fetchPreviousEvaluations = async () => {
      if (user && user.role === UserRole.DepartmentHead) {
        try {
          const evaluations = await apiGetDepartmentHeadEvaluations();
          setPreviousEvaluations(evaluations);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch previous evaluations.');
        }
      }
    };
    fetchPreviousEvaluations();
  }, [user]);

  const handleTeacherSelect = (teacher: User) => {
    setSelectedTeacher(teacher);
    setSelectedCourse(null);
  };

  const handleStartEvaluation = () => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher first.');
      return;
    }
    if (!selectedPeriod) {
      toast.error('Please select an evaluation period.');
      return;
    }
    if (!selectedCourse) {
      toast.error('Please select a course for the chosen teacher.');
      return;
    }
    navigate(`/department/evaluate/${selectedTeacher._id}/${selectedCourse._id}/${selectedPeriod._id}`);
  };

  const isEvaluationDisabled = !selectedTeacher || !selectedCourse || !selectedPeriod;

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error && !loading) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  if (user?.role !== UserRole.DepartmentHead) {
    return <div className="text-center py-8 text-red-500">Access Denied: Only Department Heads can access this page.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">New Department Head Evaluation</h1>

      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">1. Select Teacher</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No teachers found in your department.</p>
          ) : (
            teachers.map((teacher) => (
              <button
                key={teacher._id}
                onClick={() => handleTeacherSelect(teacher)}
                className={`p-4 rounded-lg text-left transition-all duration-200
                  ${selectedTeacher?._id === teacher._id
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-blue-100 dark:hover:bg-gray-600'
                  }`}
              >
                <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                <p className="text-sm opacity-80">{teacher.email}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedTeacher && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">2. Evaluation Details</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="period-select" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Evaluation Period:
              </label>
              <select
                id="period-select"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedPeriod?._id || ''}
                onChange={(e) => setSelectedPeriod(activePeriods.find(p => p._id === e.target.value) || null)}
                disabled={activePeriods.length <= 1}
              >
                <option value="">-- Select Period --</option>
                {activePeriods.map((period) => (
                  <option key={period._id} value={period._id}>
                    {period.name} ({format(new Date(period.startDate), 'MMM yyyy')} - {format(new Date(period.endDate), 'MMM yyyy')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="course-select" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Course for {selectedTeacher.firstName} {selectedTeacher.lastName}:
              </label>
              {loadingCourses ? (
                <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
              ) : coursesForSelectedTeacher.length > 0 ? (
                <select
                  id="course-select"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedCourse?._id || ''}
                  onChange={(e) => setSelectedCourse(coursesForSelectedTeacher.find(c => c._id === e.target.value) || null)}
                >
                  <option value="">-- Select Course --</option>
                  {coursesForSelectedTeacher.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title} ({course.code})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No courses found for this teacher.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {selectedTeacher && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">3. Start Evaluation</h2>
          {isEvaluationDisabled && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-gray-700 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">Please select a teacher, period, and course to proceed.</p>
            </div>
          )}
          <button
            onClick={handleStartEvaluation}
            className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white transition-colors ${
              isEvaluationDisabled
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
            disabled={isEvaluationDisabled}
          >
            Start Evaluation
          </button>
        </motion.div>
      )}

      <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Previous Evaluations</h2>
        {previousEvaluations.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No previous evaluations found.</p>
        ) : (
          <div className="grid gap-4">
            {previousEvaluations.map((evalItem) => (
              <div key={evalItem._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-800 dark:text-white">
                  Teacher: {evalItem.targetTeacher.firstName} {evalItem.targetTeacher.lastName}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Course: {evalItem.course.title} ({evalItem.course.code})
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Period: {evalItem.period.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Submitted on: {format(new Date(evalItem.submittedAt), 'PPP')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NewEvaluation;