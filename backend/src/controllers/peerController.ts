import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import PeerAssignment from '../models/PeerAssignment';
import EvaluationResponse from '../models/EvaluationResponse';
import StatsCache from '../models/StatsCache';
import { EvaluationType } from '../types';
import { IRequest } from '../middleware/auth';
import { calculateNormalizedScore, recalculateFinalScore } from '../services/scoreService';
import { peerEvaluationQuestions } from '../constants/forms';

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
    let normalizedScore = 0;

    if (!isConflict) {
        const totalRatingQuestions = peerEvaluationQuestions.filter(q => q.type === 'rating').length;
        normalizedScore = calculateNormalizedScore(answers, totalRatingQuestions);
    }

    const response = await EvaluationResponse.create({
        type: EvaluationType.Peer,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        course: courseId,
        period: assignment.period,
        answers,
        totalScore: normalizedScore,
    });

    // 5. Update StatsCache
    if (!isConflict) {
        // Get the average peer score
        const peerEvals = await EvaluationResponse.find({ targetTeacher: teacherId, course: courseId, type: EvaluationType.Peer });
        const avgPeerScore = peerEvals.reduce((sum, ev) => sum + ev.totalScore, 0) / peerEvals.length;

        const stats = await StatsCache.findOneAndUpdate(
            { teacher: teacherId, course: courseId, period: assignment.period },
            { $set: { peerScore: avgPeerScore } },
            { upsert: true, new: true }
        );

        await recalculateFinalScore(stats._id);
    }

    res.status(201).json({ success: true, data: response });
});
