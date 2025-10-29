import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { IRequest } from '../middleware/auth';
import User from '../models/User';

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
export const getMe = asyncHandler(async (req: IRequest, res: Response) => {
  // The user object is attached to the request by the 'protect' middleware.
  const user = req.user;

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req: IRequest, res: Response) => {
    const users = await User.find({});
    res.status(200).json({
        success: true,
        data: users,
    });
});
