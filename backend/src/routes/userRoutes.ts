import { Router } from 'express';
import { getMe, getUsers } from '../controllers/userController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

// Apply protect middleware to all routes in this file
router.use(protect);

// GET /api/users/me - Get current user's profile
router.get('/me', getMe);

// GET /api/users - Get all users (Admin only)
router.get('/', authorize(UserRole.Admin), getUsers);

export default router;
