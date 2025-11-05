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

// GET /api/reports/department - Get all reports for the current department head's department
router.get('/department', authorize(UserRole.DepartmentHead), getDepartmentReport);


export default router;
