/**
 * Servicio de Dashboard
 * Proporciona estadísticas globales del sistema
 */

import { createLogger } from '../../../utils/logger.js';
import prisma from '../../../config/prisma.js';
import { SyncBaseService, CURRENT_PERIOD } from '../sync/sync-base.service.js';

const logger = createLogger('DashboardService');

export class DashboardService {
  /**
   * Obtiene dashboard con estadísticas globales
   */
  static async getDashboard(periodo = CURRENT_PERIOD) {
    try {
      const [counts, lastSyncs] = await Promise.all([
        this._getCounts(periodo),
        this._getLastSyncs(periodo)
      ]);

      const stats = this._calculateStats(counts);

      return {
        periodo,
        stats,
        lastSyncs,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo dashboard', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los conteos necesarios
   */
  static async _getCounts(periodo) {
    const [
      totalEstudiantes,
      totalProfesores,
      totalEvaluaciones,
      estudiantesSincronizados,
      profesoresInscritos,
      evaluacionesActivas,
      evaluacionesCompletadas,
      usuariosSinLogin
    ] = await Promise.all([
      // Total de estudiantes registrados
      prisma.user.count({
        where: { roles: { some: { role: { name: 'STUDENT' } } } }
      }),

      // Total de profesores registrados
      prisma.user.count({
        where: { roles: { some: { role: { name: 'TEACHER' } } } }
      }),

      // Total de evaluaciones del periodo
      prisma.evaluation.count({
        where: { periodo, activo: true }
      }),

      // Estudiantes con inscripciones en este periodo
      prisma.userCareer.groupBy({
        by: ['userId'],
        where: { periodo },
        _count: true
      }).then(result => result.length),

      // Profesores con materias asignadas
      prisma.subject.groupBy({
        by: ['teacherId'],
        where: { 
          teacherId: { not: null },
          activo: true
        },
        _count: true
      }).then(result => result.length),

      // Evaluaciones activas (aún abiertas)
      prisma.evaluation.count({
        where: {
          periodo,
          activo: true,
          fechaCierre: { gte: new Date() }
        }
      }),

      // Evaluaciones completadas
      prisma.studentEvaluation.count({
        where: {
          completada: true,
          evaluation: { periodo }
        }
      }),

      // Usuarios sin primer login
      prisma.user.count({
        where: { firstLoginAt: null }
      })
    ]);

    return {
      totalEstudiantes,
      totalProfesores,
      totalEvaluaciones,
      estudiantesSincronizados,
      profesoresInscritos,
      evaluacionesActivas,
      evaluacionesCompletadas,
      usuariosSinLogin
    };
  }

  /**
   * Calcula estadísticas derivadas
   */
  static _calculateStats(counts) {
    const {
      totalEstudiantes,
      totalProfesores,
      totalEvaluaciones,
      estudiantesSincronizados,
      profesoresInscritos,
      evaluacionesActivas,
      evaluacionesCompletadas,
      usuariosSinLogin
    } = counts;

    return {
      // Estudiantes
      totalStudents: totalEstudiantes,
      syncedStudents: estudiantesSincronizados,
      pendingStudents: totalEstudiantes - estudiantesSincronizados,
      studentsSyncRate: this._calculateRate(estudiantesSincronizados, totalEstudiantes),

      // Profesores
      totalTeachers: totalProfesores,
      enrolledTeachers: profesoresInscritos,
      pendingTeachers: totalProfesores - profesoresInscritos,
      teachersEnrollRate: this._calculateRate(profesoresInscritos, totalProfesores),

      // Evaluaciones
      totalEvaluations: totalEvaluaciones,
      activeEvaluations: evaluacionesActivas,
      completedEvaluations: evaluacionesCompletadas,
      closedEvaluations: totalEvaluaciones - evaluacionesActivas,
      evaluationsCompletionRate: this._calculateRate(evaluacionesCompletadas, totalEvaluaciones),

      // Usuarios pendientes
      pendingFirstLogin: usuariosSinLogin
    };
  }

  /**
   * Calcula tasa porcentual
   */
  static _calculateRate(numerator, denominator) {
    if (denominator === 0) return 0;
    return parseFloat(((numerator / denominator) * 100).toFixed(2));
  }

  /**
   * Obtiene últimas sincronizaciones
   */
  static async _getLastSyncs(periodo) {
    const [lastSyncStudents, lastSyncTeachers, lastSyncEvaluations] = await Promise.all([
      SyncBaseService.getLastSyncLog('students', periodo),
      SyncBaseService.getLastSyncLog('teachers', periodo),
      SyncBaseService.getLastSyncLog('evaluations', periodo)
    ]);

    return {
      students: this._formatLastSync(lastSyncStudents),
      teachers: this._formatLastSync(lastSyncTeachers),
      evaluations: this._formatLastSync(lastSyncEvaluations)
    };
  }

  /**
   * Formatea datos de última sincronización
   */
  static _formatLastSync(syncLog) {
    if (!syncLog) return null;

    return {
      id: syncLog.id,
      createdAt: syncLog.createdAt,
      admin: syncLog.admin,
      resultado: syncLog.resultado
    };
  }

  /**
   * Obtiene estadísticas de evaluaciones
   */
  static async getEvaluationStats(periodo = CURRENT_PERIOD) {
    const evaluaciones = await prisma.evaluation.findMany({
      where: { periodo, activo: true },
      include: {
        subject: {
          include: {
            students: true
          }
        },
        studentResponses: {
          where: { completada: true }
        }
      }
    });

    let totalPosibles = 0;
    let totalCompletadas = 0;

    evaluaciones.forEach(ev => {
      totalPosibles += ev.subject.students.length;
      totalCompletadas += ev.studentResponses.length;
    });

    return {
      totalEvaluaciones: evaluaciones.length,
      totalPosibles,
      totalCompletadas,
      tasaCompletitud: this._calculateRate(totalCompletadas, totalPosibles),
      promedioGeneral: 0 // TODO: Calcular promedio de respuestas
    };
  }

  /**
   * Obtiene usuarios pendientes de primer login
   */
  static async getPendingFirstLogin() {
    return await prisma.user.findMany({
      where: { firstLoginAt: null },
      include: {
        roles: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export default DashboardService;
