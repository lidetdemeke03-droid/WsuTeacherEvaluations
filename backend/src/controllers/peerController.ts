import { Request, Response } from 'express';
import { createHash } from 'crypto';
import asyncHandler from 'express-async-handler';
import PeerAssignment from '../models/PeerAssignment';
import { IRequest } from '../middleware/auth';

// @desc    Get peer evaluation assignments for a teacher
// @route   GET /api/peers/:teacherId/assignments
// @access  Private (Teacher)
export const getPeerAssignments = asyncHandler(async (req: Request, res: Response) => {
    const assignments = await PeerAssignment.find({ evaluator: req.params.teacherId }).populate('targetTeacher', 'firstName lastName').populate('course', 'title code');
    res.json({ success: true, data: assignments });
});

// @desc    Get details of a specific peer assignment
// @route   GET /api/peers/assignments/:assignmentId
// @access  Private (Teacher)
export const getPeerAssignmentDetails = asyncHandler(async (req: IRequest, res: Response) => {
    const assignment = await PeerAssignment.findById(req.params.assignmentId)
        .populate('targetTeacher', 'firstName lastName')
        .populate('course', 'title code');

    if (!assignment) {
        res.status(404);
        throw new Error('Assignment not found');
    }

    // Security check: ensure the logged-in user is the assigned evaluator
    if (assignment.evaluator.toString() !== req.user!._id.toString()) {
        res.status(403);
        throw new Error('You are not authorized to view this assignment');
    }

    res.json({ success: true, data: assignment });
});
