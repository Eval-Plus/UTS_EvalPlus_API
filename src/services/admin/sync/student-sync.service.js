/**
 * Servicio de Sincronización de Estudiantes
 * Maneja toda la lógica de inscripción de estudiantes
 */

import { createLogger } from '../../../utils/logger.js';
import { EnrollmentService } from '../../enrollment.service.js';
import { CareerModel } from '../../../models/career.model.js';
import prisma from '../../../config/prisma.js';
import { SyncBaseService, CURRENT_PERIOD } from './sync-base.service.js';

const logger = createLogger('StudentSyncService');

export class StudentSyncService {
  /**
   * Sincroniza estudiantes: inscribe en carreras y materias
   */
  static async syncStudents(adminId, options = {}) {
    logger.info(`🎓 Iniciando sincronización de estudiantes (Admin: ${adminId})`);

    const startTime = Date.now();
    const resultado = SyncBaseService.createResultStructure();

    try {
      // 1. Obtener estudiantes
      const estudiantes = await this._getStudentsToSync();
      
      if (estudiantes.length === 0) {
        throw new Error('No hay estudiantes registrados en el sistema');
      }

      resultado.total = estudiantes.length;
      logger.info(`📊 ${resultado.total} estudiantes encontrados`);

      // 2. Validar carreras
      await this._validateCareers();

      // 3. Procesar cada estudiante
      await this._processStudents(estudiantes, resultado, options);

      // 4. Guardar log
      const resultadoFinal = SyncBaseService.formatSyncResult(resultado, startTime);
      await SyncBaseService.saveSyncLog(adminId, 'students', CURRENT_PERIOD, resultadoFinal);

      this._logSyncSummary(resultadoFinal);

      return resultadoFinal;
    } catch (error) {
      logger.error('Error en sincronización de estudiantes', error);
      throw error;
    }
  }

  /**
   * Obtiene estudiantes que necesitan sincronización
   */
  static async _getStudentsToSync() {
    return await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: 'STUDENT' }
          }
        }
      },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        isProfileComplete: true,
        firstLoginAt: true,
        lastLoginAt: true,
        careers: { select: { id: true } },
        subjects: { select: { id: true } }
      }
    });
  }

  /**
   * Valida que existan carreras disponibles
   */
  static async _validateCareers() {
    const carreras = await CareerModel.findAll();
    if (carreras.length === 0) {
      throw new Error('No hay carreras disponibles en el sistema');
    }
  }

  /**
   * Procesa todos los estudiantes
   */
  static async _processStudents(estudiantes, resultado, options) {
    for (const estudiante of estudiantes) {
      try {
        resultado.procesados++;

        // Verificar inscripciones previas
        if (await this._studentHasEnrollments(estudiante.id) && !options.force) {
          resultado.yaInscritos++;
          logger.debug(`Estudiante ${estudiante.email} ya tiene inscripciones`);
          continue;
        }

        // Inscribir estudiante
        const inscripcion = await EnrollmentService.setupStudentEnrollment(estudiante.id);

        if (!inscripcion.success) {
          this._recordError(resultado, estudiante, inscripcion.message);
          continue;
        }

        // Registrar éxito
        this._recordSuccess(resultado, estudiante, inscripcion);

      } catch (error) {
        this._recordError(resultado, estudiante, error.message);
      }
    }
  }

  /**
   * Verifica si estudiante tiene inscripciones
   */
  static async _studentHasEnrollments(userId) {
    const [careers, subjects] = await Promise.all([
      prisma.userCareer.count({
        where: { userId, periodo: CURRENT_PERIOD }
      }),
      prisma.userSubject.count({
        where: { userId, periodo: CURRENT_PERIOD }
      })
    ]);

    return careers > 0 || subjects > 0;
  }

  /**
   * Registra un error
   */
  static _recordError(resultado, estudiante, errorMessage) {
    resultado.errores++;
    resultado.erroresDetalle.push({
      userId: estudiante.id,
      email: estudiante.email,
      error: errorMessage
    });
    logger.error(`Error procesando estudiante ${estudiante.email}`, { error: errorMessage });
  }

  /**
   * Registra un éxito
   */
  static _recordSuccess(resultado, estudiante, inscripcion) {
    resultado.exitosos++;
    resultado.detalles.push({
      userId: estudiante.id,
      email: estudiante.email,
      carreras: inscripcion.careers,
      materias: inscripcion.subjects,
      success: true
    });

    logger.success(
      `✅ ${estudiante.email}: ${inscripcion.careers} carreras, ${inscripcion.subjects} materias`
    );
  }

  /**
   * Log de resumen final
   */
  static _logSyncSummary(resultado) {
    logger.success(
      `✅ Sincronización completada:\n` +
      `   - Total: ${resultado.total}\n` +
      `   - Exitosos: ${resultado.exitosos}\n` +
      `   - Ya inscritos: ${resultado.yaInscritos}\n` +
      `   - Errores: ${resultado.errores}\n` +
      `   - Duración: ${resultado.duracion}`
    );
  }
}

export default StudentSyncService;
