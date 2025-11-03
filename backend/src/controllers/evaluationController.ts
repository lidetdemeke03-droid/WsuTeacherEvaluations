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


// @desc    Get assigned evaluation forms for a student
// @route   GET /api/evaluations/assigned
// @access  Private (Student)
export const getAssignedForms = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.query.studentId as string;

    // Find all evaluations assigned to the student that are not yet completed
    const assignedEvaluations = await Evaluation.find({
        student: studentId,
        status: 'Pending',
    }).populate('course teacher');

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

    // Calculate total score
    const ratedAnswers = answers.filter((a: any) => typeof a.score === 'number' && a.score >= 1 && a.score <= 5);
    const totalScore = ratedAnswers.length > 0 ? ratedAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / ratedAnswers.length : 0;

    // Create new evaluation response
    const response = await EvaluationResponse.create({
        anonymousToken,
        course: courseId,
        teacher: teacherId,
        period,
        answers,
        totalScore,
    });

    // Update StatsCache atomically
    await StatsCache.findOneAndUpdate(
        { teacher: teacherId, course: courseId, period },
        [
            {
                $set: {
                    studentSubmissionCount: { $add: ["$studentSubmissionCount", 1] },
                    studentScoreSum: { $add: ["$studentScoreSum", totalScore] },
                }
            },
            {
                $set: {
                    studentAvg: { $divide: ["$studentScoreSum", "$studentSubmissionCount"] },
                }
            },
            {
                $set: {
                    finalScore: {
                        $add: [
                            { $multiply: ["$studentAvg", 0.5] },
                            { $multiply: ["$peerAvg", 0.35] },
                            { $multiply: ["$deptAvg", 0.15] }
                        ]
                    }
                }
            }
        ],
        { upsert: true, new: true }
    );


    res.status(201).json({ success: true, data: response });
});

// @desc    Create an evaluation assignment
// @route   POST /api/evaluations/assign
// @access  Private (Admin)
export const createEvaluationAssignment = asyncHandler(async (req: Request, res: Response) => {
    const { studentId, courseId, teacherId } = req.body;

    const assignment = await Evaluation.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
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

    // Calculate total score
    const ratedAnswers = answers.filter((a: any) => typeof a.score === 'number');
    const totalScore = ratedAnswers.length > 0 ? ratedAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / ratedAnswers.length : 0;

    // Create new evaluation response
    const response = await EvaluationResponse.create({
        type: EvaluationType.DepartmentHead,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        period,
        answers,
        totalScore,
    });

    // Update StatsCache with deptAvg
    const stats = await StatsCache.findOneAndUpdate(
        { teacher: teacherId, period, course: courseId },
        { 
            $set: { deptAvg: totalScore }
        },
        { upsert: true, new: true }
    );

    // Recalculate final score
    if (stats) {
        const finalScore = (stats.studentAvg * 0.5) + (stats.peerAvg * 0.35) + (stats.deptAvg * 0.15);
        stats.finalScore = finalScore;
        await stats.save();
    }

    res.status(201).json({ success: true, data: response });
});
