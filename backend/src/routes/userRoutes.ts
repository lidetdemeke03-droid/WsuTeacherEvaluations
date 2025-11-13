import { Router } from 'express';
import { getMe, getUsers, updateUser, deleteUser, updateProfile, changePassword, getUsersByRoleAndDepartment } from '../controllers/userController';
import { getTeacherCourses } from '../controllers/studentController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';
import { audit } from '../middleware/audit';

const router = Router();

// Apply protect middleware to all routes in this file
router.use(protect);

// GET /api/users/me - Get current user's profile
router.get('/me', getMe);

// PATCH /api/users/me - Update current user's profile
router.patch('/me', updateProfile);

// POST /api/users/me/change-password - Change current user's password
router.post('/me/change-password', changePassword);

// GET /api/users - Get all users (Admin, SuperAdmin)
router.get('/', authorize(UserRole.Admin, UserRole.SuperAdmin), audit('USER_LIST'), getUsers);

// GET /api/users/:id/courses - Get courses for a given user (teacher)
router.get('/:id/courses', authorize(UserRole.Admin, UserRole.DepartmentHead, UserRole.Teacher), getTeacherCourses);

// PUT /api/users/:id - Update a user (Admin only)
router.put('/:id', authorize(UserRole.Admin, UserRole.SuperAdmin), audit('USER_UPDATE'), updateUser);

// DELETE /api/users/:id - Delete a user (Admin only)
router.delete('/:id', authorize(UserRole.Admin, UserRole.SuperAdmin), audit('USER_DELETE'), deleteUser);

// GET /api/users/by-role-department - Get users by role and department (Admin, DepartmentHead)
router.get('/by-role-department', authorize(UserRole.Admin, UserRole.DepartmentHead), getUsersByRoleAndDepartment);

export default router;

