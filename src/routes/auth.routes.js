import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/google
 * @desc    Login con Google OAuth
 * @access  Public
 * @body    { idToken: string }
 */
router.post('/google', AuthController.googleLogin);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticate, AuthController.getProfile);

export default router;
