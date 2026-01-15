import { AdminService } from '../services/admin.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export class AdminController {
  // ==========================================
  // SINCRONIZACIÓN
  // ==========================================

  /**
   * POST /api/admin/sync/students
   * Sincronizar estudiantes (inscribir en carreras y materias)
   */
  static async syncStudents(req, res) {
    try {
      const adminId = req.user.id;
      const { force = false } = req.body;

      const resultado = await AdminService.syncStudents(adminId, { force });

      return successResponse(
        res,
        resultado,
        'Sincronización de estudiantes completada',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en syncStudents:', error);
      
      // Manejo de errores específicos de validación
      if (error.message.includes('No hay estudiantes')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('No hay carreras')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return errorResponse(
        res,
        'Error al sincronizar estudiantes',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * POST /api/admin/sync/teachers
   * Sincronizar profesores (asignar a materias)
   */
  static async syncTeachers(req, res) {
    try {
      const adminId = req.user.id;
      const { force = false } = req.body;

      const resultado = await AdminService.syncTeachers(adminId, { force });

      return successResponse(
        res,
        resultado,
        'Sincronización de profesores completada',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en syncTeachers:', error);

      // Manejo de errores específicos de validación
      if (error.message.includes('No hay profesores')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('No hay materias disponibles')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return errorResponse(
        res,
        'Error al sincronizar profesores',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * POST /api/admin/evaluations/generate
   * Generar evaluaciones masivas para un periodo
   */
  static async generateEvaluations(req, res) {
    try {
      const adminId = req.user.id;
      const { periodo, fechaInicio, fechaCierre, templateId } = req.body;

      // Validaciones básicas
      if (!periodo || !fechaInicio || !fechaCierre) {
        return errorResponse(
          res,
          'Periodo, fechaInicio y fechaCierre son requeridos',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Validar fechas
      const inicio = new Date(fechaInicio);
      const cierre = new Date(fechaCierre);

      if (isNaN(inicio.getTime()) || isNaN(cierre.getTime())) {
        return errorResponse(
          res,
          'Fechas inválidas',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (cierre <= inicio) {
        return errorResponse(
          res,
          'La fecha de cierre debe ser posterior a la fecha de inicio',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const resultado = await AdminService.generateEvaluations(adminId, {
        periodo,
        fechaInicio,
        fechaCierre,
        templateId
      });

      return successResponse(
        res,
        resultado,
        'Generación de evaluaciones completada',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en generateEvaluations:', error);

      // Manejo de errores específicos de validación
      if (error.message.includes('No hay estudiantes')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('No hay profesores')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('No hay materias')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('Plantilla')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return errorResponse(
        res,
        'Error al generar evaluaciones',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * GET /api/admin/sync/logs
   * Obtener historial de sincronizaciones
   */
  static async getSyncLogs(req, res) {
    try {
      const { tipo, periodo, limit } = req.query;
      const adminId = req.user.id;

      const logs = await AdminService.getSyncLogs({
        tipo,
        periodo,
        adminId,
        limit: limit ? parseInt(limit) : 50
      });

      return successResponse(
        res,
        logs,
        'Logs de sincronización obtenidos',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getSyncLogs:', error);
      return errorResponse(
        res,
        'Error al obtener logs de sincronización',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * GET /api/admin/sync/last/:tipo
   * Obtener última sincronización por tipo
   */
  static async getLastSync(req, res) {
    try {
      const { tipo } = req.params;
      const { periodo } = req.query;

      // Validar tipo
      if (!['students', 'teachers', 'evaluations'].includes(tipo)) {
        return errorResponse(
          res,
          'Tipo de sincronización inválido. Debe ser: students, teachers o evaluations',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const lastSync = await AdminService.getLastSyncLog(tipo, periodo);

      if (!lastSync) {
        return successResponse(
          res,
          null,
          'No se encontraron sincronizaciones previas',
          HTTP_STATUS.OK
        );
      }

      return successResponse(
        res,
        lastSync,
        'Última sincronización obtenida',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getLastSync:', error);
      return errorResponse(
        res,
        'Error al obtener última sincronización',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  // ==========================================
  // EVALUACIONES
  // ==========================================

  /**
   * GET /api/admin/evaluations/stats
   * Obtener estadísticas de evaluaciones
   */
  static async getEvaluationStats(req, res) {
    try {
      const { periodo } = req.query;

      const stats = await AdminService.getEvaluationStats(periodo);

      return successResponse(
        res,
        stats,
        'Estadísticas de evaluaciones obtenidas',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getEvaluationStats:', error);
      return errorResponse(
        res,
        'Error al obtener estadísticas de evaluaciones',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * GET /api/admin/dashboard
   * Obtener dashboard con estadísticas globales
   */
  static async getDashboard(req, res) {
    try {
      const { periodo } = req.query;

      const dashboard = await AdminService.getDashboard(periodo);

      return successResponse(
        res,
        dashboard,
        'Dashboard obtenido exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getDashboard:', error);
      return errorResponse(
        res,
        'Error al obtener dashboard',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * GET /api/admin/users/pending-login
   * Obtener usuarios que no han iniciado sesión
   */
  static async getPendingFirstLogin(req, res) {
    try {
      const users = await AdminService.getPendingFirstLogin();

      return successResponse(
        res,
        users,
        'Usuarios pendientes obtenidos',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getPendingFirstLogin:', error);
      return errorResponse(
        res,
        'Error al obtener usuarios pendientes',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  // ==========================================
  // ANÁLISIS DE DOCENTES
  // ==========================================

  /**
   * GET /api/admin/analysis/teachers
   * Obtener análisis completo de todos los docentes
   */
  static async getTeachersAnalysis(req, res) {
    try {
      const { periodo, career, sortBy } = req.query;

      const analysis = await AdminService.getTeachersAnalysis({
        periodo,
        career,
        sortBy
      });

      return successResponse(
        res,
        analysis,
        'Análisis de docentes obtenido',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getTeachersAnalysis:', error);
      return errorResponse(
        res,
        'Error al obtener análisis de docentes',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * GET /api/admin/analysis/teachers/:teacherId
   * Obtener análisis detallado de un docente específico
   */
  static async getTeacherAnalysis(req, res) {
    try {
      const { teacherId } = req.params;
      const { periodo } = req.query;

      const analysis = await AdminService.getTeacherAnalysis(
        parseInt(teacherId),
        periodo
      );

      if (!analysis) {
        return errorResponse(
          res,
          'Docente no encontrado o no tiene rol de profesor',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return successResponse(
        res,
        analysis,
        'Análisis del docente obtenido',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getTeacherAnalysis:', error);
      return errorResponse(
        res,
        'Error al obtener análisis del docente',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * GET /api/admin/analysis/stats
   * Obtener estadísticas globales para análisis
   */
  static async getAnalysisStats(req, res) {
    try {
      const { periodo, career } = req.query;

      const stats = await AdminService.getAnalysisStats({
        periodo,
        career
      });

      return successResponse(
        res,
        stats,
        'Estadísticas de análisis obtenidas',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getAnalysisStats:', error);
      return errorResponse(
        res,
        'Error al obtener estadísticas de análisis',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}
