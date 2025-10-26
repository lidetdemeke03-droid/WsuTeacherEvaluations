import { Request, Response } from 'express';
import User from '../models/User';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find({ deleted: false }).skip(skip).limit(limit);
        const total = await User.countDocuments({ deleted: false });

        res.status(200).json({
            success: true,
            data: users,
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

export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.deleted) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { name, email, role, department } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { name, email, role, department }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent self-delete
        const currentUser = (req as any).user;
        if (currentUser._id.toString() === user._id.toString()) {
            return res.status(400).json({ success: false, error: 'You cannot delete yourself' });
        }

        user.deleted = true;
        await user.save();

        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
