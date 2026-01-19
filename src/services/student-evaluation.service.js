/**
 * Servicio de Evaluaciones de Estudiantes
 * Maneja la lógica de negocio para las respuestas de estudiantes a evaluaciones
 */

import { StudentEvaluationModel } from '../models/student-evaluation.model.js';
import { ResponseModel } from '../models/response.model.js';
import { EvaluationModel } from '../models/evaluation.model.js';
import { QuestionModel } from '../models/question.model.js';
import { createLogger } from '../utils/logger.js';
import { SENTIMENT_TYPES } from '../config/constants.js';

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

      const canRespond = await EvaluationModel.canStudentRespond(evaluationId, studentId);
      
      if (!canRespond.canRespond) {
        logger.warn(`Estudiante ${studentId} no puede responder evaluación ${evaluationId}: ${canRespond.reason}`);
        throw new Error(canRespond.reason);
      }

      const existing = await StudentEvaluationModel.findByEvaluationAndStudent(evaluationId, studentId);
      
      if (existing) {
        if (existing.completada) {
          logger.warn(`Estudiante ${studentId} ya completó la evaluación ${evaluationId}`);
          throw new Error('Ya completaste esta evaluación. No puedes modificar tus respuestas.');
        }

        logger.info(`Estudiante ${studentId} ya tiene evaluación ${evaluationId} iniciada (puede continuar)`);
        return existing;
      }

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

      const studentEvaluation = await StudentEvaluationModel.findById(studentEvaluationId);
      
      if (!studentEvaluation) {
        throw new Error('Evaluación de estudiante no encontrada');
      }

      if (studentEvaluation.completada) {
        throw new Error('Esta evaluación ya fue completada');
      }

      const evaluation = studentEvaluation.evaluation;
      const questions = await QuestionModel.findByTemplate(evaluation.template.id);

      const obligatoryQuestions = questions.filter(q => q.esObligatoria);
      const answeredQuestionIds = responses.map(r => parseInt(r.questionId));
      
      const missingQuestions = obligatoryQuestions.filter(
        q => !answeredQuestionIds.includes(q.id)
      );

      if (missingQuestions.length > 0) {
        throw new Error(`Faltan responder ${missingQuestions.length} preguntas obligatorias`);
      }

      for (const response of responses) {
        const question = questions.find(q => q.id === parseInt(response.questionId));
        
        if (!question) {
          throw new Error(`Pregunta ${response.questionId} no encontrada en la plantilla`);
        }

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
        comments,
        sentimentStats
      ] = await Promise.all([
        this.getEvaluationProgress(evaluationId),
        ResponseModel.getEvaluationStatistics(evaluationId),
        ResponseModel.getGeneralAverage(evaluationId),
        StudentEvaluationModel.getAnonymousComments(evaluationId),
        StudentEvaluationModel.getSentimentStatistics(evaluationId)
      ]);

      const statistics = {
        progress,
        generalAverage,
        questionStatistics: responseStats,
        sentimentAnalysis: sentimentStats,
        totalComments: comments.length,
        comments: comments.map(c => ({
          comentario: c.comentario,
          fecha: c.fechaCompleta,
          sentiment: c.sentiment,
          sentimentScore: c.sentimentScore,
          sentimentAnalyzedAt: c.sentimentAnalyzedAt
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
        const existing = await ResponseModel.findByEvaluationAndQuestion(
          studentEvaluationId,
          response.questionId
        );

        if (existing) {
          const updated = await ResponseModel.update(existing.id, {
            valorNumerico: response.valorNumerico,
            valorTexto: response.valorTexto
          });
          savedResponses.push(updated);
        } else {
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

  // ==========================================
  // 🆕 MÉTODOS PARA ANÁLISIS DE SENTIMIENTO
  // ==========================================

  /**
   * Actualizar el sentimiento de un comentario
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @param {string} sentiment - Tipo de sentimiento
   * @param {number} score - Puntuación de confianza (0.0 - 1.0)
   * @returns {Object} Resultado de la actualización
   */
  static async updateSentiment(studentEvaluationId, sentiment, score = null) {
    try {
      logger.info(`Actualizando sentimiento para evaluación ${studentEvaluationId}`);

      // Validar tipo de sentimiento
      const validSentiments = Object.values(SENTIMENT_TYPES);
      if (!validSentiments.includes(sentiment)) {
        throw new Error(`Sentimiento inválido. Valores permitidos: ${validSentiments.join(', ')}`);
      }

      // Validar score si se proporciona
      if (score !== null && (score < 0 || score > 1)) {
        throw new Error('El score debe estar entre 0.0 y 1.0');
      }

      const studentEvaluation = await StudentEvaluationModel.findById(studentEvaluationId);

      if (!studentEvaluation) {
        throw new Error('Evaluación de estudiante no encontrada');
      }

      if (!studentEvaluation.comentario) {
        throw new Error('No hay comentario para analizar');
      }

      const updated = await StudentEvaluationModel.updateSentiment(
        studentEvaluationId,
        sentiment,
        score
      );

      logger.success(`Sentimiento actualizado: ${sentiment} (score: ${score})`);

      return updated;
    } catch (error) {
      logger.error('Error actualizando sentimiento', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios pendientes de análisis
   * @param {number} evaluationId - ID de la evaluación (opcional)
   * @returns {Array} Lista de comentarios sin analizar
   */
  static async getUnanalyzedComments(evaluationId = null) {
    try {
      logger.info(`Obteniendo comentarios sin analizar${evaluationId ? ` para evaluación ${evaluationId}` : ''}`);
      
      const comments = await StudentEvaluationModel.findUnanalyzedComments(evaluationId);
      
      logger.success(`${comments.length} comentarios sin analizar encontrados`);
      return comments;
    } catch (error) {
      logger.error('Error obteniendo comentarios sin analizar', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de sentimientos de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Object} Estadísticas de sentimientos
   */
  static async getSentimentStatistics(evaluationId) {
    try {
      logger.info(`Obteniendo estadísticas de sentimientos para evaluación ${evaluationId}`);
      
      const stats = await StudentEvaluationModel.getSentimentStatistics(evaluationId);
      
      logger.success('Estadísticas de sentimientos obtenidas');
      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de sentimientos', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios por tipo de sentimiento
   * @param {number} evaluationId - ID de la evaluación
   * @param {string} sentimentType - Tipo de sentimiento
   * @returns {Array} Lista de comentarios
   */
  static async getCommentsBySentiment(evaluationId, sentimentType) {
    try {
      // Validar tipo de sentimiento
      const validSentiments = Object.values(SENTIMENT_TYPES);
      if (!validSentiments.includes(sentimentType)) {
        throw new Error(`Sentimiento inválido. Valores permitidos: ${validSentiments.join(', ')}`);
      }

      logger.info(`Obteniendo comentarios ${sentimentType} para evaluación ${evaluationId}`);
      
      const comments = await StudentEvaluationModel.findBySentiment(evaluationId, sentimentType);
      
      logger.success(`${comments.length} comentarios ${sentimentType} encontrados`);
      return comments;
    } catch (error) {
      logger.error('Error obteniendo comentarios por sentimiento', error);
      throw error;
    }
  }
}

export default StudentEvaluationService;
