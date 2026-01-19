/**
 * Rutas de Análisis de Sentimiento
 * Endpoints para gestión y análisis de IA
 */

import { Router } from 'express';
import { SentimentController } from '../controllers/sentiment.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

/**
 * @route   POST /api/sentiment/reanalyze
 * @desc    Re-analizar comentarios pendientes de análisis
 * @body    { evaluationId?: number }
 * @access  Private (Admin)
 */
router.post(
  '/reanalyze',
  Authenticate,
  requireRole(ROLES.ADMIN),
  SentimentController.reanalyzeComments
);

/**
 * @route   POST /api/sentiment/analyze/:id
 * @desc    Analizar manualmente un comentario específico
 * @params  id - ID de la evaluación del estudiante
 * @access  Private (Admin)
 */
router.post(
  '/analyze/:id',
  Authenticate,
  requireRole(ROLES.ADMIN),
  SentimentController.analyzeComment
);

/**
 * @route   GET /api/sentiment/stats
 * @desc    Obtener estadísticas del servicio de IA
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  Authenticate,
  requireRole(ROLES.ADMIN),
  SentimentController.getServiceStats
);

/**
 * @route   POST /api/sentiment/load-model
 * @desc    Precargar el modelo de IA (útil al iniciar el servidor)
 * @access  Private (Admin)
 */
router.post(
  '/load-model',
  Authenticate,
  requireRole(ROLES.ADMIN),
  SentimentController.loadModel
);

/**
 * @route   POST /api/sentiment/test
 * @desc    Probar análisis con texto personalizado
 * @body    { text: string }
 * @access  Private (Admin - solo para testing)
 */
router.post(
  '/test',
  Authenticate,
  requireRole(ROLES.ADMIN),
  SentimentController.testAnalysis
);

export default router;
