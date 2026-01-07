import { Request, Response } from 'express';
import { UserRole } from '../types';
import Course from '../models/Course';
import asyncHandler from 'express-async-handler';

// @desc    Get courses taught by a specific teacher
// @route   GET /api/courses/by-teacher/:teacherId
// @access  Private
export const getCoursesByTeacher = asyncHandler(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const { departmentId } = req.query;

    try {
        const filter: any = { teacher: teacherId };
        if (departmentId) {
            filter.department = departmentId;
        }

        const courses = await Course.find(filter)
            .populate('department', 'name')
            .populate('teacher', 'firstName lastName');

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


import { IRequest } from '../middleware/auth';

export const getCourses = async (req: IRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filter: any = {};
        // If DepartmentHead, restrict to their department
        if (req.user && req.user.role === UserRole.DepartmentHead) {
            filter.department = req.user.department;
        }

        const courses = await Course.find(filter).populate('department').populate('teacher').skip(skip).limit(limit);
        const total = await Course.countDocuments(filter);

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
        // If request made by DepartmentHead, ensure department matches their department or set it
        const reqUser: any = (req as any).user;
        if (reqUser && reqUser.role === UserRole.DepartmentHead) {
            const userDept = String(reqUser.department);
            if (department && String(department) !== userDept) {
                return res.status(403).json({ success: false, error: 'Department heads can only create courses in their own department.' });
            }
        }
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
        const reqUser: any = (req as any).user;
        if (reqUser && reqUser.role === UserRole.DepartmentHead) {
            const existing = await Course.findById(req.params.id).select('department');
            if (!existing) return res.status(404).json({ success: false, error: 'Course not found' });
            if (!existing.department || String(existing.department) !== String(reqUser.department)) {
                return res.status(403).json({ success: false, error: 'Department heads can only update courses in their own department.' });
            }
            if (department && String(department) !== String(reqUser.department)) {
                return res.status(403).json({ success: false, error: 'Cannot move course to another department.' });
            }
        }
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
        const reqUser: any = (req as any).user;
        if (reqUser && reqUser.role === UserRole.DepartmentHead) {
            const existing = await Course.findById(req.params.id).select('department');
            if (!existing) return res.status(404).json({ success: false, error: 'Course not found' });
            if (!existing.department || String(existing.department) !== String(reqUser.department)) {
                return res.status(403).json({ success: false, error: 'Department heads can only delete courses in their own department.' });
            }
        }
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
