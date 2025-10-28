import { Request, Response } from 'express';
import { getInstructorReportData, getDepartmentReportData, getInstructorRatingDistribution as getDistributionData } from '../utils/aggregation';
import mongoose from 'mongoose';

export const getInstructorReport = async (req: Request, res: Response) => {
    try {
        const instructorId = new mongoose.Types.ObjectId(req.params.id);
        const { from, to, groupBy } = req.query;

        const reportData = await getInstructorReportData(
            instructorId,
            from ? new Date(from as string) : undefined,
            to ? new Date(to as string) : undefined,
            groupBy as 'week' | 'month' | undefined
        );

        res.status(200).json({ success: true, data: reportData });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getDepartmentReport = async (req: Request, res: Response) => {
    try {
        const departmentId = new mongoose.Types.ObjectId(req.params.id);

        const reportData = await getDepartmentReportData(departmentId);

        res.status(200).json({ success: true, data: reportData });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInstructorRatingDistribution = async (req: Request, res: Response) => {
    try {
        const instructorId = new mongoose.Types.ObjectId(req.params.id);

        const reportData = await getDistributionData(instructorId);

        res.status(200).json({ success: true, data: reportData });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
