import { Router } from 'express';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse } from '../controllers/courseController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../../../types';
import { courseValidation, validate } from '../middleware/validators';

const router = Router();

router.use(protect);

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authorize(UserRole.Admin, UserRole.DepartmentHead), courseValidation, validate, createCourse);
router.put('/:id', authorize(UserRole.Admin, UserRole.DepartmentHead), courseValidation, validate, updateCourse);
router.delete('/:id', authorize(UserRole.Admin), deleteCourse);

export default router;
