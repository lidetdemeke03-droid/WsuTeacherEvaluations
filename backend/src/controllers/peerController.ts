import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import PeerAssignment from '../models/PeerAssignment';
import EvaluationResponse from '../models/EvaluationResponse';
import StatsCache from '../models/StatsCache';
import { EvaluationType } from '../types';
import { IRequest } from '../middleware/auth';

// @desc    Get peer evaluation assignments for a teacher
// @route   GET /api/peers/:teacherId/assignments
// @access  Private (Teacher)
export const getPeerAssignments = asyncHandler(async (req: Request, res: Response) => {
    const assignments = await PeerAssignment.find({ evaluator: req.params.teacherId }).populate('targetTeacher', 'firstName lastName').populate('course', 'title code');
    res.json(assignments);
});

// @desc    Submit a peer evaluation
// @route   POST /api/peers/evaluations
// @access  Private (Teacher)
export const submitPeerEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { teacherId, courseId, answers } = req.body;
    const evaluatorId = req.user!._id;

    // 1. Check for a valid peer assignment
    const assignment = await PeerAssignment.findOne({
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        course: courseId,
        active: true,
    });

    if (!assignment) {
        res.status(403);
        throw new Error('You are not assigned to evaluate this peer.');
    }

    // 2. Prevent duplicate submissions
    const existingResponse = await EvaluationResponse.findOne({
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        course: courseId,
        type: EvaluationType.Peer,
    });

    if (existingResponse) {
        res.status(400);
        throw new Error('You have already submitted a peer evaluation for this course.');
    }

    // 3. Handle conflict of interest
    const isConflict = answers.some((a: any) => a.conflict === true);
    let totalScore = 0;

    if (!isConflict) {
        // 4. Calculate total score
        const ratedAnswers = answers.filter((a: any) => typeof a.score === 'number');
        totalScore = ratedAnswers.length > 0 ? ratedAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / ratedAnswers.length : 0;
    }

    const response = await EvaluationResponse.create({
        type: EvaluationType.Peer,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        course: courseId,
        period: assignment.window.start.toISOString().substring(0, 7), // e.g., "2025-10"
        answers,
        totalScore,
    });

    // 5. Update StatsCache
    if (!isConflict) {
        const stats = await StatsCache.findOneAndUpdate(
            { teacher: teacherId, course: courseId, period: assignment.window.start.toISOString().substring(0, 7) },
            { $inc: { peerSubmissionCount: 1, peerScoreSum: totalScore } },
            { upsert: true, new: true }
        );

        if (stats) {
            const newPeerAvg = stats.peerScoreSum / stats.peerSubmissionCount;
            stats.peerAvg = newPeerAvg;

            // Recalculate final score
            const finalScore = (stats.studentAvg * 0.5) + (newPeerAvg * 0.35) + (stats.deptAvg * 0.15);
            stats.finalScore = finalScore;
            await stats.save();
        }
    }

    res.status(201).json({ success: true, data: response });
});
