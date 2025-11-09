import { Router } from 'express';
import { register, login, refresh, verifyResetToken, resetPassword, requestPasswordReset } from '../controllers/authController';
import { registerValidation, loginValidation, validate } from '../middleware/validators';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refresh);

router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPassword);
router.post('/request-password-reset', requestPasswordReset);

export default router;
