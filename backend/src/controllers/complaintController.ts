import { Request, Response } from 'express';
import Complaint from '../models/Complaint';

export const getComplaints = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const complaints = await Complaint.find().populate('student', 'name').skip(skip).limit(limit);
        const total = await Complaint.countDocuments();

        res.status(200).json({
            success: true,
            data: complaints,
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

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const { subject, message } = req.body;
        const studentId = (req as any).user._id;
        const complaint = new Complaint({ subject, message, student: studentId });
        await complaint.save();
        res.status(201).json({ success: true, data: complaint });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateComplaint = async (req: Request, res: Response) => {
    try {
        const { status, assignedTo } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status, assignedTo }, { new: true, runValidators: true });
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }
        res.status(200).json({ success: true, data: complaint });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
