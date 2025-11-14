import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Course from '../models/Course';
import User from '../models/User';

// @desc    Get courses for a student
// @route   GET /api/students/:id/courses
// @access  Private (Student)
export const getStudentCourses = asyncHandler(async (req: Request, res: Response) => {
    const student = await User.findById(req.params.id).populate('courses');

    if (student) {
        res.json({
            success: true,
            data: student.courses,
        });
    } else {
        res.status(404);
        throw new Error('Student not found');
    }
});

// @desc    Get courses for a teacher
// @route   GET /api/users/:id/courses
// @access  Private (Admin, DepartmentHead, Teacher)
export const getTeacherCourses = asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.params.id;
    console.log(`Fetching courses for teacher ID: ${teacherId}`);
    const courses = await Course.find({ teacher: teacherId })
        .populate('department')
        .populate('teacher', 'firstName lastName');
    console.log(`Found ${courses.length} courses for teacher ID: ${teacherId}`);
    res.json({ success: true, data: courses });
});
