import { Router } from 'express';
import { getComplaints, createComplaint, updateComplaint, respondToComplaint } from '../controllers/complaintController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';
import { body } from 'express-validator';
import { validate } from '../middleware/validators';

const router = Router();

router.use(protect);

// GET /complaints - Admin/DeptHead see all; others see their own
router.get('/', authorize(UserRole.Admin, UserRole.DepartmentHead, UserRole.Teacher, UserRole.Student), getComplaints);
router.post('/', authorize(UserRole.Student, UserRole.Teacher),
    [
        body('subject').notEmpty().withMessage('Subject is required').trim().escape(),
        body('message').notEmpty().withMessage('Message is required').trim().escape(),
    ],
    validate,
    createComplaint
);
router.post('/:id/respond', authorize(UserRole.Admin, UserRole.DepartmentHead), respondToComplaint);
router.put('/:id', authorize(UserRole.Admin, UserRole.DepartmentHead), updateComplaint);

export default router;
