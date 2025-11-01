import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { IRequest } from '../middleware/auth';
import User from '../models/User';
import { UserRole } from '../types';

// @desc    Get all admin users
// @route   GET /api/superadmin/admins
// @access  Private (SuperAdmin)
export const getAdmins = asyncHandler(async (req: IRequest, res: Response) => {
    const admins = await User.find({ role: UserRole.Admin, deleted: { $ne: true } });
    res.status(200).json({ success: true, data: admins });
});

// @desc    Create a new admin user
// @route   POST /api/superadmin/admins
// @access  Private (SuperAdmin)
export const createAdmin = asyncHandler(async (req: IRequest, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role: UserRole.Admin,
    });

    if (user) {
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            }
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Update an admin user
// @route   PUT /api/superadmin/admins/:id
// @access  Private (SuperAdmin)
export const updateAdmin = asyncHandler(async (req: IRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }
        const updatedUser = await user.save();
        res.json({ success: true, data: updatedUser });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete an admin user
// @route   DELETE /api/superadmin/admins/:id
// @access  Private (SuperAdmin)
export const deleteAdmin = asyncHandler(async (req: IRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.deleted = true;
        await user.save();
        res.json({ success: true, message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
