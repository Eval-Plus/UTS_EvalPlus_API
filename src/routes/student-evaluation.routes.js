import { Router } from 'express';
import { StudentEvaluationController } from '../controllers/student-evaluation.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// ==========================================
// RUTAS PARA ESTUDIANTES
// ==========================================

/**
 * @route   POST /api/student-evaluations/start
 * @desc    Iniciar una evaluación
 * @body    { evaluationId: number }
 * @access  Private (Student)
 */
router.post(
  '/start',
  Authenticate,
  requireRole(ROLES.STUDENT),
  StudentEvaluationController.startEvaluation
);

/**
 * @route   POST /api/student-evaluations/:id/submit
 * @desc    Enviar respuestas completas de una evaluación
 * @body    { responses: [{questionId, valorNumerico?, valorTexto?}], comentario?: string }
 * @access  Private (Student)
 */
router.post(
  '/:id/submit',
  Authenticate,
  requireRole(ROLES.STUDENT),
  StudentEvaluationController.submitResponses
);

/**
 * @route   PUT /api/student-evaluations/:id/responses
 * @desc    Guardar respuestas parciales (progreso)
 * @body    { responses: [{questionId, valorNumerico?, valorTexto?}] }
 * @access  Private (Student)
 */
router.put(
  '/:id/responses',
  Authenticate,
  requireRole(ROLES.STUDENT),
  StudentEvaluationController.savePartialResponses
);

/**
 * @route   GET /api/student-evaluations/my
 * @desc    Obtener mis evaluaciones
 * @query   completada=true/false (opcional)
 * @access  Private (Student)
 */
router.get(
  '/my',
  Authenticate,
  requireRole(ROLES.STUDENT),
  StudentEvaluationController.getMyEvaluations
);

/**
 * @route   GET /api/student-evaluations/:id/can-continue
 * @desc    Verificar si puedo continuar una evaluación
 * @access  Private (Student)
 */
router.get(
  '/:id/can-continue',
  Authenticate,
  requireRole(ROLES.STUDENT),
  StudentEvaluationController.canContinueEvaluation
);

/**
 * @route   GET /api/student-evaluations/:id
 * @desc    Obtener evaluación por ID
 * @access  Private (Student - solo propia evaluación, o Teacher/Admin)
 */
router.get(
  '/:id',
  Authenticate,
  StudentEvaluationController.getStudentEvaluationById
);

// ==========================================
// RUTAS PARA PROFESORES Y ADMINISTRADORES
// ==========================================

/**
 * @route   GET /api/student-evaluations/evaluation/:evaluationId/progress
 * @desc    Obtener progreso de una evaluación (cuántos estudiantes han respondido)
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/evaluation/:evaluationId/progress',
  Authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  StudentEvaluationController.getEvaluationProgress
);

/**
 * @route   GET /api/student-evaluations/evaluation/:evaluationId/comments
 * @desc    Obtener comentarios anónimos de una evaluación
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/evaluation/:evaluationId/comments',
  Authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  StudentEvaluationController.getAnonymousComments
);

/**
 * @route   GET /api/student-evaluations/evaluation/:evaluationId/statistics
 * @desc    Obtener estadísticas detalladas de una evaluación
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/evaluation/:evaluationId/statistics',
  Authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  StudentEvaluationController.getDetailedStatistics
);

/**
 * @route   GET /api/student-evaluations/evaluation/:evaluationId/question/:questionId/distribution
 * @desc    Obtener distribución de respuestas de una pregunta específica
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/evaluation/:evaluationId/question/:questionId/distribution',
  Authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  StudentEvaluationController.getQuestionDistribution
);

/**
 * @route   GET /api/student-evaluations/evaluation/:evaluationId/question/:questionId/text-responses
 * @desc    Obtener respuestas de texto de una pregunta específica
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/evaluation/:evaluationId/question/:questionId/text-responses',
  Authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  StudentEvaluationController.getQuestionTextResponses
);

export default router;
