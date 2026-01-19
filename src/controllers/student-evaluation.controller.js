import { StudentEvaluationService } from '../services/student-evaluation.service.js';
import { ResponseModel } from '../models/response.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('StudentEvaluationController');

export class StudentEvaluationController {
  /**
   * Iniciar una evaluación
   * POST /api/student-evaluations/start
   */
  static async startEvaluation(req, res) {
    try {
      const { evaluationId } = req.body;
      const studentId = req.user.id;

      if (!evaluationId) {
        return errorResponse(res, 'Se requiere el ID de la evaluación', HTTP_STATUS.BAD_REQUEST);
      }

      const studentEvaluation = await StudentEvaluationService.startEvaluation(
        parseInt(evaluationId),
        studentId
      );

      return successResponse(
        res,
        studentEvaluation,
        'Evaluación iniciada correctamente',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      logger.error('Error iniciando evaluación', error);
      return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Enviar respuestas completas
   * POST /api/student-evaluations/:id/submit
   */
  static async submitResponses(req, res) {
    try {
      const { id } = req.params;
      const { responses, comentario } = req.body;
      const studentId = req.user.id;

      if (!responses || !Array.isArray(responses)) {
        return errorResponse(res, 'Se requiere un array de respuestas', HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar que sea el estudiante correcto
      const studentEvaluation = await StudentEvaluationService.getStudentEvaluationById(parseInt(id));
      
      if (studentEvaluation.studentId !== studentId) {
        return errorResponse(
          res,
          'No tienes permisos para enviar esta evaluación',
          HTTP_STATUS.FORBIDDEN
        );
      }

      const result = await StudentEvaluationService.submitResponses(
        parseInt(id),
        responses,
        comentario
      );

      return successResponse(
        res,
        result,
        'Evaluación completada exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error enviando respuestas', error);
      return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Guardar respuestas parciales
   * PUT /api/student-evaluations/:id/responses
   */
  static async savePartialResponses(req, res) {
    try {
      const { id } = req.params;
      const { responses } = req.body;
      const studentId = req.user.id;

      if (!responses || !Array.isArray(responses)) {
        return errorResponse(res, 'Se requiere un array de respuestas', HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar que sea el estudiante correcto
      const studentEvaluation = await StudentEvaluationService.getStudentEvaluationById(parseInt(id));
      
      if (studentEvaluation.studentId !== studentId) {
        return errorResponse(
          res,
          'No tienes permisos para guardar esta evaluación',
          HTTP_STATUS.FORBIDDEN
        );
      }

      const result = await StudentEvaluationService.savePartialResponses(
        parseInt(id),
        responses
      );

      return successResponse(
        res,
        result,
        'Progreso guardado exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error guardando respuestas parciales', error);
      return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Obtener mis evaluaciones
   * GET /api/student-evaluations/my
   */
  static async getMyEvaluations(req, res) {
    try {
      const studentId = req.user.id;
      const { completada } = req.query;

      const filter = completada !== undefined
        ? completada === 'true'
        : null;

      const evaluations = await StudentEvaluationService.getStudentEvaluations(studentId, filter);

      return successResponse(
        res,
        evaluations,
        'Evaluaciones obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo evaluaciones', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Verificar si puedo continuar una evaluación
   * GET /api/student-evaluations/:id/can-continue
   */
  static async canContinueEvaluation(req, res) {
    try {
      const { id } = req.params;
      const studentId = req.user.id;

      const result = await StudentEvaluationService.canContinueEvaluation(
        parseInt(id),
        studentId
      );

      return successResponse(
        res,
        result,
        result.canContinue ? 'Puedes continuar la evaluación' : result.reason,
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error verificando evaluación', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener evaluación por ID
   * GET /api/student-evaluations/:id
   */
  static async getStudentEvaluationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRoles = req.userRoles || [];

      const studentEvaluation = await StudentEvaluationService.getStudentEvaluationById(parseInt(id));

      // Verificar permisos: solo el estudiante, el profesor o admin pueden ver
      const isOwner = studentEvaluation.studentId === userId;
      const isTeacher = studentEvaluation.evaluation.teacherId === userId;
      const isAdmin = userRoles.includes('ADMIN');

      if (!isOwner && !isTeacher && !isAdmin) {
        return errorResponse(
          res,
          'No tienes permisos para ver esta evaluación',
          HTTP_STATUS.FORBIDDEN
        );
      }

      return successResponse(
        res,
        studentEvaluation,
        'Evaluación obtenida exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo evaluación', error);
      return errorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
  }

  /**
   * Obtener progreso de una evaluación
   * GET /api/student-evaluations/evaluation/:evaluationId/progress
   */
  static async getEvaluationProgress(req, res) {
    try {
      const { evaluationId } = req.params;

      const progress = await StudentEvaluationService.getEvaluationProgress(parseInt(evaluationId));

      return successResponse(
        res,
        progress,
        'Progreso obtenido exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo progreso', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener comentarios anónimos
   * GET /api/student-evaluations/evaluation/:evaluationId/comments
   */
  static async getAnonymousComments(req, res) {
    try {
      const { evaluationId } = req.params;

      const comments = await StudentEvaluationService.getAnonymousComments(parseInt(evaluationId));

      return successResponse(
        res,
        comments,
        'Comentarios obtenidos exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo comentarios', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener estadísticas detalladas
   * GET /api/student-evaluations/evaluation/:evaluationId/statistics
   */
  static async getDetailedStatistics(req, res) {
    try {
      const { evaluationId } = req.params;

      const statistics = await StudentEvaluationService.getDetailedStatistics(parseInt(evaluationId));

      return successResponse(
        res,
        statistics,
        'Estadísticas obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo estadísticas', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener distribución de respuestas de una pregunta
   * GET /api/student-evaluations/evaluation/:evaluationId/question/:questionId/distribution
   */
  static async getQuestionDistribution(req, res) {
    try {
      const { evaluationId, questionId } = req.params;

      const distribution = await ResponseModel.getQuestionDistribution(
        parseInt(evaluationId),
        parseInt(questionId)
      );

      return successResponse(
        res,
        distribution,
        'Distribución obtenida exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo distribución', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener respuestas de texto de una pregunta
   * GET /api/student-evaluations/evaluation/:evaluationId/question/:questionId/text-responses
   */
  static async getQuestionTextResponses(req, res) {
    try {
      const { evaluationId, questionId } = req.params;

      const responses = await ResponseModel.getTextResponsesByQuestion(
        parseInt(evaluationId),
        parseInt(questionId)
      );

      return successResponse(
        res,
        responses,
        'Respuestas de texto obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo respuestas de texto', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  // ==========================================
  // 🆕 CONTROLADORES PARA ANÁLISIS DE SENTIMIENTO
  // ==========================================

  /**
   * Actualizar sentimiento de un comentario
   * PUT /api/student-evaluations/:id/sentiment
   * Body: { sentiment: string, score?: number }
   */
  static async updateSentiment(req, res) {
    try {
      const { id } = req.params;
      const { sentiment, score } = req.body;

      if (!sentiment) {
        return errorResponse(
          res,
          'Se requiere el tipo de sentimiento',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const updated = await StudentEvaluationService.updateSentiment(
        parseInt(id),
        sentiment,
        score || null
      );

      return successResponse(
        res,
        updated,
        MESSAGES.SENTIMENT.UPDATED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error actualizando sentimiento', error);
      return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Obtener comentarios sin analizar
   * GET /api/student-evaluations/unanalyzed
   * Query: evaluationId (opcional)
   */
  static async getUnanalyzedComments(req, res) {
    try {
      const { evaluationId } = req.query;

      const comments = await StudentEvaluationService.getUnanalyzedComments(
        evaluationId ? parseInt(evaluationId) : null
      );

      return successResponse(
        res,
        comments,
        `${comments.length} comentarios sin analizar`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo comentarios sin analizar', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener estadísticas de sentimientos
   * GET /api/student-evaluations/evaluation/:evaluationId/sentiment-stats
   */
  static async getSentimentStatistics(req, res) {
    try {
      const { evaluationId } = req.params;

      const stats = await StudentEvaluationService.getSentimentStatistics(
        parseInt(evaluationId)
      );

      return successResponse(
        res,
        stats,
        'Estadísticas de sentimientos obtenidas',
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo estadísticas de sentimientos', error);
      return errorResponse(res, error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * Obtener comentarios por tipo de sentimiento
   * GET /api/student-evaluations/evaluation/:evaluationId/sentiment/:type
   */
  static async getCommentsBySentiment(req, res) {
    try {
      const { evaluationId, type } = req.params;

      const comments = await StudentEvaluationService.getCommentsBySentiment(
        parseInt(evaluationId),
        type
      );

      return successResponse(
        res,
        comments,
        `${comments.length} comentarios ${type} encontrados`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      logger.error('Error obteniendo comentarios por sentimiento', error);
      return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }
  }
}

export default StudentEvaluationController;
