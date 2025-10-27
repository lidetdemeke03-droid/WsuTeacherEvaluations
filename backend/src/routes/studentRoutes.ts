import { Router } from 'express';
import { getStudentCourses } from '../controllers/studentController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

router.use(protect);

router.get('/:id/courses', authorize(UserRole.Student), getStudentCourses);

export default router;
