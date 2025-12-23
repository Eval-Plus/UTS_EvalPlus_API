/**
 * Servicio de Evaluaciones
 * Maneja toda la lógica de negocio relacionada con evaluaciones docentes
 */

import { EvaluationModel } from '../models/evaluation.model.js';
import { EvaluationTemplateModel } from '../models/evaluation-template.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { UserModel } from '../models/user.model.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('EvaluationService');

export class EvaluationService {
  /**
   * Obtener todas las evaluaciones activas
   */
  static async getAllEvaluations() {
    try {
      logger.info('Obteniendo todas las evaluaciones');
      const evaluations = await EvaluationModel.findAll();
      logger.success(`${evaluations.length} evaluaciones obtenidas`);
      return evaluations;
    } catch (error) {
      logger.error('Error obteniendo evaluaciones', error);
      throw error;
    }
  }

  /**
   * Obtener evaluación por ID
   */
  static async getEvaluationById(id) {
    try {
      logger.debug(`Buscando evaluación con ID: ${id}`);
      const evaluation = await EvaluationModel.findById(id);

      if (!evaluation) {
        logger.warn(`Evaluación ${id} no encontrada`);
        throw new Error('Evaluación no encontrada');
      }

      logger.success(`Evaluación encontrada: ${evaluation.subject.nombre}`);
      return evaluation;
    } catch (error) {
      logger.error(`Error obteniendo evaluación ${id}`, error);
      throw error;
    }
  }

  /**
  * Obtener evaluaciones de un profesor con datos formateados para Flutter
  */
  static async getTeacherEvaluations(teacherId, periodo = null) {
    try {
      logger.info(`Obteniendo evaluaciones del profesor ${teacherId}`);
      const evaluations = await EvaluationModel.findByTeacher(teacherId, periodo);
      
      // 🆕 Formatear datos para Flutter
      const formattedEvaluations = evaluations.map(evaluation => {
        const totalStudents = evaluation.subject.students?.length || 0;
        const completedEvaluations = evaluation.studentResponses?.length || 0;
        const pendingEvaluations = totalStudents - completedEvaluations;
        
        // 🆕 Calcular estado basado en fechas
        const now = new Date();
        let status = 'upcoming';
        
        if (now >= evaluation.fechaInicio && now <= evaluation.fechaCierre) {
          status = 'active';
        } else if (now > evaluation.fechaCierre) {
          status = 'closed';
        }
        
        return {
          id: evaluation.id,
          subjectName: evaluation.subject.nombre,
          subjectCode: evaluation.subject.codigo,
          careerName: evaluation.subject.career?.nombre || 'Sin carrera',
          totalStudents,
          completedEvaluations,
          pendingEvaluations,
          period: evaluation.periodo,
          status,
          fechaInicio: evaluation.fechaInicio,
          fechaCierre: evaluation.fechaCierre,
          // Datos adicionales por si se necesitan
          templateId: evaluation.template.id,
          templateName: evaluation.template.nombre
        };
      });
      
      logger.success(`${formattedEvaluations.length} evaluaciones formateadas para profesor ${teacherId}`);
      return formattedEvaluations;
    } catch (error) {
      logger.error(`Error obteniendo evaluaciones del profesor ${teacherId}`, error);
      throw error;
    }
  }

  /**
   * Obtener evaluaciones disponibles para un estudiante
   */
  static async getStudentAvailableEvaluations(studentId) {
    try {
      logger.info(`Obteniendo evaluaciones disponibles para estudiante ${studentId}`);
      const evaluations = await EvaluationModel.findAvailableForStudent(studentId);
      logger.success(`${evaluations.length} evaluaciones disponibles para estudiante ${studentId}`);
      return evaluations;
    } catch (error) {
      logger.error(`Error obteniendo evaluaciones para estudiante ${studentId}`, error);
      throw error;
    }
  }

  /**
   * Obtener evaluaciones completadas por un estudiante
   */
  static async getStudentCompletedEvaluations(studentId) {
    try {
      logger.info(`Obteniendo evaluaciones completadas por estudiante ${studentId}`);
      const evaluations = await EvaluationModel.findCompletedByStudent(studentId);
      logger.success(`${evaluations.length} evaluaciones completadas por estudiante ${studentId}`);
      return evaluations;
    } catch (error) {
      logger.error(`Error obteniendo evaluaciones completadas por estudiante ${studentId}`, error);
      throw error;
    }
  }

