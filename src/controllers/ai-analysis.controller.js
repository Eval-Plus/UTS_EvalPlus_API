/**
 * Controlador de Análisis de IA para Docentes
 */

import { TeacherAIAnalysisService } from '../services/ai/teacher-ai-analysis.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createLogger } from '../utils/logger.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';

const logger = createLogger('AIAnalysisController');

export class AIAnalysisController {
  /**
   * Obtiene el análisis existente de un docente
   * GET /api/admin/ai-analysis/teachers/:teacherId?periodo=2025-1
   */
  static async getAnalysis(req, res) {
    try {
      const { teacherId } = req.params;
      const { periodo } = req.query;

      if (!periodo) {
        return errorResponse(res, 'El parámetro "periodo" es requerido', HTTP_STATUS.BAD_REQUEST);
      }

      logger.info(`Obteniendo análisis IA — Docente: ${teacherId}, Período: ${periodo}`);

      const analysis = await TeacherAIAnalysisService.getAnalysis(
        parseInt(teacherId),
        periodo
      );

      if (!analysis) {
        return errorResponse(
          res,
          MESSAGES.AI_ANALYSIS.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return successResponse(res, analysis, MESSAGES.AI_ANALYSIS.RETRIEVED);

    } catch (error) {
      logger.error('Error obteniendo análisis IA', error);
      return errorResponse(res, MESSAGES.AI_ANALYSIS.GENERATION_FAILED, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Genera (o regenera) el análisis de IA de un docente
   * POST /api/admin/ai-analysis/teachers/:teacherId/generate
   * @body { periodo: string, teacherName: string }
   */
  static async generateAnalysis(req, res) {
    try {
      const { teacherId } = req.params;
      const { periodo, teacherName } = req.body;

      if (!periodo) {
        return errorResponse(res, 'El campo "periodo" es requerido', HTTP_STATUS.BAD_REQUEST);
      }

      if (!teacherName) {
        return errorResponse(res, 'El campo "teacherName" es requerido', HTTP_STATUS.BAD_REQUEST);
      }

      logger.info(`Generando análisis IA — Docente: ${teacherId} (${teacherName}), Período: ${periodo}`);

      const analysis = await TeacherAIAnalysisService.generateAnalysis(
        parseInt(teacherId),
        periodo,
        teacherName
      );

      return successResponse(res, analysis, MESSAGES.AI_ANALYSIS.GENERATED, HTTP_STATUS.OK);

    } catch (error) {
      logger.error('Error generando análisis IA', error);

      // Error de datos insuficientes — no es un 500
      if (error.message?.startsWith('NO_DATA:')) {
        return errorResponse(
          res,
          MESSAGES.AI_ANALYSIS.NO_DATA,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return errorResponse(
        res,
        MESSAGES.AI_ANALYSIS.GENERATION_FAILED,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Health check del servicio de IA
   * GET /api/admin/ai-analysis/health
   */
  static async healthCheck(req, res) {
    try {
      const health = await TeacherAIAnalysisService.healthCheck();
      return successResponse(res, health, 'Estado del servicio obtenido');
    } catch (error) {
      return errorResponse(res, 'Error verificando estado del servicio', HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export default AIAnalysisController;
