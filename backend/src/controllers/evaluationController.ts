import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import EvaluationResponse from '../models/EvaluationResponse';
import { IRequest } from '../middleware/auth';
import Evaluation from '../models/evaluationModel';
import { createHash } from 'crypto';
import StatsCache from '../models/StatsCache';
import { EvaluationType, IEvaluationQuestion, UserRole } from '../types';
import { calculateNormalizedScore, recalculateFinalScore } from '../services/scoreService';
import { studentEvaluationQuestions, departmentHeadEvaluationQuestions, peerEvaluationQuestions } from '../constants/forms';
import Course from '../models/Course';
import mongoose from 'mongoose';
import PeerAssignment from '../models/PeerAssignment';


/**
 * @private
 * Processes a generic evaluation submission, creates the response document,
 * and correctly updates the centralized StatsCache.
 */
const _processSubmission = async (
    evaluatorId: string,
    teacherId: string,
    courseId: string,
    periodId: string,
    answers: any[],
    evaluationType: EvaluationType,
    questions: IEvaluationQuestion[],
    anonymousToken?: string
) => {
    // 1. Calculate normalized score
    const totalRatingQuestions = questions.filter(q => q.type === 'rating').length;
    const normalizedScore = calculateNormalizedScore(answers, totalRatingQuestions);

    // 2. Create new evaluation response document
    const response = await EvaluationResponse.create({
        type: evaluationType,
        evaluator: evaluatorId,
        targetTeacher: teacherId,
        anonymousToken,
        course: courseId,
        period: periodId,
        answers,
        totalScore: normalizedScore,
    });

    // 3. Correctly update the StatsCache
    const updateField =
        evaluationType === EvaluationType.Student ? 'studentScore' :
        evaluationType === EvaluationType.Peer ? 'peerScore' :
        'deptHeadScore';

    let newScoreValue = 0;
    if (evaluationType === EvaluationType.DepartmentHead) {
        // Dept head score is a direct value, not an average
        newScoreValue = normalizedScore;
    } else {
        // For student and peer, calculate the new average for the entire period
        const allEvaluations = await EvaluationResponse.find({
            targetTeacher: teacherId,
            period: periodId,
            type: evaluationType,
        });
        newScoreValue = allEvaluations.length
            ? allEvaluations.reduce((sum, ev) => sum + ev.totalScore, 0) / allEvaluations.length
            : 0;
    }

    // 4. Find and update the single StatsCache document for the teacher and period
    const stats = await StatsCache.findOneAndUpdate(
        { teacher: teacherId, period: periodId },
        { $set: { [updateField]: newScoreValue } },
        { upsert: true, new: true }
    );

    // 5. Recalculate the final weighted score
    await recalculateFinalScore(stats._id);

    return response;
};


// @desc    Get assigned evaluation forms for a student or teacher
// @route   GET /api/evaluations/assigned
// @access  Private (Student, Teacher)
export const getAssignedForms = asyncHandler(async (req: IRequest, res: Response) => {
    const userId = req.user!._id;
    const userRole = req.user!.role;
    let assignedEvaluations: any[] = [];

    if (userRole === UserRole.Student) {
        assignedEvaluations = await Evaluation.find({ student: userId, status: 'Pending' })
            .populate('course', 'title code')
            .populate('teacher', 'firstName lastName')
            .populate('period', 'name startDate endDate');
    } else if (userRole === UserRole.Teacher) {
        assignedEvaluations = await PeerAssignment.find({ evaluator: userId, active: true })
            .populate('targetTeacher', 'firstName lastName')
            .populate('course', 'title code')
            .populate('period', 'name startDate endDate');
    }

    res.json({ success: true, data: assignedEvaluations });
});

// @desc    Submit a student evaluation response
// @route   POST /api/evaluations/student
// @access  Private (Student)
export const submitEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { courseId, teacherId, period, answers } = req.body;
    const studentId = req.user!._id;

    // 1. Create a unique, anonymous token for the student
    const hash = createHash('sha256').update(`${courseId}:${teacherId}:${period}:${studentId}`).digest('hex');

    // 2. Check for duplicate submission using the anonymous token
    if (await EvaluationResponse.findOne({ anonymousToken: hash })) {
        res.status(400);
        throw new Error('You have already submitted an evaluation for this course and period.');
    }

    // 3. Process the submission
    const response = await _processSubmission(
        studentId,
        teacherId,
        courseId,
        period,
        answers,
        EvaluationType.Student,
        studentEvaluationQuestions,
        hash
    );

    // 4. Mark the original assignment as completed
    await Evaluation.findOneAndUpdate(
        { student: studentId, course: courseId, teacher: teacherId, period },
        { $set: { status: 'Completed' } }
    );

    res.status(201).json({ success: true, data: response });
});

