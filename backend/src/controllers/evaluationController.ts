import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import EvaluationResponse from '../models/EvaluationResponse';
import { IRequest } from '../middleware/auth';
import User from '../models/User';
import Evaluation from '../models/evaluationModel';
import { createHash } from 'crypto';
import StatsCache from '../models/StatsCache';
import { EvaluationType } from '../types';
import { calculateNormalizedScore, recalculateFinalScore } from '../services/scoreService';
import { studentEvaluationQuestions, departmentHeadEvaluationQuestions, peerEvaluationQuestions } from '../constants/forms';


// @desc    Get assigned evaluation forms for a student
// @route   GET /api/evaluations/assigned
// @access  Private (Student)
export const getAssignedForms = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.query.studentId as string;

    // Find all evaluations assigned to the student that are not yet completed
    const assignedEvaluations = await Evaluation.find({
        student: studentId,
        status: 'Pending',
    }).populate({
        path: 'course',
        model: 'Course',
    }).populate({
        path: 'teacher',
        model: 'User',
        select: 'firstName lastName',
    }).populate('period');

    res.json({
        success: true,
        data: assignedEvaluations,
    });
});

// @desc    Submit a student evaluation response
// @route   POST /api/evaluations/student
// @access  Private (Student)
export const submitEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { courseId, teacherId, period, answers } = req.body;
    const studentObjectId = req.user!._id;

    // Generate anonymous token
    const hash = createHash('sha256');
    hash.update(`${courseId}:${teacherId}:${period}:${studentObjectId}`);
    const anonymousToken = hash.digest('hex');

    // Check for duplicate submission
    const existingResponse = await EvaluationResponse.findOne({ anonymousToken });
    if (existingResponse) {
        res.status(400);
        throw new Error('You have already submitted an evaluation for this course and period.');
    }

    // Basic defensive check: ensure the payload looks like the student form
    const providedCodes = (answers || []).map((a: any) => String(a.questionCode || '').toUpperCase());
    const expectedStudentCodes = studentEvaluationQuestions.map(q => q.code.toUpperCase());
    const looksLikePeer = providedCodes.some((c: string) => c.startsWith('PEER_'));
    if (looksLikePeer) {
        res.status(400);
        throw new Error('It appears you submitted a peer evaluation to the student endpoint. Please submit using the correct peer evaluation form.');
    }

    // Validate that all rating questions have a score
    const ratingQuestions = studentEvaluationQuestions.filter(q => q.type === 'rating');
    for (const question of ratingQuestions) {
        const answer = answers.find((a: any) => a.questionCode === question.code);
        if (!answer || answer.score === undefined) {
            res.status(400);
            throw new Error(`Please provide a score or select 'NA' for the question: "${question.text}"`);
        }
    }

    // Calculate normalized score
    const totalRatingQuestions = studentEvaluationQuestions.filter(q => q.type === 'rating').length;
    const normalizedScore = calculateNormalizedScore(answers, totalRatingQuestions);

    // Create new evaluation response
    const response = await EvaluationResponse.create({
        type: EvaluationType.Student,
        evaluator: studentObjectId,
        targetTeacher: teacherId,
        anonymousToken,
        course: courseId,
        period,
        answers,
        totalScore: normalizedScore,
    });

    // Atomically find or create the StatsCache document and get the average student score
    // Use the correct field name `targetTeacher` and safely compute the average
    const studentEvals = await EvaluationResponse.find({ targetTeacher: teacherId, course: courseId, period });
    const avgStudentScore = studentEvals.length ? studentEvals.reduce((sum, ev) => sum + ev.totalScore, 0) / studentEvals.length : 0;


    // Update StatsCache and recalculate final score
    const stats = await StatsCache.findOneAndUpdate(
        { teacher: teacherId, course: courseId, period },
        { $set: { studentScore: avgStudentScore } },
        { upsert: true, new: true }
    );

    await recalculateFinalScore(stats._id);

    // Mark the evaluation assignment as completed to prevent re-submission
    try {
        await Evaluation.findOneAndUpdate(
            { student: studentObjectId, course: courseId, teacher: teacherId, period },
            { $set: { status: 'Completed' } }
        );
    } catch (e) {
        console.error('Failed to mark evaluation assignment as completed', e);
    }

    res.status(201).json({ success: true, data: response });
});

