import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitEvaluation, getAssignedForms, createEvaluationAssignment, submitDepartmentEvaluation, submitPeerEvaluation } from '../controllers/evaluationController';
import { protect } from '../middleware/auth';
import { audit } from '../middleware/audit';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

const evaluationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many submissions, please wait a moment',
});

// All routes in this file are protected
router.use(protect);

// GET /api/evaluations/assigned - Get assigned evaluation forms for a student or teacher (peer evaluations)
router.get('/assigned', authorize(UserRole.Student, UserRole.Teacher), getAssignedForms);

// POST /api/evaluations/student - Submit a student evaluation response
router.post('/student', evaluationLimiter, authorize(UserRole.Student), audit('EVALUATION_SUBMIT'), submitEvaluation);

// POST /api/evaluations/department - Submit a department head evaluation response
router.post('/department', authorize(UserRole.DepartmentHead), submitDepartmentEvaluation);

// POST /api/evaluations/peer - Submit a peer (teacher) evaluation response
router.post('/peer', evaluationLimiter, authorize(UserRole.Teacher), submitPeerEvaluation);

// POST /api/evaluations/assign - Create an evaluation assignment
router.post('/assign', authorize(UserRole.Admin), createEvaluationAssignment);

export default router;
