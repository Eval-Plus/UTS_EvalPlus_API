/**
 * Servicio de Sincronización de Profesores
 * Maneja toda la lógica de asignación de profesores
 */

import { createLogger } from '../../../utils/logger.js';
import { EnrollmentService } from '../../enrollment.service.js';
import { SubjectModel } from '../../../models/subject.model.js';
import prisma from '../../../config/prisma.js';
import { SyncBaseService, CURRENT_PERIOD } from './sync-base.service.js';

const logger = createLogger('TeacherSyncService');

export class TeacherSyncService {
  /**
   * Sincroniza profesores: asigna materias
   */
  static async syncTeachers(adminId, options = {}) {
    logger.info(`🧑‍🏫 Iniciando sincronización de profesores (Admin: ${adminId})`);

    const startTime = Date.now();
    const resultado = {
      ...SyncBaseService.createResultStructure(),
      yaAsignados: 0
    };

    try {
      // 1. Obtener profesores
      const profesores = await this._getTeachersToSync();
      
      if (profesores.length === 0) {
        throw new Error('No hay profesores registrados en el sistema');
      }

      resultado.total = profesores.length;
      logger.info(`📊 ${resultado.total} profesores encontrados`);

      // 2. Validar materias
      await this._validateSubjects();

      // 3. Procesar cada profesor
      await this._processTeachers(profesores, resultado, options);

      // 4. Guardar log
      const resultadoFinal = SyncBaseService.formatSyncResult(resultado, startTime);
      await SyncBaseService.saveSyncLog(adminId, 'teachers', CURRENT_PERIOD, resultadoFinal);

      this._logSyncSummary(resultadoFinal);

      return resultadoFinal;
    } catch (error) {
      logger.error('Error en sincronización de profesores', error);
      throw error;
    }
  }

  /**
   * Obtiene profesores que necesitan sincronización
   */
  static async _getTeachersToSync() {
    return await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: 'TEACHER' }
          }
        }
      },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        firstLoginAt: true,
        lastLoginAt: true,
        taughtSubjects: { select: { id: true } }
      }
    });
  }

  /**
   * Valida que existan materias sin profesor
   */
  static async _validateSubjects() {
    const materiasSinProfesor = await SubjectModel.findSubjectsWithoutTeacher();
    if (materiasSinProfesor.length === 0) {
      throw new Error(
        'No hay materias disponibles sin profesor. ' +
        'Todas las materias ya tienen docente asignado.'
      );
    }
    logger.info(`📚 ${materiasSinProfesor.length} materias disponibles sin profesor`);
  }

  /**
   * Procesa todos los profesores
   */
  static async _processTeachers(profesores, resultado, options) {
    for (const profesor of profesores) {
      try {
        resultado.procesados++;

        // Verificar asignaciones previas
        if (await this._teacherHasAssignments(profesor.id) && !options.force) {
          resultado.yaAsignados++;
          logger.debug(`Profesor ${profesor.email} ya tiene asignaciones`);
          continue;
        }

        // Asignar materias
        const asignacion = await EnrollmentService.setupTeacherAssignment(profesor.id);

        if (!asignacion.success) {
          this._recordError(resultado, profesor, asignacion.message);
          continue;
        }

        // Registrar éxito
        this._recordSuccess(resultado, profesor, asignacion);

      } catch (error) {
        this._recordError(resultado, profesor, error.message);
      }
    }
  }

  /**
   * Verifica si profesor tiene asignaciones
   */
  static async _teacherHasAssignments(userId) {
    const subjects = await prisma.subject.count({
      where: { teacherId: userId }
    });
    return subjects > 0;
  }

  /**
   * Registra un error
   */
  static _recordError(resultado, profesor, errorMessage) {
    resultado.errores++;
    resultado.erroresDetalle.push({
      userId: profesor.id,
      email: profesor.email,
      error: errorMessage
    });
    logger.error(`Error procesando profesor ${profesor.email}`, { error: errorMessage });
  }

  /**
   * Registra un éxito
   */
  static _recordSuccess(resultado, profesor, asignacion) {
    resultado.exitosos++;
    resultado.detalles.push({
      userId: profesor.id,
      email: profesor.email,
      materias: asignacion.assignedSubjects,
      success: true
    });

    logger.success(
      `✅ ${profesor.email}: ${asignacion.assignedSubjects} materias asignadas`
    );
  }

  /**
   * Log de resumen final
   */
  static _logSyncSummary(resultado) {
    logger.success(
      `✅ Sincronización de profesores completada:\n` +
      `   - Total: ${resultado.total}\n` +
      `   - Exitosos: ${resultado.exitosos}\n` +
      `   - Ya asignados: ${resultado.yaAsignados}\n` +
      `   - Errores: ${resultado.errores}\n` +
      `   - Duración: ${resultado.duracion}`
    );
  }
}

export default TeacherSyncService;
