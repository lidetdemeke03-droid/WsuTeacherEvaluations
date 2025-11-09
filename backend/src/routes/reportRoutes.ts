import { Router } from 'express';
import { getMyPerformance, getDepartmentReport, generateReports, listReports, downloadReport, downloadReportByToken } from '../controllers/reportController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

// Public token-based download (used for emailed links) - must be defined before protect middleware
router.get('/download', downloadReportByToken);

// Apply protect middleware to all remaining routes in this file
router.use(protect);

// GET /api/reports/my-performance - Get performance data for the current instructor
router.get('/my-performance', authorize(UserRole.Teacher), getMyPerformance);

// GET /api/reports/department - Get all reports for the current department head's department
router.get('/department', authorize(UserRole.DepartmentHead), getDepartmentReport);

// Admin-only: generate reports for teachers
router.post('/generate', authorize(UserRole.Admin), generateReports);

// Admin: list previous reports (optional filters)
router.get('/', authorize(UserRole.Admin), listReports);

// Download generated PDF
router.get('/:id/download', authorize(UserRole.Admin), downloadReport);

export default router;

