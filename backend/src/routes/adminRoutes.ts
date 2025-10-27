import { Router } from 'express';
import { createUser, importUsers, assignTeacherToCourse, createPeerAssignment, createScheduleWindow, getTeacherReport, recomputeTeacherScores } from '../controllers/adminController';
import { protect } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
import { authorize } from '../middleware/role';
import { audit } from '../middleware/audit';
import { UserRole } from '../types';

const router = Router();

// All routes in this file are protected and require admin or superadmin privileges
router.use(protect);
router.use(authorize(UserRole.Admin, UserRole.SuperAdmin));

// POST /api/admin/users - Create a new user
router.post('/users', audit('USER_CREATE'), createUser);

// POST /api/admin/users/import - Bulk import users from CSV
router.post('/users/import', upload.single('file'), audit('USER_BULK_IMPORT'), importUsers);

// PUT /api/admin/courses/:id/assign-teacher - Assign a teacher to a course
router.put('/courses/:id/assign-teacher', audit('COURSE_ASSIGN_TEACHER'), assignTeacherToCourse);

// POST /api/admin/assignments/peer - Create a peer assignment
router.post('/assignments/peer', audit('PEER_ASSIGNMENT_CREATE'), createPeerAssignment);

// POST /api/admin/schedule - Create a new schedule window
router.post('/schedule', audit('SCHEDULE_WINDOW_CREATE'), createScheduleWindow);

// GET /api/admin/reports/teacher/:id - Get teacher report
router.get('/reports/teacher/:id', audit('REPORT_VIEW_TEACHER'), getTeacherReport);

// POST /api/admin/reports/teacher/:id/recompute - Recompute teacher scores
router.post('/reports/teacher/:id/recompute', audit('REPORT_RECOMPUTE_TEACHER'), recomputeTeacherScores);

export default router;
