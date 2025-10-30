import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { IRequest } from '../middleware/auth';
import User from '../models/User';

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

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req: IRequest, res: Response) => {
    const users = await User.find({ deleted: { $ne: true } }).populate('department');
    res.status(200).json({ success: true, data: users });
});

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req: IRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (user) {
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
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete a user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req: IRequest, res: Response) => {
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
