import { Router } from 'express';
import { getEvaluationPeriods, getEvaluationPeriod, createEvaluationPeriod, updateEvaluationPeriod, deleteEvaluationPeriod } from '../controllers/evaluationPeriodController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';
import { body } from 'express-validator';
import { validate } from '../middleware/validators';

const router = Router();

router.use(protect);

router.get('/', getEvaluationPeriods);
router.get('/:id', getEvaluationPeriod);
router.post('/', authorize(UserRole.Admin),
    [
        body('name').notEmpty().withMessage('Period name is required').trim().escape(),
        body('startDate').isISO8601().withMessage('Start date is required'),
        body('endDate').isISO8601().withMessage('End date is required'),
    ],
    validate,
    createEvaluationPeriod
);
router.put('/:id', authorize(UserRole.Admin),
    [
        body('name').notEmpty().withMessage('Period name is required').trim().escape(),
        body('startDate').isISO8601().withMessage('Start date is required'),
        body('endDate').isISO8601().withMessage('End date is required'),
    ],
    validate,
    updateEvaluationPeriod
);
router.delete('/:id', authorize(UserRole.Admin), deleteEvaluationPeriod);

export default router;
