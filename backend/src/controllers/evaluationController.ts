import { Request, Response } from 'express';
import EvaluationResponse from '../models/EvaluationResponse';
import ScheduleWindow from '../models/ScheduleWindow';
import { IRequest } from '../middleware/auth';

// @desc    Submit an evaluation response
// @route   POST /api/evaluations
// @access  Authenticated users (students, teachers, etc.)
export const submitEvaluation = async (req: IRequest, res: Response) => {
  const { form, subject, course, period, answers } = req.body;
  const evaluator = req.user!._id;

  try {
    // Check if there is an active schedule window for the given period
    const now = new Date();
    const activeWindow = await ScheduleWindow.findOne({
      period,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!activeWindow) {
      return res.status(400).json({ success: false, error: 'The evaluation window for this period is not active.' });
    }

    // A more robust implementation would also check:
    // 1. If the user has already submitted an evaluation for this subject/course/period.
    // 2. If the user is actually assigned to evaluate the subject (e.g., enrolled in the course).

    const response = await EvaluationResponse.create({
      form,
      evaluator,
      subject,
      course,
      period,
      answers,
      // totalScore would be calculated here or in a pre-save hook based on answers
    });

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
