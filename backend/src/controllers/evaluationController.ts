import { Request, Response } from 'express';
import Evaluation from '../models/Evaluation';
import EvaluationPeriod from '../models/EvaluationPeriod';
import Course from '../models/Course';
import { UserRole } from '../../../types';

export const submitEvaluation = async (req: Request, res: Response) => {
    try {
        const { courseId, scores } = req.body;
        const studentId = (req as any).user._id;

        // BR1: Student Enrollment Validation (Placeholder)
        // In a real application, you would have a model to track student enrollments
        // and you would check if the student is enrolled in the course here.
        const isEnrolled = true; // Placeholder
        if (!isEnrolled) {
            return res.status(403).json({ success: false, error: 'You are not enrolled in this course' });
        }

        // 1. Find the course to get the instructor
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        const instructorId = course.instructor;

        // 2. Check for an active evaluation period
        const activePeriod = await EvaluationPeriod.findOne({ status: 'Active' });
        if (!activePeriod) {
            return res.status(400).json({ success: false, error: 'No active evaluation period' });
        }

        // BR2: Time Windows
        const now = new Date();
        if (now < activePeriod.startDate || now > activePeriod.endDate) {
            return res.status(400).json({ success: false, error: 'The evaluation period is not active' });
        }

        // 3. Check if an evaluation already exists
        const existingEvaluation = await Evaluation.findOne({
            course: courseId,
            student: studentId,
            period: activePeriod._id,
        });

        if (existingEvaluation) {
            return res.status(400).json({ success: false, error: 'You have already submitted an evaluation for this course' });
        }

        // 4. Create and save the new evaluation
        const evaluation = new Evaluation({
            course: courseId,
            student: studentId,
            instructor: instructorId,
            period: activePeriod._id,
            scores,
            submitted: true,
        });

        await evaluation.save();

        res.status(201).json({ success: true, data: evaluation });
    } catch (error: any) {
        // Handle potential duplicate key error from the database index
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Evaluation already submitted.' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getEvaluationsByInstructor = async (req: Request, res: Response) => {
    try {
        const instructorId = req.params.id;
        const currentUser = (req as any).user;

        // Access control: Allow admin, dept head, or the instructor themselves
        if (currentUser.role !== UserRole.Admin &&
            currentUser.role !== UserRole.DepartmentHead &&
            currentUser._id.toString() !== instructorId) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const evaluations = await Evaluation.find({ instructor: instructorId })
            .populate('course', 'name')
            .populate('student', 'name')
            .populate('period', 'name');

        res.status(200).json({ success: true, data: evaluations });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getEvaluationsByCourse = async (req: Request, res: Response) => {
    try {
        const courseId = req.params.id;
        const evaluations = await Evaluation.find({ course: courseId })
            .populate('student', 'name');

        res.status(200).json({ success: true, data: evaluations });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
