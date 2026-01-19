/**
 * Controlador de Análisis de Sentimiento
 * Maneja endpoints relacionados con análisis de IA
 */

import { StudentEvaluationService } from '../services/student-evaluation.service.js';
import { SentimentAnalysisService } from '../services/ai/sentiment-analysis.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SentimentController');

export class SentimentController {
  /**
   * Re-analizar comentarios pendientes
   * POST /api/sentiment/reanalyze
   * Body: { evaluationId?: number }
   * @access Private (Admin)
   */
  static async reanalyzeComments(req, res) {
    try {
      const { evaluationId } = req.body;

      logger.info(`Iniciando re-análisis de comentarios${evaluationId ? ` para evaluación ${evaluationId}` : ''}`);

      const result = await StudentEvaluationService.reanalyzeComments(
        evaluationId ? parseInt(evaluationId) : null
      );

      return successResponse(
        res,
        result,
        `Re-análisis completado: ${result.success} exitosos, ${result.failed} fallidos`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error en re-análisis', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Analizar un comentario específico manualmente
   * POST /api/sentiment/analyze/:id
   * @access Private (Admin)
   */
  static async analyzeComment(req, res) {
    try {
      const { id } = req.params;

      logger.info(`Analizando comentario de evaluación ${id}`);

      const studentEvaluation = await StudentEvaluationService.getStudentEvaluationById(parseInt(id));

      if (!studentEvaluation.comentario) {
        return errorResponse(
          res,
          MESSAGES.SENTIMENT.NO_COMMENT,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const result = await SentimentAnalysisService.analyzeAndUpdate(
        parseInt(id),
        studentEvaluation.comentario
      );

      return successResponse(
        res,
        result,
        MESSAGES.SENTIMENT.ANALYZED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error analizando comentario', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener estadísticas del servicio de IA
   * GET /api/sentiment/stats
   * @access Private (Admin)
   */
  static async getServiceStats(req, res) {
    try {
      const stats = SentimentAnalysisService.getStats();

      return successResponse(
        res,
        stats,
        'Estadísticas del servicio de IA obtenidas',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo estadísticas', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Precargar el modelo de IA
   * POST /api/sentiment/load-model
   * @access Private (Admin)
   */
  static async loadModel(req, res) {
    try {
      logger.info('Iniciando carga del modelo de IA...');

      await SentimentAnalysisService.loadModel();

      const stats = SentimentAnalysisService.getStats();

      return successResponse(
        res,
        stats,
        MESSAGES.SENTIMENT.MODEL_READY,
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error cargando modelo', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Probar análisis con texto personalizado (para testing)
   * POST /api/sentiment/test
   * Body: { text: string }
   * @access Private (Admin)
   */
  static async testAnalysis(req, res) {
    try {
      const { text } = req.body;

      if (!text || text.trim().length === 0) {
        return errorResponse(
          res,
          'Se requiere un texto para analizar',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      logger.info('Probando análisis de sentimiento...');

      const result = await SentimentAnalysisService.analyzeComment(text);

      return successResponse(
        res,
        {
          text,
          analysis: result
        },
        'Análisis de prueba completado',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error en análisis de prueba', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export default SentimentController;
