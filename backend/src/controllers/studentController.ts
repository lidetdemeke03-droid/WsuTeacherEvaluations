import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Course from '../models/courseModel';
import User from '../models/userModel';

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
