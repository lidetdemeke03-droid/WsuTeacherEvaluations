import { Router } from 'express';
import { getPeerAssignments, submitPeerEvaluation, getPeerAssignmentDetails } from '../controllers/peerController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

// All routes in this file are protected and restricted to teachers
router.use(protect);
router.use(authorize(UserRole.Teacher));

router.get('/:teacherId/assignments', getPeerAssignments);
router.get('/assignments/:assignmentId', getPeerAssignmentDetails);
router.post('/evaluations', submitPeerEvaluation);

export default router;
