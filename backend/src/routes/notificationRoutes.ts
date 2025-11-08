import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;
