import { Router } from 'express';
import { getEvaluationPeriods, getEvaluationPeriod, createEvaluationPeriod, updateEvaluationPeriod, deleteEvaluationPeriod, getActiveEvaluationPeriods } from '../controllers/evaluationPeriodController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';
import { body } from 'express-validator';
import { validate } from '../middleware/validators';

const router = Router();

router.use(protect);

router.get('/', getEvaluationPeriods);
router.get('/active', getActiveEvaluationPeriods);
router.get('/:id', getEvaluationPeriod);
router.post('/', authorize(UserRole.Admin, UserRole.DepartmentHead),
    [
        body('name').notEmpty().withMessage('Period name is required').trim().escape(),
        body('startDate').isISO8601().withMessage('Start date is required'),
        body('endDate').isISO8601().withMessage('End date is required'),
        body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    ],
    validate,
    createEvaluationPeriod
);
router.put('/:id', authorize(UserRole.Admin, UserRole.DepartmentHead),
    [
        body('name').notEmpty().withMessage('Period name is required').trim().escape(),
        body('startDate').isISO8601().withMessage('Start date is required'),
        body('endDate').isISO8601().withMessage('End date is required'),
        body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    ],
    validate,
    updateEvaluationPeriod
);
router.delete('/:id', authorize(UserRole.Admin, UserRole.DepartmentHead), deleteEvaluationPeriod);

export default router;
