import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { IRequest } from '../middleware/auth';
import User from '../models/User';
import { UserRole } from '../types';

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
export const getMe = asyncHandler(async (req: IRequest, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

// @desc    Update current user's profile
// @route   PATCH /api/users/me
// @access  Private
export const updateProfile = asyncHandler(async (req: IRequest, res: Response) => {
    const user = await User.findById(req.user!._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const { firstName, lastName, email, department, avatar, gender } = req.body;

    if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) {
            res.status(400);
            throw new Error('Email already in use');
        }
        user.email = email;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.department = department || user.department;
    if (typeof avatar !== 'undefined') user.avatar = avatar;
    if (typeof gender !== 'undefined') user.gender = gender;

    const updated = await user.save();
    const resp: any = updated.toObject();
    delete resp.password;
    res.status(200).json({ success: true, data: resp });
});

// @desc    Change current user's password
// @route   POST /api/users/me/change-password
// @access  Private
export const changePassword = asyncHandler(async (req: IRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Current and new passwords are required');
    }

    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const match = await user.comparePassword(currentPassword);
    if (!match) {
        res.status(400);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req: IRequest, res: Response) => {
    // If requester is Admin, hide Admin and SuperAdmin users from the list
    const baseFilter: any = { deleted: { $ne: true } };
    if (req.user && req.user.role === UserRole.Admin) {
        baseFilter.role = { $nin: [UserRole.Admin, UserRole.SuperAdmin] };
    }
    const users = await User.find(baseFilter).populate('department');
    res.status(200).json({ success: true, data: users });
});

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req: IRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent Admins from updating Admin or SuperAdmin users
    if (req.user && req.user.role === UserRole.Admin && (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin)) {
        res.status(403);
        throw new Error('Insufficient permissions to update this user');
    }

    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.department = req.body.department || user.department;
    if (req.body.password) {
        user.password = req.body.password;
    }
    const updatedUser = await user.save();
    res.json({ success: true, data: updatedUser });
});

// @desc    Delete a user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req: IRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent Admins from deleting Admin or SuperAdmin users
    if (req.user && req.user.role === UserRole.Admin && (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin)) {
        res.status(403);
        throw new Error('Insufficient permissions to delete this user');
    }

    // Prevent SuperAdmin from deleting themselves
    if (req.user && req.user.role === UserRole.SuperAdmin && String(req.user._id) === String(user._id)) {
        res.status(400);
        throw new Error('SuperAdmin cannot delete themselves');
    }

    user.deleted = true;
    await user.save();
    res.json({ success: true, message: 'User removed' });
});
