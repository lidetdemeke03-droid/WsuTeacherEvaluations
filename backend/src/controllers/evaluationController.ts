import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import EvaluationResponse from '../models/EvaluationResponse';
import ScheduleWindow from '../models/ScheduleWindow';
import { IRequest } from '../middleware/auth';
import User from '../models/User';
import Evaluation from '../models/evaluationModel';
import { createHash } from 'crypto';
import StatsCache from '../models/StatsCache';
import { EvaluationType } from '../types';
import { calculateNormalizedScore, recalculateFinalScore } from '../services/scoreService';
import { studentEvaluationQuestions, departmentHeadEvaluationQuestions } from '../constants/forms';


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
    const studentEvals = await EvaluationResponse.find({ teacher: teacherId, course: courseId, period });
    const avgStudentScore = studentEvals.reduce((sum, ev) => sum + ev.totalScore, 0) / studentEvals.length;


    // Update StatsCache and recalculate final score
    const stats = await StatsCache.findOneAndUpdate(
        { teacher: teacherId, course: courseId, period },
        { $set: { studentScore: avgStudentScore } },
        { upsert: true, new: true }
    );

    await recalculateFinalScore(stats._id);

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

    // Validate that all rating questions have a score
    const ratingQuestions = studentEvaluationQuestions.filter(q => q.type === 'rating');
    for (const question of ratingQuestions) {
        const answer = answers.find((a: any) => a.questionCode === question.code);
        if (!answer || answer.score === undefined) {
            res.status(400);
            throw new Error(`Please provide a score or select 'NA' for the question: "${question.text}"`);
        }
    }

    const totalRatingQuestions = studentEvaluationQuestions.filter(q => q.type === 'rating').length;
    const normalizedScore = calculateNormalizedScore(answers, totalRatingQuestions);

    const response = await EvaluationResponse.create({
        type: EvaluationType.Peer,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        course: courseId,
        period,
        answers,
        totalScore: normalizedScore,
    });

    // Update StatsCache peer score
    const peerEvals = await EvaluationResponse.find({ targetTeacher: teacherId, course: courseId, period, type: EvaluationType.Peer });
    const avgPeerScore = peerEvals.reduce((sum, ev) => sum + ev.totalScore, 0) / (peerEvals.length || 1);

    const stats = await StatsCache.findOneAndUpdate(
        { teacher: teacherId, course: courseId, period },
        { $set: { peerScore: avgPeerScore } },
        { upsert: true, new: true }
    );

    await recalculateFinalScore(stats._id);

    res.status(201).json({ success: true, data: response });
});

// @desc    Create an evaluation assignment
// @route   POST /api/evaluations/assign
// @access  Private (Admin)
export const createEvaluationAssignment = asyncHandler(async (req: Request, res: Response) => {
    const { student, courseId, teacherId, periodId } = req.body;

    // Check if an evaluation assignment already exists for this combination
    const existingAssignment = await Evaluation.findOne({
        student,
        course: courseId,
        teacher: teacherId,
    });

    if (existingAssignment) {
        res.status(409).json({
            success: false,
            error: 'This evaluation has already been assigned to this student.',
        });
        return;
    }

    const assignment = await Evaluation.create({
        student,
        course: courseId,
        teacher: teacherId,
        period: periodId,
    });

    res.status(201).json({ success: true, data: assignment });
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

    // Create new evaluation response
    const response = await EvaluationResponse.create({
        type: EvaluationType.DepartmentHead,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
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
