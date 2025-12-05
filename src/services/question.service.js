/**
 * Servicio de Preguntas
 * Maneja toda la lógica de negocio relacionada con preguntas de evaluación
 */

import { QuestionModel } from '../models/question.model.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('QuestionService');

export class QuestionService {
  /**
   * Obtener todas las preguntas de la plantilla por defecto
   * @returns {Array} Lista de preguntas
   */
  static async getDefaultQuestions() {
    try {
      logger.info('Obteniendo preguntas de plantilla por defecto');
      const questions = await QuestionModel.findDefaultQuestions();
      
      if (questions.length === 0) {
        logger.warn('No se encontraron preguntas en la plantilla por defecto');
      } else {
        logger.success(`${questions.length} preguntas obtenidas`);
      }
      
      return questions;
    } catch (error) {
      logger.error('Error obteniendo preguntas por defecto', error);
      throw error;
    }
  }

  /**
   * Obtener preguntas de una plantilla específica
   * @param {number} templateId - ID de la plantilla
   * @returns {Array} Lista de preguntas
   */
  static async getQuestionsByTemplate(templateId) {
    try {
      logger.info(`Obteniendo preguntas de plantilla ${templateId}`);
      const questions = await QuestionModel.findByTemplate(templateId);
      logger.success(`${questions.length} preguntas obtenidas de plantilla ${templateId}`);
      return questions;
    } catch (error) {
      logger.error(`Error obteniendo preguntas de plantilla ${templateId}`, error);
      throw error;
    }
  }

  /**
   * Obtener una pregunta por ID
   * @param {number} id - ID de la pregunta
   * @returns {Object} Pregunta encontrada
   */
  static async getQuestionById(id) {
    try {
      logger.debug(`Buscando pregunta con ID: ${id}`);
      const question = await QuestionModel.findById(id);

      if (!question) {
        logger.warn(`Pregunta ${id} no encontrada`);
        throw new Error('Pregunta no encontrada');
      }

      logger.success(`Pregunta encontrada: ${question.enunciado.substring(0, 50)}...`);
      return question;
    } catch (error) {
      logger.error(`Error obteniendo pregunta ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtener preguntas agrupadas por categoría
   * @param {number} templateId - ID de la plantilla
   * @returns {Object} Preguntas agrupadas
   */
  static async getQuestionsGroupedByCategory(templateId) {
    try {
      logger.info(`Agrupando preguntas por categoría (plantilla ${templateId})`);
      const grouped = await QuestionModel.findGroupedByCategory(templateId);
      logger.success(`Preguntas agrupadas en ${Object.keys(grouped).length} categorías`);
      return grouped;
    } catch (error) {
      logger.error('Error agrupando preguntas por categoría', error);
      throw error;
    }
  }

  /**
   * Obtener preguntas agrupadas por aspecto
   * @param {number} templateId - ID de la plantilla
   * @returns {Object} Preguntas agrupadas
   */
  static async getQuestionsGroupedByAspect(templateId) {
    try {
      logger.info(`Agrupando preguntas por aspecto (plantilla ${templateId})`);
      const grouped = await QuestionModel.findGroupedByAspect(templateId);
      logger.success(`Preguntas agrupadas en ${Object.keys(grouped).length} aspectos`);
      return grouped;
    } catch (error) {
      logger.error('Error agrupando preguntas por aspecto', error);
      throw error;
    }
  }

  /**
   * Crear una nueva pregunta
   * @param {Object} data - Datos de la pregunta
   * @returns {Object} Pregunta creada
   */
  static async createQuestion(data) {
    try {
      logger.info('Creando nueva pregunta');

      // Validar datos obligatorios
      if (!data.templateId || !data.categoria || !data.aspecto || !data.nroPregunta || !data.enunciado) {
        throw new Error('Faltan campos obligatorios: templateId, categoria, aspecto, nroPregunta, enunciado');
      }

      // Verificar si ya existe una pregunta con ese número en la plantilla
      const exists = await QuestionModel.exists(data.templateId, data.nroPregunta);
      if (exists) {
        throw new Error(`Ya existe una pregunta con el número ${data.nroPregunta} en esta plantilla`);
      }

      const newQuestion = await QuestionModel.create(data);
      logger.success(`Pregunta creada: ${newQuestion.enunciado.substring(0, 50)}... (ID: ${newQuestion.id})`);

      return newQuestion;
    } catch (error) {
      logger.error('Error creando pregunta', error);
      throw error;
    }
  }

  /**
   * Actualizar una pregunta
   * @param {number} id - ID de la pregunta
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Pregunta actualizada
   */
  static async updateQuestion(id, data) {
    try {
      logger.info(`Actualizando pregunta ${id}`);

      // Verificar que la pregunta existe
      await this.getQuestionById(id);

      const updatedQuestion = await QuestionModel.update(id, data);
      logger.success(`Pregunta ${id} actualizada`);

      return updatedQuestion;
    } catch (error) {
      logger.error(`Error actualizando pregunta ${id}`, error);
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) una pregunta
   * @param {number} id - ID de la pregunta
   * @returns {Object} Pregunta desactivada
   */
  static async deleteQuestion(id) {
    try {
      logger.info(`Desactivando pregunta ${id}`);

      // Verificar que la pregunta existe
      await this.getQuestionById(id);

      const deletedQuestion = await QuestionModel.delete(id);
      logger.success(`Pregunta ${id} desactivada`);

      return deletedQuestion;
    } catch (error) {
      logger.error(`Error desactivando pregunta ${id}`, error);
      throw error;
    }
  }

  /**
   * Contar preguntas de una plantilla
   * @param {number} templateId - ID de la plantilla
   * @returns {number} Cantidad de preguntas
   */
  static async countQuestionsByTemplate(templateId) {
    try {
      const count = await QuestionModel.countByTemplate(templateId);
      logger.debug(`Plantilla ${templateId} tiene ${count} preguntas activas`);
      return count;
    } catch (error) {
      logger.error(`Error contando preguntas de plantilla ${templateId}`, error);
      throw error;
    }
  }
}

export default QuestionService;