// @desc    Submit a peer (teacher) evaluation response
// @route   POST /api/evaluations/peer
// @access  Private (Teacher)
export const submitPeerEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { courseId, teacherId, period, answers } = req.body;
    const evaluatorId = req.user!._id;

    // 1. Check for duplicate submission
    if (await EvaluationResponse.findOne({ evaluator: evaluatorId, targetTeacher: teacherId, period, type: EvaluationType.Peer })) {
        res.status(400);
        throw new Error('You have already submitted a peer evaluation for this teacher for this period.');
    }

    // 2. Process the submission
    const response = await _processSubmission(
        evaluatorId,
        teacherId,
        courseId,
        period,
        answers,
        EvaluationType.Peer,
        peerEvaluationQuestions
    );

    // 3. Mark the peer assignment as inactive (completed)
    await PeerAssignment.findOneAndUpdate(
        { evaluator: evaluatorId, targetTeacher: teacherId, course: courseId, period, active: true },
        { $set: { active: false } }
    );

    res.status(201).json({ success: true, data: response });
});

// @desc    Submit a department head evaluation response
// @route   POST /api/evaluations/department
// @access  Private (DepartmentHead)
export const submitDepartmentEvaluation = asyncHandler(async (req: IRequest, res: Response) => {
    const { teacherId, period, answers, courseId } = req.body;
    const evaluatorId = req.user!._id;

    // 1. Check for duplicate submission
    if (await EvaluationResponse.findOne({ evaluator: evaluatorId, targetTeacher: teacherId, period, type: EvaluationType.DepartmentHead })) {
        res.status(400);
        throw new Error('You have already submitted an evaluation for this teacher for this period.');
    }

    // 2. Process the submission
    const response = await _processSubmission(
        evaluatorId,
        teacherId,
        courseId,
        period,
        answers,
        EvaluationType.DepartmentHead,
        departmentHeadEvaluationQuestions
    );

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
        if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
            res.status(400);
            throw new Error('A valid teacher ID is required for peer assignments.');
        }
        if (!window || !window.start || !window.end) {
            res.status(400);
            throw new Error('Window start and end dates are required for peer assignments.');
        }
        const assignments = [];
        for (const evaluatorId of evaluatorIds) {
            const existingAssignment = await PeerAssignment.findOne({
                evaluator: evaluatorId,
                targetTeacher: teacherId,
                course: courseId,
                period: periodId,
            });

            if (existingAssignment) {
                console.warn(`Peer assignment already exists for evaluator ${evaluatorId}. Skipping.`);
                continue;
            }

            assignments.push({
                evaluator: evaluatorId,
                targetTeacher: teacherId,
                course: courseId,
                period: periodId,
                active: true,
                window: { start: new Date(window.start), end: new Date(window.end) },
            });
        }
        if (assignments.length > 0) {
            await PeerAssignment.insertMany(assignments);
        }
        res.status(201).json({ success: true, message: `${assignments.length} peer assignments created successfully.` });

    } else if (evaluationType === EvaluationType.Student) {
        await Course.updateOne({ _id: courseId }, { $addToSet: { students: { $each: evaluatorIds } } });

        const assignments = [];
        for (const evaluatorId of evaluatorIds) {
            const existingAssignment = await Evaluation.findOne({
                student: evaluatorId,
                course: courseId,
                teacher: teacherId,
                period: periodId,
            });

            if (existingAssignment) {
                console.warn(`Student assignment already exists for student ${evaluatorId}. Skipping.`);
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
        res.status(201).json({ success: true, message: `${evaluatorIds.length} students assigned and ${assignments.length} evaluation assignments created.` });
    } else {
        res.status(400);
        throw new Error('Invalid evaluation type provided.');
    }
});


// @desc    Get previous department head evaluations
// @route   GET /api/evaluations/department-head-evaluations
// @access  Private (DepartmentHead)
export const getDepartmentHeadEvaluations = asyncHandler(async (req: IRequest, res: Response) => {
    const departmentHeadId = req.user!._id;
    const { teacherId } = req.query;

    const filter: any = { evaluator: departmentHeadId, type: EvaluationType.DepartmentHead };
    if (teacherId) filter.targetTeacher = teacherId;

    const evaluations = await EvaluationResponse.find(filter)
        .populate('targetTeacher', 'firstName lastName')
        .populate('course', 'title code')
        .populate('period', 'name')
        .sort({ submittedAt: -1 });

    res.status(200).json({ success: true, data: evaluations });
});
