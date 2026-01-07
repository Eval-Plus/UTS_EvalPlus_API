import { AdminService } from '../services/admin.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export class AdminController {
  // ==========================================
  // SINCRONIZACIÓN
  // ==========================================

  /**
   * Sincronizar estudiantes
   * POST /api/admin/sync/students
   * Body: { force?: boolean }
   */
  static async syncStudents(req, res) {
    try {
      const adminId = req.user.id;
      const { force = false } = req.body;

      const resultado = await AdminService.syncStudents(adminId, { force });

      return successResponse(
        res,
        resultado,
        `Sincronización completada: ${resultado.exitosos} estudiantes procesados`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en sincronización de estudiantes:', error);
      return errorResponse(
        res,
        'Error al sincronizar estudiantes',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Sincronizar profesores
   * POST /api/admin/sync/teachers
   * Body: { force?: boolean }
   */
  static async syncTeachers(req, res) {
    try {
      const adminId = req.user.id;
      const { force = false } = req.body;

      const resultado = await AdminService.syncTeachers(adminId, { force });

      return successResponse(
        res,
        resultado,
        `Sincronización completada: ${resultado.exitosos} profesores procesados`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en sincronización de profesores:', error);
      return errorResponse(
        res,
        'Error al sincronizar profesores',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener historial de sincronizaciones
   * GET /api/admin/sync/logs?tipo=students&periodo=2025-1&limit=50
   */
  static async getSyncLogs(req, res) {
    try {
      const { tipo, periodo, limit } = req.query;

      const logs = await AdminService.getSyncLogs({
        tipo,
        periodo,
        adminId: null, // null = todos los admins
        limit: limit ? parseInt(limit) : 50
      });

      return successResponse(
        res,
        logs,
        'Historial de sincronizaciones obtenido',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      return errorResponse(
        res,
        'Error al obtener historial',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener última sincronización por tipo
   * GET /api/admin/sync/last/:tipo?periodo=2025-1
   */
  static async getLastSync(req, res) {
    try {
      const { tipo } = req.params;
      const { periodo } = req.query;

      if (!['students', 'teachers', 'evaluations'].includes(tipo)) {
        return errorResponse(
          res,
          'Tipo de sincronización inválido',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const log = await AdminService.getLastSyncLog(tipo, periodo);

      if (!log) {
        return successResponse(
          res,
          null,
          'No se encontró sincronización previa',
          HTTP_STATUS.OK
        );
      }

      return successResponse(
        res,
        log,
        'Última sincronización obtenida',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo última sincronización:', error);
      return errorResponse(
        res,
        'Error al obtener sincronización',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  // ==========================================
  // EVALUACIONES
  // ==========================================

  /**
   * Generar evaluaciones masivas
   * POST /api/admin/evaluations/generate
   * Body: { periodo, fechaInicio, fechaCierre, templateId? }
   */
  static async generateEvaluations(req, res) {
    try {
      const adminId = req.user.id;
      const { periodo, fechaInicio, fechaCierre, templateId } = req.body;

      // Validar campos requeridos
      if (!periodo || !fechaInicio || !fechaCierre) {
        return errorResponse(
          res,
          'Faltan campos obligatorios: periodo, fechaInicio, fechaCierre',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Validar fechas
      const inicio = new Date(fechaInicio);
      const cierre = new Date(fechaCierre);

      if (isNaN(inicio.getTime()) || isNaN(cierre.getTime())) {
        return errorResponse(
          res,
          'Formato de fecha inválido',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (cierre <= inicio) {
        return errorResponse(
          res,
          'La fecha de cierre debe ser posterior a la de inicio',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const resultado = await AdminService.generateEvaluations(adminId, {
        periodo,
        fechaInicio,
        fechaCierre,
        templateId: templateId ? parseInt(templateId) : null
      });

      return successResponse(
        res,
        resultado,
        `Evaluaciones generadas: ${resultado.creadas} creadas, ${resultado.omitidas} omitidas`,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error generando evaluaciones:', error);

      if (error.message.includes('Plantilla')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al generar evaluaciones',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Obtener dashboard con estadísticas globales
   * GET /api/admin/dashboard?periodo=2025-1
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
      console.error('Error obteniendo dashboard:', error);
      return errorResponse(
        res,
        'Error al obtener dashboard',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener usuarios pendientes de primer login
   * GET /api/admin/users/pending-login
   */
  static async getPendingFirstLogin(req, res) {
    try {
      const users = await AdminService.getPendingFirstLogin();

      return successResponse(
        res,
        {
          total: users.length,
          users
        },
        'Usuarios pendientes obtenidos',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo usuarios pendientes:', error);
      return errorResponse(
        res,
        'Error al obtener usuarios pendientes',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener estadísticas de evaluaciones
   * GET /api/admin/evaluations/stats?periodo=2025-1
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
      console.error('Error obteniendo estadísticas:', error);
      return errorResponse(
        res,
        'Error al obtener estadísticas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}

export default AdminController;
