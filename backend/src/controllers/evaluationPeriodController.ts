import { Request, Response } from 'express';
import EvaluationPeriod from '../models/EvaluationPeriod';

export const getEvaluationPeriods = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const periods = await EvaluationPeriod.find().skip(skip).limit(limit);
        const total = await EvaluationPeriod.countDocuments();

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

export const createEvaluationPeriod = async (req: Request, res: Response) => {
    try {
        let { name, startDate, endDate, status } = req.body;
        name = typeof name === 'string' ? name.trim().toLowerCase() : name;
        const period = new EvaluationPeriod({ name, startDate, endDate, status });
        await period.save();
        res.status(201).json({ success: true, data: period });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateEvaluationPeriod = async (req: Request, res: Response) => {
    try {
        const periodId = req.params.id;
        if (!periodId) {
            return res.status(400).json({ success: false, error: 'Evaluation Period ID is required' });
        }

        let { name, startDate, endDate, status } = req.body;
        name = typeof name === 'string' ? name.trim().toLowerCase() : name;

        console.log(`Attempting to update period: ${periodId}`);
        console.log('Request body:', { name, startDate, endDate, status });

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

export const deleteEvaluationPeriod = async (req: Request, res: Response) => {
    try {
        const period = await EvaluationPeriod.findByIdAndDelete(req.params.id);
        if (!period) {
            return res.status(404).json({ success: false, error: 'Evaluation period not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getActiveEvaluationPeriods = async (req: Request, res: Response) => {
    try {
        const activePeriods = await EvaluationPeriod.find({ status: 'active' });
        res.status(200).json({ success: true, data: activePeriods });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
