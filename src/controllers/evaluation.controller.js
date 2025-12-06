import { EvaluationService } from '../services/evaluation.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export class EvaluationController {
  /**
   * Obtener todas las evaluaciones
   * GET /api/evaluations
   */
  static async getAllEvaluations(req, res) {
    try {
      const evaluations = await EvaluationService.getAllEvaluations();
      
      return successResponse(
        res,
        evaluations,
        'Evaluaciones obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      return errorResponse(
        res,
        'Error al obtener evaluaciones',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener evaluación por ID
   * GET /api/evaluations/:id
   */
  static async getEvaluationById(req, res) {
    try {
      const { id } = req.params;
      const evaluation = await EvaluationService.getEvaluationById(id);

      return successResponse(
        res,
        evaluation,
        'Evaluación obtenida exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener evaluación:', error);

      if (error.message === 'Evaluación no encontrada') {
        return errorResponse(
          res,
          'Evaluación no encontrada',
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
   * Obtener evaluaciones de un profesor
   * GET /api/evaluations/teacher/:teacherId
   */
  static async getTeacherEvaluations(req, res) {
    try {
      const { teacherId } = req.params;
      const { periodo } = req.query;

      const evaluations = await EvaluationService.getTeacherEvaluations(
        teacherId,
        periodo || null
      );

      return successResponse(
        res,
        evaluations,
        'Evaluaciones del profesor obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener evaluaciones del profesor:', error);
      return errorResponse(
        res,
        'Error al obtener evaluaciones del profesor',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener evaluaciones del profesor autenticado
   * GET /api/evaluations/my-evaluations
   */
  static async getMyEvaluations(req, res) {
    try {
      const teacherId = req.user.id;
      const { periodo } = req.query;

      const evaluations = await EvaluationService.getTeacherEvaluations(
        teacherId,
        periodo || null
      );

      return successResponse(
        res,
        evaluations,
        'Tus evaluaciones obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener mis evaluaciones:', error);
      return errorResponse(
        res,
        'Error al obtener tus evaluaciones',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener evaluaciones disponibles para el estudiante autenticado
   * GET /api/evaluations/student/available
   */
  static async getStudentAvailableEvaluations(req, res) {
    try {
      const studentId = req.user.id;
      const evaluations = await EvaluationService.getStudentAvailableEvaluations(studentId);

      return successResponse(
        res,
        evaluations,
        'Evaluaciones disponibles obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener evaluaciones disponibles:', error);
      return errorResponse(
        res,
        'Error al obtener evaluaciones disponibles',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener evaluaciones completadas por el estudiante autenticado
   * GET /api/evaluations/student/completed
   */
  static async getStudentCompletedEvaluations(req, res) {
    try {
      const studentId = req.user.id;
      const evaluations = await EvaluationService.getStudentCompletedEvaluations(studentId);

      return successResponse(
        res,
        evaluations,
        'Evaluaciones completadas obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener evaluaciones completadas:', error);
      return errorResponse(
        res,
        'Error al obtener evaluaciones completadas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener evaluaciones pendientes del estudiante autenticado
   * GET /api/evaluations/student/pending
   */
  static async getStudentPendingEvaluations(req, res) {
    try {
      const studentId = req.user.id;
      const evaluations = await EvaluationService.getStudentPendingEvaluations(studentId);

      return successResponse(
        res,
        evaluations,
        'Evaluaciones pendientes obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener evaluaciones pendientes:', error);
      return errorResponse(
        res,
        'Error al obtener evaluaciones pendientes',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener estadísticas de evaluaciones del estudiante autenticado
   * GET /api/evaluations/student/stats
   */
  static async getStudentStats(req, res) {
    try {
      const studentId = req.user.id;
      const stats = await EvaluationService.getStudentEvaluationStats(studentId);

      return successResponse(
        res,
        stats,
        'Estadísticas obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return errorResponse(
        res,
        'Error al obtener estadísticas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Crear nueva evaluación
   * POST /api/evaluations
   */
  static async createEvaluation(req, res) {
    try {
      const evaluationData = req.body;
      const newEvaluation = await EvaluationService.createEvaluation(evaluationData);

      return successResponse(
        res,
        newEvaluation,
        'Evaluación creada exitosamente',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al crear evaluación:', error);

      if (error.message.includes('campos obligatorios')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('fecha')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('Ya existe')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.CONFLICT
        );
      }

      if (error.message.includes('no existe')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al crear evaluación',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Crear evaluaciones masivas para un periodo
   * POST /api/evaluations/bulk
   */
  static async createBulkEvaluations(req, res) {
    try {
      const { periodo, fechaInicio, fechaCierre } = req.body;

      if (!periodo || !fechaInicio || !fechaCierre) {
        return errorResponse(
          res,
          'Faltan campos obligatorios: periodo, fechaInicio, fechaCierre',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const result = await EvaluationService.createBulkEvaluations(
        periodo,
        fechaInicio,
        fechaCierre
      );

      return successResponse(
        res,
        result,
        `Evaluaciones masivas creadas: ${result.summary.created} exitosas, ${result.summary.skipped} omitidas`,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al crear evaluaciones masivas:', error);
      return errorResponse(
        res,
        'Error al crear evaluaciones masivas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Actualizar evaluación
   * PUT /api/evaluations/:id
   */
  static async updateEvaluation(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedEvaluation = await EvaluationService.updateEvaluation(id, updateData);

      return successResponse(
        res,
        updatedEvaluation,
        'Evaluación actualizada exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al actualizar evaluación:', error);

      if (error.message === 'Evaluación no encontrada') {
        return errorResponse(
          res,
          'Evaluación no encontrada',
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message.includes('fecha')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return errorResponse(
        res,
        'Error al actualizar evaluación',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Desactivar evaluación
   * DELETE /api/evaluations/:id
   */
  static async deleteEvaluation(req, res) {
    try {
      const { id } = req.params;
      await EvaluationService.deleteEvaluation(id);

      return successResponse(
        res,
        null,
        'Evaluación desactivada exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al eliminar evaluación:', error);

      if (error.message === 'Evaluación no encontrada') {
        return errorResponse(
          res,
          'Evaluación no encontrada',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al eliminar evaluación',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener estadísticas de una evaluación
   * GET /api/evaluations/:id/stats
   */
  static async getEvaluationStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await EvaluationService.getEvaluationStats(id);

      return successResponse(
        res,
        stats,
        'Estadísticas de evaluación obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener estadísticas de evaluación:', error);

      if (error.message === 'Evaluación no encontrada') {
        return errorResponse(
          res,
          'Evaluación no encontrada',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al obtener estadísticas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Verificar si el estudiante autenticado puede responder una evaluación
   * GET /api/evaluations/:id/can-respond
   */
  static async canStudentRespond(req, res) {
    try {
      const { id } = req.params;
      const studentId = req.user.id;

      const result = await EvaluationService.canStudentRespond(id, studentId);

      return successResponse(
        res,
        result,
        result.canRespond ? 'Puedes responder esta evaluación' : 'No puedes responder esta evaluación',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return errorResponse(
        res,
        'Error al verificar permisos',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}

export default EvaluationController;
