import { Request, Response } from 'express';
import Course from '../models/Course';
import asyncHandler from 'express-async-handler';

// @desc    Get courses taught by a specific teacher
// @route   GET /api/courses/by-teacher/:teacherId
// @access  Private
export const getCoursesByTeacher = asyncHandler(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    console.log(`[CourseController] Fetching courses for teacher ID: ${teacherId}`);

    try {
        const courses = await Course.find({ teacher: teacherId })
            .populate('department', 'name')
            .populate('teacher', 'firstName lastName');

        console.log(`[CourseController] Found ${courses.length} courses for teacher ID: ${teacherId}`);

        if (courses.length === 0) {
            console.warn(`[CourseController] No courses found for teacher ID: ${teacherId}. Check if the teacher is assigned to any courses.`);
        }

        res.status(200).json({
            success: true,
            data: courses,
        });
    } catch (error) {
        console.error(`[CourseController] Error fetching courses for teacher ID: ${teacherId}`, error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching courses.',
        });
    }
});


export const getCourses = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const courses = await Course.find().populate('department').populate('teacher').skip(skip).limit(limit);
        const total = await Course.countDocuments();

        res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                total,
                page,
                limit
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getCourse = async (req: Request, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).populate('department').populate('teacher');
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        res.status(200).json({ success: true, data: course });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createCourse = async (req: Request, res: Response) => {
    try {
        const { title, code, department, teacher } = req.body;
        const course = new Course({ title, code, department, teacher });
        await course.save();
        await course.populate('teacher department');
        res.status(201).json({ success: true, data: course });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { title, code, department, teacher } = req.body;
        const course = await Course.findByIdAndUpdate(req.params.id, { title, code, department, teacher }, { new: true, runValidators: true });
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        await course.populate('teacher department');
        res.status(200).json({ success: true, data: course });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
