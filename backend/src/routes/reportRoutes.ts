import { Router } from 'express';
import { getInstructorReport, getDepartmentReport, getInstructorRatingDistribution } from '../controllers/reportsController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

router.use(protect);

router.get('/instructor/:id', authorize(UserRole.Admin, UserRole.DepartmentHead, UserRole.Instructor), getInstructorReport);
router.get('/instructor/:id/distribution', authorize(UserRole.Admin, UserRole.DepartmentHead, UserRole.Instructor), getInstructorRatingDistribution);
router.get('/department/:id', authorize(UserRole.Admin, UserRole.DepartmentHead), getDepartmentReport);

export default router;
