import { Request, Response } from 'express';
import Department from '../models/Department';
import User from '../models/User';
import { UserRole } from '../types';

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const departments = await Department.find().skip(skip).limit(limit);
        const total = await Department.countDocuments();

        res.status(200).json({
            success: true,
            data: departments,
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

export const getDepartment = async (req: Request, res: Response) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }
        res.status(200).json({ success: true, data: department });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { name, code } = req.body;
        const department = new Department({ name, code });
        await department.save();
        res.status(201).json({ success: true, data: department });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const { name, code } = req.body;
        const department = await Department.findByIdAndUpdate(req.params.id, { name, code }, { new: true, runValidators: true });
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }
        res.status(200).json({ success: true, data: department });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getDepartmentTeachers = async (req: Request, res: Response) => {
    try {
        const teachers = await User.find({ department: req.params.id, role: UserRole.Teacher });
        res.status(200).json({ success: true, data: teachers });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
