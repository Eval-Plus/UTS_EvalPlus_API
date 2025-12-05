import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas públicas (sin autenticación)
 * Útil para que Flutter pueda obtener las preguntas sin login
 */

/**
 * @route   GET /api/questions
 * @desc    Obtener todas las preguntas de la plantilla por defecto
 * @access  Public
 */
router.get('/', QuestionController.getAllQuestions);

/**
 * @route   GET /api/questions/template/:templateId
 * @desc    Obtener preguntas de una plantilla específica
 * @access  Public
 */
router.get('/template/:templateId', QuestionController.getQuestionsByTemplate);

/**
 * @route   GET /api/questions/template/:templateId/count
 * @desc    Contar preguntas de una plantilla
 * @access  Public
 */
router.get('/template/:templateId/count', QuestionController.countQuestions);

/**
 * @route   GET /api/questions/template/:templateId/grouped/category
 * @desc    Obtener preguntas agrupadas por categoría
 * @access  Public
 */
router.get('/template/:templateId/grouped/category', QuestionController.getQuestionsGroupedByCategory);

/**
 * @route   GET /api/questions/template/:templateId/grouped/aspect
 * @desc    Obtener preguntas agrupadas por aspecto
 * @access  Public
 */
router.get('/template/:templateId/grouped/aspect', QuestionController.getQuestionsGroupedByAspect);

/**
 * @route   GET /api/questions/:id
 * @desc    Obtener una pregunta específica por ID
 * @access  Public
 */
router.get('/:id', QuestionController.getQuestionById);

/**
 * Rutas protegidas (requieren autenticación)
 * Solo para administradores que gestionan las preguntas
 */

/**
 * @route   POST /api/questions
 * @desc    Crear una nueva pregunta
 * @access  Private (Admin)
 */
router.post('/', Authenticate, QuestionController.createQuestion);

/**
 * @route   PUT /api/questions/:id
 * @desc    Actualizar una pregunta
 * @access  Private (Admin)
 */
router.put('/:id', Authenticate, QuestionController.updateQuestion);

/**
 * @route   DELETE /api/questions/:id
 * @desc    Desactivar una pregunta
 * @access  Private (Admin)
 */
router.delete('/:id', Authenticate, QuestionController.deleteQuestion);

export default router;
