import { Router } from 'express';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getAuditLogs } from '../controllers/superadminController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { UserRole } from '../types';

const router = Router();

// Apply protect and authorize middleware to all routes in this file
router.use(protect, authorize(UserRole.SuperAdmin));

router.route('/admins')
    .get(getAdmins)
    .post(createAdmin);

router.route('/admins/:id')
    .put(updateAdmin)
    .delete(deleteAdmin);

router.get('/audit-logs', getAuditLogs);

export default router;
