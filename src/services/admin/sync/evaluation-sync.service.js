/**
 * Servicio de Generación de Evaluaciones
 * Maneja la creación masiva de evaluaciones
 */

import { createLogger } from '../../../utils/logger.js';
import { EvaluationModel } from '../../../models/evaluation.model.js';
import { EvaluationTemplateModel } from '../../../models/evaluation-template.model.js';
import prisma from '../../../config/prisma.js';
import { SyncBaseService, CURRENT_PERIOD } from './sync-base.service.js';

const logger = createLogger('EvaluationSyncService');

export class EvaluationSyncService {
  /**
   * Genera evaluaciones masivas para un periodo
   */
  static async generateEvaluations(adminId, data) {
    logger.info(`📝 Generando evaluaciones masivas (Admin: ${adminId})`);

    const { periodo, fechaInicio, fechaCierre, templateId } = data;
    const startTime = Date.now();

    const resultado = {
      total: 0,
      creadas: 0,
      omitidas: 0,
      errores: 0,
      detalles: [],
      erroresDetalle: []
    };

    try {
      // 1. Validar requisitos
      await this._validateRequirements();

      // 2. Obtener plantilla
      const template = await this._getTemplate(templateId);

      // 3. Obtener materias elegibles
      const materias = await this._getEligibleSubjects(periodo);

      resultado.total = materias.length;
      logger.info(`📊 ${resultado.total} materias con profesor y estudiantes encontradas`);

      // 4. Crear evaluaciones
      await this._createEvaluations(
        materias,
        template,
        periodo || CURRENT_PERIOD,
        fechaInicio,
        fechaCierre,
        resultado
      );

      // 5. Guardar log
      const resultadoFinal = SyncBaseService.formatSyncResult(resultado, startTime);
      await SyncBaseService.saveSyncLog(adminId, 'evaluations', periodo || CURRENT_PERIOD, {
        ...resultadoFinal,
        templateId: template.id,
        templateNombre: template.nombre,
        fechaInicio,
        fechaCierre
      });

      this._logSyncSummary(resultadoFinal);

      return resultadoFinal;
    } catch (error) {
      logger.error('Error generando evaluaciones', error);
      throw error;
    }
  }

  /**
   * Valida que existan estudiantes y profesores
   */
  static async _validateRequirements() {
    const [totalEstudiantes, totalProfesores] = await Promise.all([
      prisma.user.count({
        where: {
          roles: {
            some: { role: { name: 'STUDENT' } }
          }
        }
      }),
      prisma.user.count({
        where: {
          roles: {
            some: { role: { name: 'TEACHER' } }
          }
        }
      })
    ]);

    if (totalEstudiantes === 0) {
      throw new Error(
        'No hay estudiantes registrados. Primero debe sincronizar estudiantes.'
      );
    }

    if (totalProfesores === 0) {
      throw new Error(
        'No hay profesores registrados. Primero debe sincronizar profesores.'
      );
    }
  }

  /**
   * Obtiene o valida la plantilla de evaluación
   */
  static async _getTemplate(templateId) {
    const template = templateId 
      ? await EvaluationTemplateModel.findById(templateId)
      : await EvaluationTemplateModel.findDefault();

    if (!template) {
      throw new Error('Plantilla de evaluación no encontrada');
    }

    return template;
  }

  /**
   * Obtiene materias elegibles para evaluación
   */
  static async _getEligibleSubjects(periodo) {
    const materias = await prisma.subject.findMany({
      where: {
        teacherId: { not: null },
        activo: true,
        students: {
          some: {
            periodo: periodo || CURRENT_PERIOD
          }
        }
      },
      include: {
        teacher: { select: { id: true, email: true } },
        career: { select: { nombre: true } },
        students: {
          where: {
            periodo: periodo || CURRENT_PERIOD
          }
        }
      }
    });

    if (materias.length === 0) {
      throw new Error(
        'No hay materias con profesor asignado y estudiantes inscritos. ' +
        'Primero debe sincronizar estudiantes y profesores.'
      );
    }

    return materias;
  }

  /**
   * Crea evaluaciones para todas las materias
   */
  static async _createEvaluations(materias, template, periodo, fechaInicio, fechaCierre, resultado) {
    for (const materia of materias) {
      try {
        // Verificar si ya existe
        const existe = await EvaluationModel.exists(
          materia.id,
          materia.teacherId,
          periodo
        );

        if (existe) {
          resultado.omitidas++;
          logger.debug(`Evaluación ya existe: ${materia.nombre} - ${periodo}`);
          continue;
        }

        // Crear evaluación
        const evaluation = await EvaluationModel.create({
          templateId: template.id,
          subjectId: materia.id,
          teacherId: materia.teacherId,
          periodo,
          fechaInicio: new Date(fechaInicio),
          fechaCierre: new Date(fechaCierre),
          esObligatoria: true,
          activo: true
        });

        // Registrar éxito
        resultado.creadas++;
        resultado.detalles.push({
          evaluationId: evaluation.id,
          materia: materia.nombre,
          profesor: materia.teacher.email,
          carrera: materia.career.nombre,
          estudiantesInscritos: materia.students.length,
          success: true
        });

        logger.success(
          `✅ Evaluación creada: ${materia.nombre} (${materia.students.length} estudiantes)`
        );
      } catch (error) {
        resultado.errores++;
        resultado.erroresDetalle.push({
          materia: materia.nombre,
          profesor: materia.teacher.email,
          error: error.message
        });
        logger.error(`Error creando evaluación para ${materia.nombre}`, error);
      }
    }
  }

  /**
   * Log de resumen final
   */
  static _logSyncSummary(resultado) {
    logger.success(
      `✅ Generación de evaluaciones completada:\n` +
      `   - Total: ${resultado.total}\n` +
      `   - Creadas: ${resultado.creadas}\n` +
      `   - Omitidas: ${resultado.omitidas}\n` +
      `   - Errores: ${resultado.errores}\n` +
      `   - Duración: ${resultado.duracion}`
    );
  }
}

export default EvaluationSyncService;
