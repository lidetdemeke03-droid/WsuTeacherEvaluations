import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import courseRoutes from './courseRoutes';
import superadminRoutes from './superadminRoutes';
import departmentRoutes from './departmentRoutes';
import criterionRoutes from './criterionRoutes';
import evaluationPeriodRoutes from './evaluationPeriodRoutes';
import complaintRoutes from './complaintRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';
import evaluationRoutes from './evaluationRoutes';
import studentRoutes from './studentRoutes';
import reportRoutes from './reportRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/superadmin/admins', superadminRoutes);
router.use('/courses', courseRoutes);
router.use('/departments', departmentRoutes);
router.use('/criteria', criterionRoutes);
router.use('/periods', evaluationPeriodRoutes);
router.use('/complaints', complaintRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/students', studentRoutes);
// Peer routes are disabled per request (teacher peer reviews not needed)
// router.use('/peers', peerRoutes);
router.use('/reports', reportRoutes);

export default router;
