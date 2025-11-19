import { Router } from 'express';
import passport from '../config/passport.js';
import { AuthController } from '../controllers/auth.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/auth/microsoft
 * @desc    Inicia el flujo de autenticación con Microsoft
 * @access  Public
 */
router.get(
  '/microsoft',
  passport.authenticate('microsoft', {
    session: false,
    prompt: 'select_account' // Permite seleccionar cuenta
  })
);

/**
 * @route   GET /api/auth/microsoft/callback
 * @desc    Callback de Microsoft OAuth
 * @access  Public (llamado por Microsoft)
 */
router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', {
    session: false,
    failureRedirect: '/api/auth/microsoft/failure'
  }),
  AuthController.microsoftCallback
);

/**
 * @route   GET /api/auth/microsoft/failure
 * @desc    Maneja errores en la autenticación de Microsoft
 * @access  Public
 */
router.get('/microsoft/failure', AuthController.microsoftFailure);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', Authenticate, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 * @body    { identificacion?: string, carreras?: string[], materias?: string[] }
 */
router.put('/profile', Authenticate, AuthController.updateProfile);

// Validar token
router.post('/validate-token', AuthController.validateToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', Authenticate, AuthController.logout);

/**
 * @route   GET /api/auth/check
 * @desc    Verificar estado de autenticación
 * @access  Private
 */
router.get('/check', Authenticate, AuthController.checkAuth);

export default router;
