
import React, { useState, useEffect } from 'react';
import { apiGetCourses, apiCreateCourse, apiGetUsers, apiGetDepartments, apiAssignEvaluation } from '../../services/api';
import { Course, User, Department, UserRole } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X, UserPlus } from 'lucide-react';
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

    if (loading) return <div>Loading courses...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Courses</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <PlusCircle size={20} className="mr-2" />
                    New Course
                </button>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <motion.div key={course._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold">{course.title}</h2>
                            <p className="text-gray-600 dark:text-gray-400">{course.code}</p>
                            <p className="mt-2 text-sm">Teacher: {course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'N/A'}</p>
                        </div>
                        <button onClick={() => openAssignModal(course)} className="mt-4 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                            <UserPlus size={18} className="mr-2" />
                            Assign Students
                        </button>
                    </motion.div>
                ))}
            </div>

            <CreateCourseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateCourse} />
            {selectedCourse && <AssignStudentModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} course={selectedCourse} />}
        </motion.div>
    );
};


// CreateCourseModal and AssignStudentModal components...
interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (courseData: Partial<Course>) => void;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [departmentId, setDepartmentId] = useState('');

    const [teachers, setTeachers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        if (isOpen) {
            apiGetUsers().then(users => setTeachers(users.filter(u => u.role === UserRole.Teacher)));
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
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Create New Course</h2>
                            <button onClick={onClose}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Course Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded" />
                            <input type="text" placeholder="Course Code" value={code} onChange={e => setCode(e.target.value)} className="w-full p-2 border rounded" />
                            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Teacher</option>{teachers.map(t => <option key={t._id} value={t._id}>{`${t.firstName} ${t.lastName}`}</option>)}</select>
                            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Department</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
                            <div className="flex justify-end space-x-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button></div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface AssignStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
}

const AssignStudentModal: React.FC<AssignStudentModalProps> = ({ isOpen, onClose, course }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            apiGetUsers().then(users => setStudents(users.filter(u => u.role === UserRole.Student)));
        }
    }, [isOpen]);

    const handleAssign = async () => {
        if (!course.teacher?._id) {
            toast.error("This course does not have a teacher assigned.");
            return;
        }
        const assignments = selectedStudents.map(studentId =>
            apiAssignEvaluation({ studentId, courseId: course._id, teacherId: course.teacher._id })
        );
        const toastId = toast.loading('Assigning students...');
        try {
            await Promise.all(assignments);
            toast.success('Students assigned successfully!', { id: toastId });
            onClose();
        } catch (error) {
            toast.error('Failed to assign students.', { id: toastId });
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">Assign Students to {course.title}</h2>
                        <div className="max-h-64 overflow-y-auto pr-2">
                            {students.map(student => (
                                <div key={student._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <span>{`${student.firstName} ${student.lastName}`}</span>
                                    <input type="checkbox" checked={selectedStudents.includes(student._id)} onChange={() => toggleStudentSelection(student._id)} className="form-checkbox h-5 w-5"/>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded">Assign</button></div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ManageCoursesPage;
