/**
 * Servicio de Evaluaciones de Estudiantes
 * Maneja la lógica de negocio para las respuestas de estudiantes a evaluaciones
 */

import { StudentEvaluationModel } from '../models/student-evaluation.model.js';
import { ResponseModel } from '../models/response.model.js';
import { EvaluationModel } from '../models/evaluation.model.js';
import { QuestionModel } from '../models/question.model.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('StudentEvaluationService');

export class StudentEvaluationService {
  /**
   * Iniciar una evaluación para un estudiante
   * @param {number} evaluationId - ID de la evaluación
   * @param {number} studentId - ID del estudiante
   * @returns {Object} Evaluación de estudiante iniciada
   */
  static async startEvaluation(evaluationId, studentId) {
    try {
      logger.info(`Iniciando evaluación ${evaluationId} para estudiante ${studentId}`);

      // Verificar que el estudiante puede responder
      const canRespond = await EvaluationModel.canStudentRespond(evaluationId, studentId);
      
      if (!canRespond.canRespond) {
        logger.warn(`Estudiante ${studentId} no puede responder evaluación ${evaluationId}: ${canRespond.reason}`);
        throw new Error(canRespond.reason);
      }

      // Verificar si ya tiene una evaluación iniciada
      const existing = await StudentEvaluationModel.findByEvaluationAndStudent(evaluationId, studentId);
      
      if (existing) {
        // Si ya está completada, lanzar error específico
        if (existing.completada) {
          logger.warn(`Estudiante ${studentId} ya completó la evaluación ${evaluationId}`);
          throw new Error('Ya completaste esta evaluación. No puedes modificar tus respuestas.');
        }

        logger.info(`Estudiante ${studentId} ya tiene evaluación ${evaluationId} iniciada (puede continuar)`);
          return existing;
      }

      // Crear nueva evaluación de estudiante
      const studentEvaluation = await StudentEvaluationModel.create({
        evaluationId,
        studentId
      });

      logger.success(`Evaluación ${evaluationId} iniciada para estudiante ${studentId}`);
      return studentEvaluation;
    } catch (error) {
      logger.error('Error iniciando evaluación', error);
      throw error;
    }
  }

  /**
   * Guardar respuestas de una evaluación
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @param {Array} responses - Array de respuestas
   * @param {string} comentario - Comentario opcional
   * @returns {Object} Evaluación completada
   */
  static async submitResponses(studentEvaluationId, responses, comentario = null) {
    try {
      logger.info(`Guardando respuestas para evaluación de estudiante ${studentEvaluationId}`);

      // Verificar que la evaluación existe
      const studentEvaluation = await StudentEvaluationModel.findById(studentEvaluationId);
      
      if (!studentEvaluation) {
        throw new Error('Evaluación de estudiante no encontrada');
      }

      // Verificar que no esté ya completada
      if (studentEvaluation.completada) {
        throw new Error('Esta evaluación ya fue completada');
      }

      // Obtener preguntas de la plantilla
      const evaluation = studentEvaluation.evaluation;
      const questions = await QuestionModel.findByTemplate(evaluation.template.id);

      // Validar que se respondieron todas las preguntas obligatorias
      const obligatoryQuestions = questions.filter(q => q.esObligatoria);
      const answeredQuestionIds = responses.map(r => parseInt(r.questionId));
      
      const missingQuestions = obligatoryQuestions.filter(
        q => !answeredQuestionIds.includes(q.id)
      );

      if (missingQuestions.length > 0) {
        throw new Error(`Faltan responder ${missingQuestions.length} preguntas obligatorias`);
      }

      // Validar formato de respuestas
      for (const response of responses) {
        const question = questions.find(q => q.id === parseInt(response.questionId));
        
        if (!question) {
          throw new Error(`Pregunta ${response.questionId} no encontrada en la plantilla`);
        }

        // Validar tipo de respuesta
        if (question.tipoRespuesta === 'escala') {
          if (!response.valorNumerico) {
            throw new Error(`La pregunta ${question.nroPregunta} requiere un valor numérico`);
          }
          
          const valor = parseInt(response.valorNumerico);
          if (valor < question.valorMinimo || valor > question.valorMaximo) {
            throw new Error(
              `La pregunta ${question.nroPregunta} debe tener un valor entre ${question.valorMinimo} y ${question.valorMaximo}`
            );
          }
        }
      }

      // Guardar respuestas en una transacción
      const savedResponses = [];
      
      for (const response of responses) {
        const saved = await ResponseModel.create({
          studentEvaluationId,
          questionId: response.questionId,
          valorNumerico: response.valorNumerico || null,
          valorTexto: response.valorTexto || null
        });
        savedResponses.push(saved);
      }

      // Marcar evaluación como completada
      const completedEvaluation = await StudentEvaluationModel.markAsCompleted(
        studentEvaluationId,
        comentario
      );

      logger.success(`Evaluación ${studentEvaluationId} completada con ${savedResponses.length} respuestas`);

      return {
        studentEvaluation: completedEvaluation,
        responses: savedResponses,
        totalResponses: savedResponses.length
      };
    } catch (error) {
      logger.error('Error guardando respuestas', error);
      throw error;
    }
  }

