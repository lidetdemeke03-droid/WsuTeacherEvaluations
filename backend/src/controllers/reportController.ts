import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { IRequest } from '../middleware/auth';
import StatsCache from '../models/StatsCache';

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

    res.status(200).json({
        success: true,
        data: performanceData,
    });
});

// @desc    Get all reports for a department (for dept head)
// @route   GET /api/reports/department/:id
// @access  Private (DepartmentHead)
export const getDepartmentReport = asyncHandler(async (req: Request, res: Response) => {
    const departmentId = req.params.id;
    // Note: This requires linking users (teachers) to departments.
    // This is a placeholder for future implementation.
    const reports = await StatsCache.find({}).populate({
        path: 'teacher',
        match: { department: departmentId }
    });

    res.json({
        success: true,
        data: reports.filter(r => r.teacher),
    });
});