// @desc    Submit a peer (teacher) evaluation response
// @route   POST /api/evaluations/peer
// @access  Private (Teacher)
export const submitPeerEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { courseId, teacherId, period, answers } = req.body;
    const evaluatorId = req.user!._id;

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
        const PeerAssignment = (await import('../models/PeerAssignment')).default;
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

// @desc    Create evaluation assignments for multiple evaluators
// @route   POST /api/evaluations/assign
// @access  Private (Admin)
export const createEvaluationAssignment = asyncHandler(async (req: Request, res: Response) => {
    const { evaluatorIds, courseId, teacherId, periodId, evaluationType, window } = req.body;

    if (!Array.isArray(evaluatorIds) || evaluatorIds.length === 0) {
        res.status(400);
        throw new Error('At least one evaluator ID is required.');
    }

    if (evaluationType === EvaluationType.Peer) {
        if (!window || !window.start || !window.end) {
            res.status(400);
            throw new Error('Window start and end dates are required for peer assignments.');
        }
        const PeerAssignment = (await import('../models/PeerAssignment')).default;
        const assignments = [];
        for (const evaluatorId of evaluatorIds) {
            const existingAssignment = await PeerAssignment.findOne({
                evaluator: evaluatorId,
                targetTeacher: teacherId,
                course: courseId,
                period: periodId,
            });

            if (existingAssignment) {
                console.warn(`Peer assignment already exists for evaluator ${evaluatorId}, teacher ${teacherId}, course ${courseId}, period ${periodId}. Skipping.`);
                continue;
            }

            assignments.push({
                evaluator: evaluatorId,
                targetTeacher: teacherId,
                course: courseId,
                period: periodId,
                active: true,
                window: {
                    start: window.start,
                    end: window.end,
                },
            });
        }
        if (assignments.length > 0) {
            await PeerAssignment.insertMany(assignments);
        }
        res.status(201).json({ success: true, message: `${assignments.length} peer assignments created successfully.` });

    } else if (evaluationType === EvaluationType.Student) {
        const assignments = [];
        for (const evaluatorId of evaluatorIds) {
            const existingAssignment = await Evaluation.findOne({
                student: evaluatorId,
                course: courseId,
                teacher: teacherId,
                period: periodId,
            });

            if (existingAssignment) {
                console.warn(`Student assignment already exists for student ${evaluatorId}, teacher ${teacherId}, course ${courseId}, period ${periodId}. Skipping.`);
                continue;
            }

            assignments.push({
                student: evaluatorId,
                course: courseId,
                teacher: teacherId,
                period: periodId,
            });
        }
        if (assignments.length > 0) {
            await Evaluation.insertMany(assignments);
        }
        res.status(201).json({ success: true, message: `${assignments.length} student assignments created successfully.` });
    } else {
        res.status(400);
        throw new Error('Invalid evaluation type provided.');
    }
});

// @desc    Submit a department head evaluation response
// @route   POST /api/evaluations/department
// @access  Private (DepartmentHead)
export const submitDepartmentEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { teacherId, period, answers, courseId } = req.body;
    const evaluatorId = req.user!._id;

    // Check for duplicate submission
    const existingResponse = await EvaluationResponse.findOne({
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        period,
        type: EvaluationType.DepartmentHead,
    });

    if (existingResponse) {
        res.status(400);
        throw new Error('You have already submitted an evaluation for this teacher for this period.');
    }

    // Calculate normalized score
    const totalRatingQuestions = departmentHeadEvaluationQuestions.filter(q => q.type === 'rating').length;
    const normalizedScore = calculateNormalizedScore(answers, totalRatingQuestions);

    // Generate a token for this evaluation (keeps unique index happy)
    const hash = createHash('sha256');
    hash.update(`${courseId}:${teacherId}:${period}:${evaluatorId}`);
    const anonymousToken = hash.digest('hex');

    // Create new evaluation response
    const response = await EvaluationResponse.create({
        type: EvaluationType.DepartmentHead,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        anonymousToken,
        course: courseId,
        period,
        answers,
        totalScore: normalizedScore,
    });

    // Update StatsCache and recalculate final score
    const stats = await StatsCache.findOneAndUpdate(
        { teacher: teacherId, period, course: courseId },
        { $set: { deptHeadScore: normalizedScore } },
        { upsert: true, new: true }
    );

    await recalculateFinalScore(stats._id);

    res.status(201).json({ success: true, data: response });
});
