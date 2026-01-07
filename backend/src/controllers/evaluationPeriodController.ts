import { Request, Response } from 'express';
import EvaluationPeriod from '../models/EvaluationPeriod';
import { IRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const getEvaluationPeriods = async (req: IRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filter: any = {};
        // DepartmentHeads should see global periods (no department) and their own department's periods
        if (req.user && req.user.role === UserRole.DepartmentHead) {
            filter.$or = [{ department: { $exists: false } }, { department: req.user.department }];
        }

        const periods = await EvaluationPeriod.find(filter).skip(skip).limit(limit);
        const total = await EvaluationPeriod.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: periods,
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

export const getEvaluationPeriod = async (req: Request, res: Response) => {
    try {
        const period = await EvaluationPeriod.findById(req.params.id);
        if (!period) {
            return res.status(404).json({ success: false, error: 'Evaluation period not found' });
        }
        res.status(200).json({ success: true, data: period });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createEvaluationPeriod = async (req: IRequest, res: Response) => {
    try {
        let { name, startDate, endDate, status } = req.body;
        name = typeof name === 'string' ? name.trim().toLowerCase() : name;
        const payload: any = { name, startDate, endDate, status };
        // If DepartmentHead, scope the period to their department so it doesn't affect other departments
        if (req.user && req.user.role === UserRole.DepartmentHead) {
            payload.department = req.user.department;
        }
        const period = new EvaluationPeriod(payload);
        await period.save();
        res.status(201).json({ success: true, data: period });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateEvaluationPeriod = async (req: IRequest, res: Response) => {
    try {
        const periodId = req.params.id;
        if (!periodId) {
            return res.status(400).json({ success: false, error: 'Evaluation Period ID is required' });
        }

        let { name, startDate, endDate, status } = req.body;
        name = typeof name === 'string' ? name.trim().toLowerCase() : name;

        console.log(`Attempting to update period: ${periodId}`);
        console.log('Request body:', { name, startDate, endDate, status });

        // If DepartmentHead, ensure they can only update periods scoped to their department
        if (req.user && req.user.role === UserRole.DepartmentHead) {
            const existing = await EvaluationPeriod.findById(periodId).select('department');
            if (!existing) return res.status(404).json({ success: false, error: 'Evaluation period not found' });
            if ((existing as any).department && String((existing as any).department) !== String(req.user.department)) {
                return res.status(403).json({ success: false, error: 'Not authorized to modify this evaluation period' });
            }
        }

        const period = await EvaluationPeriod.findByIdAndUpdate(periodId, { name, startDate, endDate, status }, { new: true, runValidators: true });
        
        console.log('Result of findByIdAndUpdate:', period);

        if (!period) {
            return res.status(404).json({ success: false, error: 'Evaluation period not found' });
        }
        res.status(200).json({ success: true, data: period });
    } catch (error: any) {
        console.error('Error updating evaluation period:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteEvaluationPeriod = async (req: IRequest, res: Response) => {
    try {
        // If DepartmentHead, ensure only deleting periods scoped to their department
        if (req.user && req.user.role === UserRole.DepartmentHead) {
            const existing = await EvaluationPeriod.findById(req.params.id).select('department');
            if (!existing) return res.status(404).json({ success: false, error: 'Evaluation period not found' });
            if ((existing as any).department && String((existing as any).department) !== String(req.user.department)) {
                return res.status(403).json({ success: false, error: 'Not authorized to delete this evaluation period' });
            }
        }

        const period = await EvaluationPeriod.findByIdAndDelete(req.params.id);
        if (!period) {
            return res.status(404).json({ success: false, error: 'Evaluation period not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getActiveEvaluationPeriods = async (req: IRequest, res: Response) => {
    try {
        const filter: any = { status: 'active' };
        if (req.user && req.user.role === UserRole.DepartmentHead) {
            filter.$or = [{ department: { $exists: false } }, { department: req.user.department }];
        }
        const activePeriods = await EvaluationPeriod.find(filter);
        res.status(200).json({ success: true, data: activePeriods });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
