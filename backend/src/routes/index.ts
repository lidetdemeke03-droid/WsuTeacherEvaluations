import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import courseRoutes from './courseRoutes';
import departmentRoutes from './departmentRoutes';
import criterionRoutes from './criterionRoutes';
import evaluationPeriodRoutes from './evaluationPeriodRoutes';
import complaintRoutes from './complaintRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/departments', departmentRoutes);
router.use('/criteria', criterionRoutes);
router.use('/periods', evaluationPeriodRoutes);
router.use('/complaints', complaintRoutes);
import adminRoutes from './adminRoutes';
router.use('/admin', adminRoutes);
import evaluationRoutes from './evaluationRoutes';
router.use('/evaluations', evaluationRoutes);


export default router;
