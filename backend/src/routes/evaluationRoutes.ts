import { Router } from 'express';
import { submitEvaluation } from '../controllers/evaluationController';
import { protect } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = Router();

// All routes in this file are protected
router.use(protect);

// POST /api/evaluations - Submit an evaluation response
router.post('/', audit('EVALUATION_SUBMIT'), submitEvaluation);

export default router;
