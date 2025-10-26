import { Request, Response } from 'express';
import Criterion from '../models/Criterion';

export const getCriteria = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const criteria = await Criterion.find().skip(skip).limit(limit);
        const total = await Criterion.countDocuments();

        res.status(200).json({
            success: true,
            data: criteria,
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

export const getCriterion = async (req: Request, res: Response) => {
    try {
        const criterion = await Criterion.findById(req.params.id);
        if (!criterion) {
            return res.status(404).json({ success: false, error: 'Criterion not found' });
        }
        res.status(200).json({ success: true, data: criterion });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createCriterion = async (req: Request, res: Response) => {
    try {
        const { text, maxScore } = req.body;
        const criterion = new Criterion({ text, maxScore });
        await criterion.save();
        res.status(201).json({ success: true, data: criterion });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateCriterion = async (req: Request, res: Response) => {
    try {
        const { text, maxScore } = req.body;
        const criterion = await Criterion.findByIdAndUpdate(req.params.id, { text, maxScore }, { new: true, runValidators: true });
        if (!criterion) {
            return res.status(404).json({ success: false, error: 'Criterion not found' });
        }
        res.status(200).json({ success: true, data: criterion });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteCriterion = async (req: Request, res: Response) => {
    try {
        const criterion = await Criterion.findByIdAndDelete(req.params.id);
        if (!criterion) {
            return res.status(404).json({ success: false, error: 'Criterion not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
