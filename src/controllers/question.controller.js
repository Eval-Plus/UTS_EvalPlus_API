import { QuestionService } from '../services/question.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export class QuestionController {
  /**
   * Obtener todas las preguntas de la plantilla por defecto
   * GET /api/questions
   */
  static async getAllQuestions(req, res) {
    try {
      const questions = await QuestionService.getDefaultQuestions();
      
      return successResponse(
        res,
        questions,
        'Preguntas obtenidas exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener preguntas:', error);
      return errorResponse(
        res,
        'Error al obtener preguntas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener preguntas de una plantilla específica
   * GET /api/questions/template/:templateId
   */
  static async getQuestionsByTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const questions = await QuestionService.getQuestionsByTemplate(templateId);

      return successResponse(
        res,
        questions,
        `Preguntas de la plantilla obtenidas exitosamente`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener preguntas por plantilla:', error);
      return errorResponse(
        res,
        'Error al obtener preguntas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener una pregunta por ID
   * GET /api/questions/:id
   */
  static async getQuestionById(req, res) {
    try {
      const { id } = req.params;
      const question = await QuestionService.getQuestionById(id);

      return successResponse(
        res,
        question,
        'Pregunta obtenida exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener pregunta:', error);

      if (error.message === 'Pregunta no encontrada') {
        return errorResponse(
          res,
          'Pregunta no encontrada',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al obtener pregunta',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener preguntas agrupadas por categoría
   * GET /api/questions/template/:templateId/grouped/category
   */
  static async getQuestionsGroupedByCategory(req, res) {
    try {
      const { templateId } = req.params;
      const grouped = await QuestionService.getQuestionsGroupedByCategory(templateId);

      return successResponse(
        res,
        grouped,
        'Preguntas agrupadas por categoría',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al agrupar preguntas:', error);
      return errorResponse(
        res,
        'Error al agrupar preguntas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener preguntas agrupadas por aspecto
   * GET /api/questions/template/:templateId/grouped/aspect
   */
  static async getQuestionsGroupedByAspect(req, res) {
    try {
      const { templateId } = req.params;
      const grouped = await QuestionService.getQuestionsGroupedByAspect(templateId);

      return successResponse(
        res,
        grouped,
        'Preguntas agrupadas por aspecto',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al agrupar preguntas:', error);
      return errorResponse(
        res,
        'Error al agrupar preguntas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Crear una nueva pregunta
   * POST /api/questions
   */
  static async createQuestion(req, res) {
    try {
      const questionData = req.body;
      const newQuestion = await QuestionService.createQuestion(questionData);

      return successResponse(
        res,
        newQuestion,
        'Pregunta creada exitosamente',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al crear pregunta:', error);

      if (error.message.includes('campos obligatorios')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message.includes('Ya existe una pregunta')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.CONFLICT
        );
      }

      return errorResponse(
        res,
        'Error al crear pregunta',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Actualizar una pregunta
   * PUT /api/questions/:id
   */
  static async updateQuestion(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedQuestion = await QuestionService.updateQuestion(id, updateData);

      return successResponse(
        res,
        updatedQuestion,
        'Pregunta actualizada exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al actualizar pregunta:', error);

      if (error.message === 'Pregunta no encontrada') {
        return errorResponse(
          res,
          'Pregunta no encontrada',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al actualizar pregunta',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Eliminar (desactivar) una pregunta
   * DELETE /api/questions/:id
   */
  static async deleteQuestion(req, res) {
    try {
      const { id } = req.params;
      await QuestionService.deleteQuestion(id);

      return successResponse(
        res,
        null,
        'Pregunta desactivada exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);

      if (error.message === 'Pregunta no encontrada') {
        return errorResponse(
          res,
          'Pregunta no encontrada',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        'Error al eliminar pregunta',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Contar preguntas de una plantilla
   * GET /api/questions/template/:templateId/count
   */
  static async countQuestions(req, res) {
    try {
      const { templateId } = req.params;
      const count = await QuestionService.countQuestionsByTemplate(templateId);

      return successResponse(
        res,
        { count, templateId: parseInt(templateId) },
        'Conteo obtenido exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al contar preguntas:', error);
      return errorResponse(
        res,
        'Error al contar preguntas',
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}

export default QuestionController;
