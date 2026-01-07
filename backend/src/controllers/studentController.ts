import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Course from '../models/Course';
import User from '../models/User';

// @desc    Get courses for a student
// @route   GET /api/students/:id/courses
// @access  Private (Student)
export const getStudentCourses = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.params.id;

    // Ensure student exists
    const student = await User.findById(studentId);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    // Fetch courses that include this student in their `students` array
    const courses = await Course.find({ students: studentId })
        .populate('teacher', 'firstName lastName')
        .populate('department', 'name');

    res.json({
        success: true,
        data: courses,
    });
});


