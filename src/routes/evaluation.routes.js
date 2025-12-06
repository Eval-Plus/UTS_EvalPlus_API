import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluation.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// ==========================================
// RUTAS PARA ESTUDIANTES
// ==========================================

/**
 * @route   GET /api/evaluations/student/available
 * @desc    Obtener evaluaciones disponibles para el estudiante autenticado
 * @access  Private (Student)
 */
router.get(
  '/student/available',
  Authenticate,
  requireRole(ROLES.STUDENT),
  EvaluationController.getStudentAvailableEvaluations
);

/**
 * @route   GET /api/evaluations/student/completed
 * @desc    Obtener evaluaciones completadas por el estudiante autenticado
 * @access  Private (Student)
 */
router.get(
  '/student/completed',
  Authenticate,
  requireRole(ROLES.STUDENT),
  EvaluationController.getStudentCompletedEvaluations
);

/**
 * @route   GET /api/evaluations/student/pending
 * @desc    Obtener evaluaciones pendientes del estudiante autenticado
 * @access  Private (Student)
 */
router.get(
  '/student/pending',
  Authenticate,
  requireRole(ROLES.STUDENT),
  EvaluationController.getStudentPendingEvaluations
);

/**
 * @route   GET /api/evaluations/student/stats
 * @desc    Obtener estadísticas de evaluaciones del estudiante autenticado
 * @access  Private (Student)
 */
router.get(
  '/student/stats',
  Authenticate,
  requireRole(ROLES.STUDENT),
  EvaluationController.getStudentStats
);

/**
 * @route   GET /api/evaluations/:id/can-respond
 * @desc    Verificar si el estudiante puede responder una evaluación
 * @access  Private (Student)
 */
router.get(
  '/:id/can-respond',
  Authenticate,
  requireRole(ROLES.STUDENT),
  EvaluationController.canStudentRespond
);

// ==========================================
// RUTAS PARA PROFESORES
// ==========================================

/**
 * @route   GET /api/evaluations/my-evaluations
 * @desc    Obtener evaluaciones del profesor autenticado
 * @access  Private (Teacher)
 */
router.get(
  '/my-evaluations',
  Authenticate,
  requireRole(ROLES.TEACHER),
  EvaluationController.getMyEvaluations
);

/**
 * @route   GET /api/evaluations/teacher/:teacherId
 * @desc    Obtener evaluaciones de un profesor específico
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/teacher/:teacherId',
  Authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  EvaluationController.getTeacherEvaluations
);

// ==========================================
// RUTAS GENERALES (AUTENTICADAS)
// ==========================================

/**
 * @route   GET /api/evaluations
 * @desc    Obtener todas las evaluaciones
 * @access  Private (Admin)
 */
router.get(
  '/',
  Authenticate,
  requireRole(ROLES.ADMIN),
  EvaluationController.getAllEvaluations
);

/**
 * @route   GET /api/evaluations/:id
 * @desc    Obtener una evaluación específica por ID
 * @access  Private (Any authenticated user)
 */
router.get(
  '/:id',
  Authenticate,
  EvaluationController.getEvaluationById
);

/**
 * @route   GET /api/evaluations/:id/stats
 * @desc    Obtener estadísticas de una evaluación
 * @access  Private (Teacher, Admin)
 */
router.get(
  '/:id/stats',
  Authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  EvaluationController.getEvaluationStats
);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

/**
 * @route   POST /api/evaluations
 * @desc    Crear una nueva evaluación
 * @access  Private (Admin)
 */
router.post(
  '/',
  Authenticate,
  requireRole(ROLES.ADMIN),
  EvaluationController.createEvaluation
);

/**
 * @route   POST /api/evaluations/bulk
 * @desc    Crear evaluaciones masivas para un periodo
 * @access  Private (Admin)
 */
router.post(
  '/bulk',
  Authenticate,
  requireRole(ROLES.ADMIN),
  EvaluationController.createBulkEvaluations
);

/**
 * @route   PUT /api/evaluations/:id
 * @desc    Actualizar una evaluación
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  Authenticate,
  requireRole(ROLES.ADMIN),
  EvaluationController.updateEvaluation
);

/**
 * @route   DELETE /api/evaluations/:id
 * @desc    Desactivar una evaluación
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  Authenticate,
  requireRole(ROLES.ADMIN),
  EvaluationController.deleteEvaluation
);

export default router;
