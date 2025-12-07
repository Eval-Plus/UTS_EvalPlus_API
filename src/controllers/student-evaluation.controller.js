import { StudentEvaluationService } from '../services/student-evaluation.service.js';
import { ResponseModel } from '../models/response.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export class StudentEvaluationController {
  /**
   * Iniciar una evaluación para un estudiante
   * POST /api/student-evaluations/start
   * Body: { evaluationId }
   */
  static async startEvaluation(req, res) {
    try {
      const studentId = req.user.id;
      const { evaluationId } = req.body;

      if (!evaluationId) {
        return errorResponse(
          res,
          'El ID de la evaluación es requerido',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const studentEvaluation = await StudentEvaluationService.startEvaluation(
        evaluationId,
        studentId
      );

      return successResponse(
        res,
        studentEvaluation,
        'Evaluación iniciada exitosamente',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error iniciando evaluación:', error);

      if (error.message.includes('no puede responder')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.FORBIDDEN
        );
      }

      return errorResponse(
        res,
        'Error al iniciar evaluación',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Enviar respuestas completas de una evaluación
   * POST /api/student-evaluations/:id/submit
   * Body: { responses: [...], comentario: "..." }
   */
  static async submitResponses(req, res) {
    try {
      const { id } = req.params;
      const studentId = req.user.id;
      const { responses, comentario } = req.body;

      if (!responses || !Array.isArray(responses)) {
        return errorResponse(
          res,
          'Las respuestas deben ser un array',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (responses.length === 0) {
        return errorResponse(
          res,
          'Debe proporcionar al menos una respuesta',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Verificar que la evaluación pertenece al estudiante
      const canContinue = await StudentEvaluationService.canContinueEvaluation(
        parseInt(id),
        studentId
      );

      if (!canContinue.canContinue) {
        return errorResponse(
          res,
          canContinue.reason,
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
      console.error('Error enviando respuestas:', error);

      if (error.message.includes('Faltan responder')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('ya fue completada')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.CONFLICT
        );
      }

      return errorResponse(
        res,
        'Error al guardar respuestas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Guardar respuestas parciales (progreso)
   * PUT /api/student-evaluations/:id/responses
   * Body: { responses: [...] }
   */
  static async savePartialResponses(req, res) {
    try {
      const { id } = req.params;
      const studentId = req.user.id;
      const { responses } = req.body;

      if (!responses || !Array.isArray(responses)) {
        return errorResponse(
          res,
          'Las respuestas deben ser un array',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Verificar permisos
      const canContinue = await StudentEvaluationService.canContinueEvaluation(
        parseInt(id),
        studentId
      );

      if (!canContinue.canContinue) {
        return errorResponse(
          res,
          canContinue.reason,
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
      console.error('Error guardando progreso:', error);
      return errorResponse(
        res,
        'Error al guardar progreso',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener evaluación de estudiante por ID
   * GET /api/student-evaluations/:id
   */
  static async getStudentEvaluationById(req, res) {
    try {
      const { id } = req.params;
      const studentId = req.user.id;

      const studentEvaluation = await StudentEvaluationService.getStudentEvaluationById(
        parseInt(id)
      );

      // Verificar que pertenece al estudiante (a menos que sea admin/teacher)
      if (studentEvaluation.studentId !== studentId && !req.userRoles?.includes('ADMIN')) {
        return errorResponse(
          res,
          'No tienes acceso a esta evaluación',
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
      console.error('Error obteniendo evaluación:', error);

      if (error.message === 'Evaluación de estudiante no encontrada') {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al obtener evaluación',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener mis evaluaciones (del estudiante autenticado)
   * GET /api/student-evaluations/my?completada=true/false
   */
  static async getMyEvaluations(req, res) {
    try {
      const studentId = req.user.id;
      const { completada } = req.query;

      let completadaFilter = null;
      if (completada === 'true') completadaFilter = true;
      if (completada === 'false') completadaFilter = false;

      const evaluations = await StudentEvaluationService.getStudentEvaluations(
        studentId,
        completadaFilter
      );

      return successResponse(
        res,
        evaluations,
        'Evaluaciones obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      return errorResponse(
        res,
        'Error al obtener evaluaciones',
        HTTP_STATUS.INTERNAL_ERROR
      );
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
      console.error('Error verificando continuidad:', error);
      return errorResponse(
        res,
        'Error al verificar estado de evaluación',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener progreso de una evaluación (para profesores/admin)
   * GET /api/student-evaluations/evaluation/:evaluationId/progress
   */
  static async getEvaluationProgress(req, res) {
    try {
      const { evaluationId } = req.params;

      const progress = await StudentEvaluationService.getEvaluationProgress(
        parseInt(evaluationId)
      );

      return successResponse(
        res,
        progress,
        'Progreso obtenido exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo progreso:', error);

      if (error.message === 'Evaluación no encontrada') {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al obtener progreso',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener comentarios anónimos (para profesores/admin)
   * GET /api/student-evaluations/evaluation/:evaluationId/comments
   */
  static async getAnonymousComments(req, res) {
    try {
      const { evaluationId } = req.params;

      const comments = await StudentEvaluationService.getAnonymousComments(
        parseInt(evaluationId)
      );

      return successResponse(
        res,
        { comments, total: comments.length },
        'Comentarios obtenidos exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      return errorResponse(
        res,
        'Error al obtener comentarios',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener estadísticas detalladas de una evaluación (para profesores/admin)
   * GET /api/student-evaluations/evaluation/:evaluationId/statistics
   */
  static async getDetailedStatistics(req, res) {
    try {
      const { evaluationId } = req.params;

      const statistics = await StudentEvaluationService.getDetailedStatistics(
        parseInt(evaluationId)
      );

      return successResponse(
        res,
        statistics,
        'Estadísticas obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return errorResponse(
        res,
        'Error al obtener estadísticas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener distribución de respuestas de una pregunta (para profesores/admin)
   * GET /api/student-evaluations/evaluation/:evaluationId/question/:questionId/distribution
   */
  static async getQuestionDistribution(req, res) {
    try {
      const { evaluationId, questionId } = req.params;

      const distribution = await ResponseModel.getResponseDistribution(
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
      console.error('Error obteniendo distribución:', error);
      return errorResponse(
        res,
        'Error al obtener distribución',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener respuestas de texto de una pregunta (para profesores/admin)
   * GET /api/student-evaluations/evaluation/:evaluationId/question/:questionId/text-responses
   */
  static async getQuestionTextResponses(req, res) {
    try {
      const { evaluationId, questionId } = req.params;

      const textResponses = await ResponseModel.getTextResponses(
        parseInt(evaluationId),
        parseInt(questionId)
      );

      return successResponse(
        res,
        { responses: textResponses, total: textResponses.length },
        'Respuestas de texto obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error obteniendo respuestas de texto:', error);
      return errorResponse(
        res,
        'Error al obtener respuestas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}

export default StudentEvaluationController;
