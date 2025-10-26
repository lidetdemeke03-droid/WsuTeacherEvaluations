import { Router } from 'express';
import { register, login, refresh } from '../controllers/authController';
import { registerValidation, loginValidation, validate } from '../middleware/validators';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refresh);

export default router;
