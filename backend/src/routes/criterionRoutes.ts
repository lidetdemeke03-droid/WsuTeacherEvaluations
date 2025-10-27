import { Router } from 'express';
import { getCriteria, getCriterion, createCriterion, updateCriterion, deleteCriterion } from '../controllers/criterionController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';
import { body } from 'express-validator';
import { validate } from '../middleware/validators';

const router = Router();

router.use(protect);

router.get('/', getCriteria);
router.get('/:id', getCriterion);
router.post('/', authorize(UserRole.Admin), body('text').notEmpty().withMessage('Criterion text is required').trim().escape(), validate, createCriterion);
router.put('/:id', authorize(UserRole.Admin), body('text').notEmpty().withMessage('Criterion text is required').trim().escape(), validate, updateCriterion);
router.delete('/:id', authorize(UserRole.Admin), deleteCriterion);

export default router;
