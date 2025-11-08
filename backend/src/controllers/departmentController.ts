import { Request, Response } from 'express';
import { IRequest } from '../middleware/auth';
import Department from '../models/Department';
import User from '../models/User';
import { UserRole, EvaluationType } from '../types';
import '../types/express'; // Ensure the custom type is loaded

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const departments = await Department.find().skip(skip).limit(limit).populate('head', 'firstName lastName email role department');
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
        const department = await Department.findById(req.params.id).populate('head', 'firstName lastName email role department');
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
        const { name, code, head } = req.body;

        // head can be a single id or an array of ids
        const headArray: string[] = !head ? [] : Array.isArray(head) ? head : [head];

        const department = new Department({ name, code, head: headArray });
        await department.save();

        // If heads were provided, mark users as department heads and assign their department
        if (headArray.length > 0) {
            await Promise.all(headArray.map(async (userId: string) => {
                try {
                    await User.findByIdAndUpdate(userId, { isDeptHead: true, department: department._id });
                } catch (e) {
                    // continue on error for individual users
                    console.error('Failed to update head user', userId, e);
                }
            }));
        }

        const populatedDept = await Department.findById(department._id).populate('head', 'firstName lastName email role department');

        res.status(201).json({ success: true, data: populatedDept });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const { name, code, head } = req.body;
        const headArray: string[] = !head ? [] : Array.isArray(head) ? head : [head];

        const prevDept = await Department.findById(req.params.id);
        const prevHeads: string[] = (prevDept && prevDept.head) ? prevDept.head.map((h: any) => String(h)) : [];

        const department = await Department.findByIdAndUpdate(req.params.id, { name, code, head: headArray }, { new: true, runValidators: true });
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }

        // unset isDeptHead for users removed from head list
        const removed = prevHeads.filter(h => !headArray.includes(h));
        if (removed.length > 0) {
            await User.updateMany({ _id: { $in: removed } }, { isDeptHead: false });
        }

        // set isDeptHead and assign department for new heads
        const added = headArray.filter(h => !prevHeads.includes(h));
        if (added.length > 0) {
            await User.updateMany({ _id: { $in: added } }, { isDeptHead: true, department: department._id });
        }

        const populated = await Department.findById(department._id).populate('head', 'firstName lastName email role department');
        res.status(200).json({ success: true, data: populated });
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

export const getDepartmentTeachers = async (req: IRequest, res: Response) => {
    try {
        const period = req.query.period as string | undefined;
        const teachers = await User.find({ department: req.params.id, role: UserRole.Teacher });

        // If requester is a department head and a period is provided, mark whether each teacher has been evaluated by this user for the period
        let result: any[] = teachers;
        if (req.user && req.user.role === UserRole.DepartmentHead) {
            const evaluatorId = req.user._id;
            const EvaluationResponse = (await import('../models/EvaluationResponse')).default;
            result = await Promise.all(teachers.map(async (t) => {
                const teacherObj: any = t.toObject();
                if (period) {
                    const exists = await EvaluationResponse.exists({
                        evaluator: evaluatorId, targetTeacher: t._id, type: EvaluationType.DepartmentHead, period
                    });
                    teacherObj.evaluated = !!exists;
                } else {
                    teacherObj.evaluated = false;
                }
                return teacherObj;
            }));
        }

        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
