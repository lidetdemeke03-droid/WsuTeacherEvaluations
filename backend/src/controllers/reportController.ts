import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { IRequest } from '../middleware/auth';
import StatsCache from '../models/StatsCache';
import { Request } from 'express';

// @desc    Get performance data for the current instructor
// @route   GET /api/reports/my-performance
// @access  Private (Instructor)
export const getMyPerformance = asyncHandler(async (req: IRequest, res: Response) => {
    const instructorId = req.user!._id;

    const performanceData = await StatsCache.find({ teacher: instructorId });

    if (!performanceData) {
        res.status(404);
        throw new Error('No performance data found for this instructor.');
    }

    // populate period name for frontend display
    const populated = await StatsCache.find({ teacher: instructorId }).populate('period', 'name');

    res.status(200).json({
        success: true,
        data: populated,
    });
});

// @desc    Get all reports for the current department head's department
// @route   GET /api/reports/department
// @access  Private (DepartmentHead)
export const getDepartmentReport = asyncHandler(async (req: IRequest, res: Response) => {
    const departmentId = req.user!.department;

    if (!departmentId) {
        res.status(400);
        throw new Error('User is not assigned to a department.');
    }

    const reports = await StatsCache.find({})
        .populate({
            path: 'teacher',
            model: 'User',
            match: { department: departmentId },
            select: 'firstName lastName',
        })
        .populate('period', 'name');

    const departmentReports = reports.filter(r => r.teacher);

    res.json({
        success: true,
        data: departmentReports,
    });
});
