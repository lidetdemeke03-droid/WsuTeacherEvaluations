import { Router } from 'express';
import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, getDepartmentTeachers } from '../controllers/departmentController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';
import { body } from 'express-validator';
import { validate } from '../middleware/validators';

const router = Router();

router.use(protect);

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.get('/:id/teachers', authorize(UserRole.Admin, UserRole.DepartmentHead), getDepartmentTeachers);
router.post('/', authorize(UserRole.Admin), body('name').notEmpty().withMessage('Department name is required').trim().escape(), validate, createDepartment);
router.put('/:id', authorize(UserRole.Admin), body('name').notEmpty().withMessage('Department name is required').trim().escape(), validate, updateDepartment);
router.delete('/:id', authorize(UserRole.Admin), deleteDepartment);

export default router;
