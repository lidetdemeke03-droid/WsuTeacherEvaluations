import { body } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export const registerValidation = [
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const loginValidation = [
    body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

export const courseValidation = [
    body('name').notEmpty().withMessage('Course name is required').trim().escape(),
    body('department').isMongoId().withMessage('Valid department ID is required'),
    body('instructor').isMongoId().withMessage('Valid instructor ID is required'),
];

export const evaluationValidation = [
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('scores').isArray({ min: 1 }).withMessage('At least one score is required'),
    body('scores.*.criterionId').isMongoId().withMessage('Valid criterion ID is required'),
    body('scores.*.score').isNumeric().withMessage('Score must be a number'),
];

export const complaintValidation = [
    body('subject').notEmpty().withMessage('Subject is required').trim().escape(),
    body('message').notEmpty().withMessage('Message is required').trim().escape(),
];
