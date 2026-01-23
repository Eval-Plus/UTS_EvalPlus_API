import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Todas las rutas requieren autenticación y rol de ADMIN
router.use(Authenticate);
router.use(requireRole(ROLES.ADMIN));

// ==========================================
// SINCRONIZACIÓN
// ==========================================

/**
 * @route   POST /api/admin/sync/students
 * @desc    Sincronizar estudiantes (inscribir en carreras y materias)
 * @body    { force?: boolean }
 * @access  Private (Admin)
 */
router.post('/sync/students', AdminController.syncStudents);

/**
 * @route   POST /api/admin/sync/teachers
 * @desc    Sincronizar profesores (asignar a materias)
 * @body    { force?: boolean }
 * @access  Private (Admin)
 */
router.post('/sync/teachers', AdminController.syncTeachers);

/**
 * @route   GET /api/admin/sync/logs
 * @desc    Obtener historial de sincronizaciones
 * @query   tipo?: 'students'|'teachers'|'evaluations'
 * @query   periodo?: '2025-1'
 * @query   limit?: number
 * @access  Private (Admin)
 */
router.get('/sync/logs', AdminController.getSyncLogs);

/**
 * @route   GET /api/admin/sync/last/:tipo
 * @desc    Obtener última sincronización por tipo
 * @param   tipo - 'students'|'teachers'|'evaluations'
 * @query   periodo?: '2025-1'
 * @access  Private (Admin)
 */
router.get('/sync/last/:tipo', AdminController.getLastSync);

// ==========================================
// EVALUACIONES
// ==========================================

/**
 * @route   POST /api/admin/evaluations/generate
 * @desc    Generar evaluaciones masivas para un periodo
 * @body    { periodo, fechaInicio, fechaCierre, templateId? }
 * @access  Private (Admin)
 */
router.post('/evaluations/generate', AdminController.generateEvaluations);

/**
 * @route   GET /api/admin/evaluations/stats
 * @desc    Obtener estadísticas de evaluaciones
 * @query   periodo?: '2025-1'
 * @access  Private (Admin)
 */
router.get('/evaluations/stats', AdminController.getEvaluationStats);

// ==========================================
// DASHBOARD Y REPORTES
// ==========================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Obtener dashboard con estadísticas globales
 * @query   periodo?: '2025-1'
 * @access  Private (Admin)
 */
router.get('/dashboard', AdminController.getDashboard);

/**
 * @route   GET /api/admin/users/pending-login
 * @desc    Obtener usuarios que no han iniciado sesión
 * @access  Private (Admin)
 */
router.get('/users/pending-login', AdminController.getPendingFirstLogin);

// ==========================================
// 🆕 ANÁLISIS DE DOCENTES
// ==========================================

/**
 * @route   GET /api/admin/analysis/teachers
 * @desc    Obtener análisis completo de todos los docentes
 * @query   periodo?: '2025-1'
 * @query   career?: 'ING-SIS'|'ADM-EMP'|'DER' etc.
 * @query   sortBy?: 'name'|'evaluations'|'completion'|'activity'
 * @access  Private (Admin)
 */
router.get('/analysis/teachers', AdminController.getTeachersAnalysis);

/**
 * @route   GET /api/admin/analysis/teachers/:teacherId
 * @desc    Obtener análisis detallado de un docente específico
 * @param   teacherId - ID del docente
 * @query   periodo?: '2025-1'
 * @access  Private (Admin)
 */
router.get('/analysis/teachers/:teacherId', AdminController.getTeacherAnalysis);

/**
 * @route   GET /api/admin/analysis/stats
 * @desc    Obtener estadísticas globales para análisis
 * @query   periodo?: '2025-1'
 * @query   career?: 'ING-SIS'|'ADM-EMP'|'DER' etc.
 * @access  Private (Admin)
 */
router.get('/analysis/stats', AdminController.getAnalysisStats);

// ==========================================
// 🆕 REPORTES DE DOCENTES - RESPUESTAS
// ==========================================

/**
 * @route   GET /api/admin/reports/teachers/:teacherId/responses
 * @desc    Obtener reporte completo de respuestas de un docente
 * @param   teacherId - ID del docente
 * @query   periodo?: '2025-1'
 * @access  Private (Admin)
 */
router.get(
  '/reports/teachers/:teacherId/responses',
  AdminController.getTeacherResponsesReport
);

/**
 * @route   GET /api/admin/reports/teachers/:teacherId/questions/:questionId/detail
 * @desc    Obtener detalle de respuestas de una pregunta específica
 * @param   teacherId - ID del docente
 * @param   questionId - ID de la pregunta
 * @query   periodo?: '2025-1'
 * @access  Private (Admin)
 */
router.get(
  '/reports/teachers/:teacherId/questions/:questionId/detail',
  AdminController.getQuestionResponsesDetail
);

/**
 * @route   GET /api/admin/reports/teachers/:teacherId/categories
 * @desc    Obtener estadísticas de respuestas por categoría
 * @param   teacherId - ID del docente
 * @query   periodo?: '2025-1'
 * @access  Private (Admin)
 */
router.get(
  '/reports/teachers/:teacherId/categories',
  AdminController.getCategoryStatistics
);

export default router;
