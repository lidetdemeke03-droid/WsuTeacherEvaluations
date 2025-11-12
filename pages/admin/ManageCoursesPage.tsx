import React, { useState, useEffect } from 'react';
import { apiGetCourses, apiCreateCourse, apiGetUsers, apiGetDepartments, apiAssignEvaluation, apiGetEvaluationPeriods } from '../../services/api';
import { Course, User, Department, UserRole, EvaluationPeriod } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X, UserPlus, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManageCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      const data = await apiGetCourses();
      setCourses(data);
    } catch (error) {
      toast.error('Failed to fetch courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (courseData: Partial<Course>) => {
    try {
      const newCourse = await apiCreateCourse(courseData);
      setCourses([...courses, newCourse]);
      setIsCreateModalOpen(false);
      toast.success('Course created successfully!');
    } catch (error) {
      toast.error('Failed to create course.');
    }
  };

  const openAssignModal = (course: Course) => {
    setSelectedCourse(course);
    setIsAssignModalOpen(true);
  };

  if (loading) return <div className="text-center text-gray-600 mt-10">Loading courses...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <BookOpen className="text-blue-600" /> Manage Courses
        </h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all"
        >
          <PlusCircle size={20} className="mr-2" /> New Course
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courses.map((course) => (
          <motion.div
            key={course._id}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 flex flex-col justify-between transition-all"
          >
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{course.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{course.code}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Teacher: {course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'N/A'}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openAssignModal(course)}
              className="mt-4 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md"
            >
              <UserPlus size={18} className="mr-2" /> Assign Evaluator
            </motion.button>
          </motion.div>
        ))}
      </div>

      <CreateCourseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateCourse} />
      {selectedCourse && <AssignEvaluatorModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} course={selectedCourse} />}
    </motion.div>
  );
};

const CreateCourseModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreate: (courseData: Partial<Course>) => void }> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [teachers, setTeachers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (isOpen) {
      apiGetUsers().then((users) => setTeachers(users.filter((u) => u.role === UserRole.Teacher)));
      apiGetDepartments().then(setDepartments);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ title, code, teacher: teacherId, department: departmentId });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create New Course</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Course Code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500">
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{`${t.firstName} ${t.lastName}`}</option>
                ))}
              </select>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500">
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">Create</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManageCoursesPage;
