/**
 * Servicio de Administración - REFACTORIZADO
 * Orquesta todos los servicios especializados
 * 
 * Ubicación: src/services/admin.service.js
 * 
 * Estructura:
 * - Sincronización: student-sync, teacher-sync, evaluation-sync
 * - Analytics: teacher-analytics
 * - Reportes: dashboard, teacher-report
 * - Logs: sync-base
 */

import { StudentSyncService } from './admin/sync/student-sync.service.js';
import { TeacherSyncService } from './admin/sync/teacher-sync.service.js';
import { EvaluationSyncService } from './admin/sync/evaluation-sync.service.js';
import { SyncBaseService } from './admin/sync/sync-base.service.js';
import { DashboardService } from './admin/reports/dashboard.service.js';
import { TeacherAnalyticsService } from './admin/analytics/teacher-analytics.service.js';
import { TeacherReportService } from './admin/reports/teacher-report.service.js';

/**
 * Clase principal AdminService
 * Actúa como fachada para todos los servicios especializados
 */
export class AdminService {
  // ==========================================
  // SINCRONIZACIÓN
  // ==========================================

  /**
   * Sincronizar estudiantes (inscribir en carreras y materias)
   * @param {number} adminId - ID del administrador
   * @param {Object} options - Opciones de sincronización
   * @returns {Object} Resultado de la sincronización
   */
  static async syncStudents(adminId, options = {}) {
    return await StudentSyncService.syncStudents(adminId, options);
  }

  /**
   * Sincronizar profesores (asignar a materias)
   * @param {number} adminId - ID del administrador
   * @param {Object} options - Opciones de sincronización
   * @returns {Object} Resultado de la sincronización
   */
  static async syncTeachers(adminId, options = {}) {
    return await TeacherSyncService.syncTeachers(adminId, options);
  }

  /**
   * Generar evaluaciones masivas para un periodo
   * @param {number} adminId - ID del administrador
   * @param {Object} data - Datos de evaluación
   * @returns {Object} Resultado de la generación
   */
  static async generateEvaluations(adminId, data) {
    return await EvaluationSyncService.generateEvaluations(adminId, data);
  }

  // ==========================================
  // GESTIÓN DE LOGS
  // ==========================================

  /**
   * Obtener historial de sincronizaciones
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Array} Lista de logs
   */
  static async getSyncLogs(filters = {}) {
    return await SyncBaseService.getSyncLogs(filters);
  }

  /**
   * Obtener última sincronización por tipo
   * @param {string} tipo - Tipo de sincronización
   * @param {string} periodo - Periodo académico
   * @returns {Object|null} Último log
   */
  static async getLastSyncLog(tipo, periodo) {
    return await SyncBaseService.getLastSyncLog(tipo, periodo);
  }

  // ==========================================
  // REPORTES Y ESTADÍSTICAS
  // ==========================================

  /**
   * Obtener dashboard con estadísticas globales
   * @param {string} periodo - Periodo académico
   * @returns {Object} Dashboard completo
   */
  static async getDashboard(periodo) {
    return await DashboardService.getDashboard(periodo);
  }

  /**
   * Obtener estadísticas de evaluaciones
   * @param {string} periodo - Periodo académico
   * @returns {Object} Estadísticas de evaluaciones
   */
  static async getEvaluationStats(periodo) {
    return await DashboardService.getEvaluationStats(periodo);
  }

  /**
   * Obtener usuarios pendientes de primer login
   * @returns {Array} Lista de usuarios
   */
  static async getPendingFirstLogin() {
    return await DashboardService.getPendingFirstLogin();
  }

  // ==========================================
  // ANÁLISIS DE DOCENTES
  // ==========================================

  /**
   * Obtener análisis completo de todos los docentes
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Object} Análisis de docentes
   */
  static async getTeachersAnalysis(filters = {}) {
    return await TeacherAnalyticsService.getTeachersAnalysis(filters);
  }

  /**
   * Obtener análisis detallado de un docente específico
   * @param {number} teacherId - ID del docente
   * @param {string} periodo - Periodo académico
   * @returns {Object|null} Análisis del docente
   */
  static async getTeacherAnalysis(teacherId, periodo) {
    return await TeacherAnalyticsService.getTeacherAnalysis(teacherId, periodo);
  }

  /**
   * Obtener estadísticas globales para análisis
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Object} Estadísticas globales
   */
  static async getAnalysisStats(filters = {}) {
    return await TeacherAnalyticsService.getAnalysisStats(filters);
  }

  // ==========================================
  // 🆕 REPORTES DE DOCENTES - RESPUESTAS
  // ==========================================

  /**
   * Obtener reporte completo de respuestas de un docente
   * @param {number} teacherId - ID del docente
   * @param {string} periodo - Periodo académico
   * @returns {Object} Reporte de respuestas
   */
  static async getTeacherResponsesReport(teacherId, periodo) {
    return await TeacherReportService.getTeacherResponsesReport(teacherId, periodo);
  }

  /**
   * Obtener detalle de respuestas de una pregunta específica
   * @param {number} teacherId - ID del docente
   * @param {number} questionId - ID de la pregunta
   * @param {string} periodo - Periodo académico
   * @returns {Object} Detalle de respuestas
   */
  static async getQuestionResponsesDetail(teacherId, questionId, periodo) {
    return await TeacherReportService.getQuestionResponsesDetail(teacherId, questionId, periodo);
  }

  /**
   * Obtener estadísticas por categoría
   * @param {number} teacherId - ID del docente
   * @param {string} periodo - Periodo académico
   * @returns {Object} Estadísticas por categoría
   */
  static async getCategoryStatistics(teacherId, periodo) {
    return await TeacherReportService.getCategoryStatistics(teacherId, periodo);
  }
}

export default AdminService;
