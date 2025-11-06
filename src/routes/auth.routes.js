import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/microsoft
 * @desc    Login con Microsoft
 * @access  Public
 * @body    { idToken: string }
 */
router.post('/microsoft', AuthController);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticate, AuthController.getProfile);

export default router;
