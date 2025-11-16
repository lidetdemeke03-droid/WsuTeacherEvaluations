import { Request, Response } from 'express';
import { createHash } from 'crypto';
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


// @desc    Submit a peer evaluation
// @route   POST /api/peers/evaluations
// @access  Private (Teacher)
export const submitPeerEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { courseId, teacherId, period, answers } = req.body;
    const evaluatorId = req.user!._id;

    // Check for a valid peer assignment
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

    // Prevent duplicate peer submissions
    const existingResponse = await EvaluationResponse.findOne({ evaluator: evaluatorId, targetTeacher: teacherId, period, type: EvaluationType.Peer });
    if (existingResponse) {
        res.status(400);
        throw new Error('You have already submitted a peer evaluation for this teacher for this period.');
    }

    // Defensive: detect answers coming from the wrong form (e.g., student form submitted to peer endpoint)
    const providedCodes = (answers || []).map((a: any) => String(a.questionCode || '').toUpperCase());
    const looksLikeStudent = providedCodes.some((c: string) => c.startsWith('STU_'));
    if (looksLikeStudent) {
        // Provide a clear message so frontend can guide the user
        res.status(400);
        throw new Error('It appears you submitted the student evaluation form. Please complete the peer evaluation form for teacher-to-teacher evaluation.');
    }

    // Validate that all rating questions for the peer form have a score
    const ratingQuestions = peerEvaluationQuestions.filter(q => q.type === 'rating');
    for (const question of ratingQuestions) {
        const answer = answers.find((a: any) => a.questionCode === question.code);
        if (!answer || answer.score === undefined) {
            res.status(400);
            throw new Error(`Please provide a score or select 'NA' for the question: "${question.text}"`);
        }
    }

    const totalRatingQuestions = peerEvaluationQuestions.filter(q => q.type === 'rating').length;
    const normalizedScore = calculateNormalizedScore(answers, totalRatingQuestions);

    // Generate anonymous token to avoid null unique-index collisions
    const hash = createHash('sha256');
    hash.update(`${courseId}:${teacherId}:${period}:${evaluatorId}`);
    const anonymousToken = hash.digest('hex');

    const response = await EvaluationResponse.create({
        type: EvaluationType.Peer,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        anonymousToken,
        course: courseId,
        period,
        answers,
        totalScore: normalizedScore,
    });

    // Update StatsCache peer score
    const peerEvals = await EvaluationResponse.find({ targetTeacher: teacherId, course: courseId, period, type: EvaluationType.Peer });
    const avgPeerScore = peerEvals.length ? peerEvals.reduce((sum, ev) => sum + ev.totalScore, 0) / peerEvals.length : 0;

    const stats = await StatsCache.findOneAndUpdate(
        { teacher: teacherId, course: courseId, period },
        { $set: { peerScore: avgPeerScore } },
        { upsert: true, new: true }
    );

    await recalculateFinalScore(stats._id);

    // If there is a PeerAssignment for this evaluator->target, mark it inactive (completed)
    try {
        await PeerAssignment.findOneAndUpdate(
            { evaluator: evaluatorId, targetTeacher: teacherId, course: courseId, active: true },
            { $set: { active: false } }
        );
    } catch (e) {
        // Non-fatal: assignment may not exist if peer flow wasn't used
        console.error('Failed to mark peer assignment as completed', e);
    }

    res.status(201).json({ success: true, data: response });
});