  /**
   * Obtener evaluaciones pendientes de un estudiante
   */
  static async getStudentPendingEvaluations(studentId) {
    try {
      logger.info(`Obteniendo evaluaciones pendientes para estudiante ${studentId}`);
      const evaluations = await EvaluationModel.findPendingByStudent(studentId);
      logger.success(`${evaluations.length} evaluaciones pendientes para estudiante ${studentId}`);
      return evaluations;
    } catch (error) {
      logger.error(`Error obteniendo evaluaciones pendientes para estudiante ${studentId}`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de evaluaciones de un estudiante
   */
  static async getStudentEvaluationStats(studentId) {
    try {
      logger.info(`Obteniendo estadísticas de evaluaciones para estudiante ${studentId}`);
      
      const available = await this.getStudentAvailableEvaluations(studentId);
      const completed = await this.getStudentCompletedEvaluations(studentId);
      const pending = await this.getStudentPendingEvaluations(studentId);

      const stats = {
        total: available.length,
        completed: completed.length,
        pending: pending.length,
        completionRate: available.length > 0 
          ? ((completed.length / available.length) * 100).toFixed(2)
          : 0
      };

      logger.success(`Estadísticas obtenidas para estudiante ${studentId}`);
      return stats;
    } catch (error) {
      logger.error(`Error obteniendo estadísticas para estudiante ${studentId}`, error);
      throw error;
    }
  }

  /**
   * Crear nueva evaluación
   */
  static async createEvaluation(data) {
    try {
      logger.info('Creando nueva evaluación');

      // Validar campos obligatorios
      if (!data.subjectId || !data.teacherId || !data.periodo || !data.fechaInicio || !data.fechaCierre) {
        throw new Error('Faltan campos obligatorios: subjectId, teacherId, periodo, fechaInicio, fechaCierre');
      }

      // Validar fechas
      const fechaInicio = new Date(data.fechaInicio);
      const fechaCierre = new Date(data.fechaCierre);

      if (fechaInicio >= fechaCierre) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de cierre');
      }

      // Verificar que la materia existe
      const subject = await SubjectModel.findById(data.subjectId);
      if (!subject) {
        throw new Error('La materia especificada no existe');
      }

      // Verificar que el profesor existe y coincide con la materia
      const teacher = await UserModel.findById(data.teacherId);
      if (!teacher) {
        throw new Error('El profesor especificado no existe');
      }

      if (subject.teacherId !== data.teacherId) {
        logger.warn(`El profesor ${data.teacherId} no dicta la materia ${data.subjectId}`);
        // Esto es una advertencia, no un error crítico
      }

      // Verificar si ya existe una evaluación para esta combinación
      const exists = await EvaluationModel.exists(data.subjectId, data.teacherId, data.periodo);
      if (exists) {
        throw new Error(`Ya existe una evaluación para esta materia, profesor y periodo`);
      }

      // Si no se especifica templateId, usar el template por defecto
      let templateId = data.templateId;
      if (!templateId) {
        const defaultTemplate = await EvaluationTemplateModel.findDefault();
        if (!defaultTemplate) {
          throw new Error('No se encontró una plantilla de evaluación por defecto');
        }
        templateId = defaultTemplate.id;
      }

      // Crear la evaluación
      const newEvaluation = await EvaluationModel.create({
        ...data,
        templateId
      });

      logger.success(`Evaluación creada: ${newEvaluation.subject.nombre} - ${newEvaluation.periodo} (ID: ${newEvaluation.id})`);

      return newEvaluation;
    } catch (error) {
      logger.error('Error creando evaluación', error);
      throw error;
    }
  }

  /**
   * Actualizar evaluación
   */
  static async updateEvaluation(id, data) {
    try {
      logger.info(`Actualizando evaluación ${id}`);

      // Verificar que existe
      await this.getEvaluationById(id);

      // Validar fechas si se están actualizando
      if (data.fechaInicio && data.fechaCierre) {
        const fechaInicio = new Date(data.fechaInicio);
        const fechaCierre = new Date(data.fechaCierre);

        if (fechaInicio >= fechaCierre) {
          throw new Error('La fecha de inicio debe ser anterior a la fecha de cierre');
        }
      }

      const updatedEvaluation = await EvaluationModel.update(id, data);
      logger.success(`Evaluación ${id} actualizada`);

      return updatedEvaluation;
    } catch (error) {
      logger.error(`Error actualizando evaluación ${id}`, error);
      throw error;
    }
  }

  /**
   * Desactivar evaluación
   */
  static async deleteEvaluation(id) {
    try {
      logger.info(`Desactivando evaluación ${id}`);

      // Verificar que existe
      await this.getEvaluationById(id);

      const deletedEvaluation = await EvaluationModel.delete(id);
      logger.success(`Evaluación ${id} desactivada`);

      return deletedEvaluation;
    } catch (error) {
      logger.error(`Error desactivando evaluación ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de una evaluación
   */
  static async getEvaluationStats(evaluationId) {
    try {
      logger.info(`Obteniendo estadísticas de evaluación ${evaluationId}`);
      
      const stats = await EvaluationModel.getStats(evaluationId);
      
      if (!stats) {
        throw new Error('Evaluación no encontrada');
      }

      logger.success(`Estadísticas obtenidas para evaluación ${evaluationId}`);
      return stats;
    } catch (error) {
      logger.error(`Error obteniendo estadísticas de evaluación ${evaluationId}`, error);
      throw error;
    }
  }

  /**
   * Verificar si un estudiante puede responder una evaluación
   */
  static async canStudentRespond(evaluationId, studentId) {
    try {
      logger.debug(`Verificando si estudiante ${studentId} puede responder evaluación ${evaluationId}`);
      
      const result = await EvaluationModel.canStudentRespond(evaluationId, studentId);
      
      if (result.canRespond) {
        logger.success(`Estudiante ${studentId} puede responder evaluación ${evaluationId}`);
      } else {
        logger.warn(`Estudiante ${studentId} NO puede responder evaluación ${evaluationId}: ${result.reason}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error verificando permisos para evaluación ${evaluationId}`, error);
      throw error;
    }
  }

  /**
   * Crear evaluaciones automáticas para todas las materias con profesor asignado
   * en un periodo específico
   */
  static async createBulkEvaluations(periodo, fechaInicio, fechaCierre) {
    try {
      logger.info(`Creando evaluaciones masivas para periodo ${periodo}`);

      // Obtener todas las materias activas con profesor asignado
      const subjects = await SubjectModel.findAll();
      const subjectsWithTeacher = subjects.filter(s => s.teacherId !== null);

      if (subjectsWithTeacher.length === 0) {
        logger.warn('No hay materias con profesor asignado');
        return [];
      }

      // Obtener plantilla por defecto
      const defaultTemplate = await EvaluationTemplateModel.findDefault();
      if (!defaultTemplate) {
        throw new Error('No se encontró una plantilla de evaluación por defecto');
      }

      const createdEvaluations = [];
      const skippedEvaluations = [];

      for (const subject of subjectsWithTeacher) {
        try {
          // Verificar si ya existe
          const exists = await EvaluationModel.exists(subject.id, subject.teacherId, periodo);
          
          if (exists) {
            skippedEvaluations.push({
              subjectId: subject.id,
              subjectName: subject.nombre,
              reason: 'Ya existe evaluación para este periodo'
            });
            continue;
          }

          // Crear evaluación
          const evaluation = await EvaluationModel.create({
            templateId: defaultTemplate.id,
            subjectId: subject.id,
            teacherId: subject.teacherId,
            periodo,
            fechaInicio: new Date(fechaInicio),
            fechaCierre: new Date(fechaCierre),
            esObligatoria: true,
            activo: true
          });

          createdEvaluations.push(evaluation);
          logger.success(`Evaluación creada para ${subject.nombre}`);
        } catch (error) {
          logger.error(`Error creando evaluación para materia ${subject.nombre}`, error);
          skippedEvaluations.push({
            subjectId: subject.id,
            subjectName: subject.nombre,
            reason: error.message
          });
        }
      }

      logger.success(`Evaluaciones masivas creadas: ${createdEvaluations.length} exitosas, ${skippedEvaluations.length} omitidas`);

      return {
        created: createdEvaluations,
        skipped: skippedEvaluations,
        summary: {
          total: subjectsWithTeacher.length,
          created: createdEvaluations.length,
          skipped: skippedEvaluations.length
        }
      };
    } catch (error) {
      logger.error('Error creando evaluaciones masivas', error);
      throw error;
    }
  }
}

export default EvaluationService;
