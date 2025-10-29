import { Router } from 'express';
import { getMyPerformance, getDepartmentReport } from '../controllers/reportController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

// Apply protect middleware to all routes in this file
router.use(protect);

// GET /api/reports/my-performance - Get performance data for the current instructor
router.get('/my-performance', authorize(UserRole.Teacher), getMyPerformance);

// GET /api/reports/department/:id - Get all reports for a department (for dept head)
router.get('/department/:id', authorize(UserRole.DepartmentHead), getDepartmentReport);


export default router;
