import { Router } from 'express';
import { getComplaints, createComplaint, updateComplaint } from '../controllers/complaintController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../../../types';
import { body } from 'express-validator';
import { validate } from '../middleware/validators';

const router = Router();

router.use(protect);

router.get('/', authorize(UserRole.Admin, UserRole.DepartmentHead), getComplaints);
router.post('/', authorize(UserRole.Student),
    [
        body('subject').notEmpty().withMessage('Subject is required').trim().escape(),
        body('message').notEmpty().withMessage('Message is required').trim().escape(),
    ],
    validate,
    createComplaint
);
router.put('/:id', authorize(UserRole.Admin, UserRole.DepartmentHead), updateComplaint);

export default router;