  /**
   * Obtener evaluación de estudiante por ID
   * @param {number} id - ID de la evaluación del estudiante
   * @returns {Object} Evaluación encontrada
   */
  static async getStudentEvaluationById(id) {
    try {
      const studentEvaluation = await StudentEvaluationModel.findById(id);
      
      if (!studentEvaluation) {
        throw new Error('Evaluación de estudiante no encontrada');
      }

      return studentEvaluation;
    } catch (error) {
      logger.error(`Error obteniendo evaluación de estudiante ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtener evaluaciones de un estudiante
   * @param {number} studentId - ID del estudiante
   * @param {boolean} completada - Filtrar por completadas/pendientes
   * @returns {Array} Lista de evaluaciones
   */
  static async getStudentEvaluations(studentId, completada = null) {
    try {
      logger.info(`Obteniendo evaluaciones del estudiante ${studentId}`);
      const evaluations = await StudentEvaluationModel.findByStudent(studentId, completada);
      logger.success(`${evaluations.length} evaluaciones encontradas`);
      return evaluations;
    } catch (error) {
      logger.error(`Error obteniendo evaluaciones del estudiante ${studentId}`, error);
      throw error;
    }
  }

  /**
   * Obtener progreso de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Object} Estadísticas de progreso
   */
  static async getEvaluationProgress(evaluationId) {
    try {
      logger.info(`Obteniendo progreso de evaluación ${evaluationId}`);
      const progress = await StudentEvaluationModel.getEvaluationProgress(evaluationId);
      
      if (!progress) {
        throw new Error('Evaluación no encontrada');
      }

      logger.success(`Progreso obtenido: ${progress.percentage}% completado`);
      return progress;
    } catch (error) {
      logger.error(`Error obteniendo progreso de evaluación ${evaluationId}`, error);
      throw error;
    }
  }

  /**
   * Obtener comentarios anónimos de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Array} Lista de comentarios
   */
  static async getAnonymousComments(evaluationId) {
    try {
      logger.info(`Obteniendo comentarios de evaluación ${evaluationId}`);
      const comments = await StudentEvaluationModel.getAnonymousComments(evaluationId);
      logger.success(`${comments.length} comentarios obtenidos`);
      return comments;
    } catch (error) {
      logger.error(`Error obteniendo comentarios de evaluación ${evaluationId}`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas detalladas de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Object} Estadísticas completas
   */
  static async getDetailedStatistics(evaluationId) {
    try {
      logger.info(`Obteniendo estadísticas detalladas de evaluación ${evaluationId}`);

      const [
        progress,
        responseStats,
        generalAverage,
        comments
      ] = await Promise.all([
        this.getEvaluationProgress(evaluationId),
        ResponseModel.getEvaluationStatistics(evaluationId),
        ResponseModel.getGeneralAverage(evaluationId),
        StudentEvaluationModel.getAnonymousComments(evaluationId)
      ]);

      const statistics = {
        progress,
        generalAverage,
        questionStatistics: responseStats,
        totalComments: comments.length,
        comments: comments.map(c => ({
          comentario: c.comentario,
          fecha: c.fechaCompleta
        }))
      };

      logger.success(`Estadísticas detalladas obtenidas para evaluación ${evaluationId}`);
      return statistics;
    } catch (error) {
      logger.error(`Error obteniendo estadísticas detalladas de evaluación ${evaluationId}`, error);
      throw error;
    }
  }

  /**
   * Verificar si un estudiante puede continuar una evaluación iniciada
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @param {number} studentId - ID del estudiante
   * @returns {Object} Estado de la evaluación
   */
  static async canContinueEvaluation(studentEvaluationId, studentId) {
    try {
      const studentEvaluation = await StudentEvaluationModel.findById(studentEvaluationId);

      if (!studentEvaluation) {
        return { canContinue: false, reason: 'Evaluación no encontrada' };
      }

      if (studentEvaluation.studentId !== studentId) {
        return { canContinue: false, reason: 'Esta evaluación no te pertenece' };
      }

      if (studentEvaluation.completada) {
        return { canContinue: false, reason: 'Esta evaluación ya fue completada' };
      }

      // Verificar que la evaluación aún esté abierta
      const evaluation = studentEvaluation.evaluation;
      const now = new Date();

      if (now > evaluation.fechaCierre) {
        return { canContinue: false, reason: 'El periodo de evaluación ha cerrado' };
      }

      return {
        canContinue: true,
        studentEvaluation,
        existingResponses: studentEvaluation.responses
      };
    } catch (error) {
      logger.error('Error verificando continuidad de evaluación', error);
      throw error;
    }
  }

  /**
   * Actualizar respuestas parciales (guardar progreso)
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @param {Array} responses - Array de respuestas parciales
   * @returns {Object} Respuestas guardadas
   */
  static async savePartialResponses(studentEvaluationId, responses) {
    try {
      logger.info(`Guardando respuestas parciales para evaluación ${studentEvaluationId}`);

      const studentEvaluation = await StudentEvaluationModel.findById(studentEvaluationId);

      if (!studentEvaluation) {
        throw new Error('Evaluación de estudiante no encontrada');
      }

      if (studentEvaluation.completada) {
        throw new Error('No se pueden modificar respuestas de una evaluación completada');
      }

      const savedResponses = [];

      for (const response of responses) {
        // Verificar si ya existe una respuesta para esta pregunta
        const existing = await ResponseModel.findByEvaluationAndQuestion(
          studentEvaluationId,
          response.questionId
        );

        if (existing) {
          // Actualizar respuesta existente
          const updated = await ResponseModel.update(existing.id, {
            valorNumerico: response.valorNumerico,
            valorTexto: response.valorTexto
          });
          savedResponses.push(updated);
        } else {
          // Crear nueva respuesta
          const created = await ResponseModel.create({
            studentEvaluationId,
            questionId: response.questionId,
            valorNumerico: response.valorNumerico || null,
            valorTexto: response.valorTexto || null
          });
          savedResponses.push(created);
        }
      }

      logger.success(`${savedResponses.length} respuestas parciales guardadas`);

      return {
        saved: savedResponses.length,
        responses: savedResponses
      };
    } catch (error) {
      logger.error('Error guardando respuestas parciales', error);
      throw error;
    }
  }
}

export default StudentEvaluationService;
