import { Request, Response } from 'express';
import { IRequest } from '../middleware/auth';
import Complaint from '../models/Complaint';
import User from '../models/User';
import Notification from '../models/Notification';
import { ComplaintStatus, UserRole } from '../types';

// GET /complaints
export const getComplaints = async (req: IRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Admins see all complaints. DepartmentHead sees complaints submitted by users in their department. Others see only their own.
        let filter: any = {};
        if (req.user && req.user.role === UserRole.Admin) {
            filter = {};
        } else if (req.user && req.user.role === UserRole.DepartmentHead) {
            filter = { 'submitter': { $exists: true } };
            // we'll filter by submitter's department after populating, but to keep paging simple we'll join via aggregation
            // however, for simplicity perform a two-step: find users in dept, then filter
            const usersInDept = await User.find({ department: req.user!.department }).select('_id').lean();
            const ids = usersInDept.map(u => u._id);
            filter = { submitter: { $in: ids } };
        } else {
            filter = { submitter: req.user!._id };
        }

        const complaints = await Complaint.find(filter).populate('submitter', 'firstName lastName email').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Complaint.countDocuments(filter);

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

// POST /complaints
export const createComplaint = async (req: IRequest, res: Response) => {
    try {
        const { subject, message, attachments } = req.body;
        const submitterId = req.user!._id;
        const complaint = new Complaint({ subject, message, submitter: submitterId, attachments });
        await complaint.save();

        // Notify all admins and department heads for the submitter's department
        const admins = await User.find({ role: UserRole.Admin });
        const deptHeads = await User.find({ role: UserRole.DepartmentHead, department: (req.user as any).department });
        const notifyTargets = [...admins, ...deptHeads];
        await Promise.all(notifyTargets.map(async (a) => {
            try {
                await Notification.create({ user: a._id, message: `New complaint submitted: ${subject}` });
            } catch (e) {
                console.error('Failed to create notification', e);
            }
        }));

        res.status(201).json({ success: true, data: complaint });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// PATCH /complaints/:id/respond
export const respondToComplaint = async (req: IRequest, res: Response) => {
    try {
        const { responseText, status } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, error: 'Complaint not found' });

        // If DepartmentHead, ensure complaint submitter is in their department
        const reqUser: any = req.user;
        if (reqUser && reqUser.role === UserRole.DepartmentHead) {
            const submitter = await User.findById(complaint.submitter).select('department');
            if (!submitter || String(submitter.department) !== String(reqUser.department)) {
                return res.status(403).json({ success: false, error: 'Not authorized to respond to this complaint' });
            }
        }

        complaint.response = responseText || complaint.response;
        if (status) complaint.status = status;
        await complaint.save();

        // Notify submitter
        try {
            await Notification.create({ user: complaint.submitter, message: `Response to your complaint: ${complaint.subject}` });
        } catch (e) {
            console.error('Failed to create notification for submitter', e);
        }

        res.status(200).json({ success: true, data: complaint });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateComplaint = async (req: IRequest, res: Response) => {
    try {
        const { status, assignedTo } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }
        const reqUser: any = req.user;
        if (reqUser && reqUser.role === UserRole.DepartmentHead) {
            const submitter = await User.findById(complaint.submitter).select('department');
            if (!submitter || String(submitter.department) !== String(reqUser.department)) {
                return res.status(403).json({ success: false, error: 'Not authorized to update this complaint' });
            }
        }
        complaint.status = status || complaint.status;
        complaint.assignedTo = assignedTo || complaint.assignedTo;
        await complaint.save();
        res.status(200).json({ success: true, data: complaint });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
