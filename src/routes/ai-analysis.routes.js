/**
 * Rutas de Análisis de IA para Docentes
 */

import { Router } from 'express';
import { AIAnalysisController } from '../controllers/ai-analysis.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(Authenticate);
router.use(requireRole(ROLES.ADMIN));

/**
 * @route   GET /api/admin/ai-analysis/teachers/:teacherId
 * @desc    Obtener análisis IA existente de un docente
 * @query   periodo - Período académico (ej: '2025-1')
 * @access  Private (Admin)
 */
router.get('/teachers/:teacherId', AIAnalysisController.getAnalysis);

/**
 * @route   POST /api/admin/ai-analysis/teachers/:teacherId/generate
 * @desc    Generar o regenerar análisis IA de un docente
 * @body    { periodo: string, teacherName: string }
 * @access  Private (Admin)
 */
router.post('/teachers/:teacherId/generate', AIAnalysisController.generateAnalysis);

/**
 * @route   GET /api/admin/ai-analysis/health
 * @desc    Health check del servicio LLM
 * @access  Private (Admin)
 */
router.get('/health', AIAnalysisController.healthCheck);

export default router;
