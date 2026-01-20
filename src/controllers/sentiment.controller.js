/**
 * Controlador de Análisis de Sentimiento
 * Maneja las peticiones relacionadas con el análisis de sentimientos usando Hugging Face
 */

import { SentimentAnalysisService } from '../services/ai/sentiment-analysis.service.js';
import { StudentEvaluationModel } from '../models/student-evaluation.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createLogger } from '../utils/logger.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';

const logger = createLogger('SentimentController');

export class SentimentController {
  /**
   * Re-analizar comentarios pendientes
   * POST /api/sentiment/reanalyze
   * @body { evaluationId?: number }
   */
  static async reanalyzeComments(req, res) {
    try {
      const { evaluationId } = req.body;

      logger.info(`Re-analizando comentarios${evaluationId ? ` de evaluación ${evaluationId}` : ''}`);

      // Obtener comentarios sin analizar
      const unanalyzed = await StudentEvaluationModel.findUnanalyzedComments(
        evaluationId ? parseInt(evaluationId) : null
      );

      if (unanalyzed.length === 0) {
        return successResponse(
          res,
          {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            results: []
          },
          'No hay comentarios pendientes de análisis',
          HTTP_STATUS.OK
        );
      }

      logger.info(`Encontrados ${unanalyzed.length} comentarios sin analizar`);

      // Analizar en lote
      const result = await SentimentAnalysisService.analyzeBatch(unanalyzed);

      return successResponse(
        res,
        result,
        MESSAGES.SENTIMENT.BATCH_ANALYZED,
        HTTP_STATUS.OK
      );

    } catch (error) {
      logger.error('Error re-analizando comentarios', error);
      return errorResponse(
        res,
        MESSAGES.SENTIMENT.ANALYSIS_FAILED,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Analizar manualmente un comentario específico
   * POST /api/sentiment/analyze/:id
   * @params id - ID de la evaluación del estudiante
   */
  static async analyzeComment(req, res) {
    try {
      const { id } = req.params;

      logger.info(`Analizando comentario de evaluación ${id}`);

      // Verificar que existe
      const studentEvaluation = await StudentEvaluationModel.findById(parseInt(id));

      if (!studentEvaluation) {
        return errorResponse(
          res,
          'Evaluación de estudiante no encontrada',
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Verificar que tenga comentario
      if (!studentEvaluation.comentario) {
        return errorResponse(
          res,
          MESSAGES.SENTIMENT.NO_COMMENT,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Analizar
      const result = await SentimentAnalysisService.analyzeAndUpdate(
        parseInt(id),
        studentEvaluation.comentario
      );

      return successResponse(
        res,
        {
          id: result.id,
          sentiment: result.sentiment,
          sentimentScore: result.sentimentScore,
          sentimentAnalyzedAt: result.sentimentAnalyzedAt,
          analysis: result.analysis
        },
        MESSAGES.SENTIMENT.ANALYZED,
        HTTP_STATUS.OK
      );

    } catch (error) {
      logger.error('Error analizando comentario', error);
      return errorResponse(
        res,
        MESSAGES.SENTIMENT.ANALYSIS_FAILED,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener estadísticas del servicio de IA
   * GET /api/sentiment/stats
   */
  static async getServiceStats(req, res) {
    try {
      logger.info('Obteniendo estadísticas del servicio');

      const stats = SentimentAnalysisService.getStats();
      const health = await SentimentAnalysisService.healthCheck();

      return successResponse(
        res,
        {
          ...stats,
          health
        },
        'Estadísticas obtenidas exitosamente',
        HTTP_STATUS.OK
      );

    } catch (error) {
      logger.error('Error obteniendo estadísticas', error);
      return errorResponse(
        res,
        'Error obteniendo estadísticas del servicio',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Verificar estado de la API (health check)
   * POST /api/sentiment/load-model
   */
  static async loadModel(req, res) {
    try {
      logger.info('Verificando estado de la API de Hugging Face');

      const health = await SentimentAnalysisService.healthCheck();

      if (health.status === 'healthy') {
        return successResponse(
          res,
          health,
          MESSAGES.SENTIMENT.MODEL_READY,
          HTTP_STATUS.OK
        );
      } else {
        return errorResponse(
          res,
          MESSAGES.SENTIMENT.API_ERROR,
          HTTP_STATUS.INTERNAL_ERROR,
          health
        );
      }

    } catch (error) {
      logger.error('Error verificando estado de la API', error);
      return errorResponse(
        res,
        MESSAGES.SENTIMENT.API_ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Probar análisis con texto personalizado
   * POST /api/sentiment/test
   * @body { text: string }
   */
  static async testAnalysis(req, res) {
    try {
      const { text } = req.body;

      if (!text || text.trim().length === 0) {
        return errorResponse(
          res,
          'Debes proporcionar un texto para analizar',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      logger.info(`Probando análisis con texto: "${text.substring(0, 50)}..."`);

      const result = await SentimentAnalysisService.analyzeComment(text);

      return successResponse(
        res,
        {
          text,
          result
        },
        'Análisis de prueba completado',
        HTTP_STATUS.OK
      );

    } catch (error) {
      logger.error('Error en análisis de prueba', error);
      return errorResponse(
        res,
        MESSAGES.SENTIMENT.ANALYSIS_FAILED,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}

export default SentimentController;
