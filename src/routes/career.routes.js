import { Router } from 'express';
import { CareerController } from '../controllers/career.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas (o puedes protegerlas con authenticate si lo prefieres)

/**
 * @route   GET /api/careers
 * @desc    Obtener todas las carreras activas
 * @access  Public/Private (según tu necesidad)
 */
router.get('/', CareerController.getAllCareers);

/**
 * @route   GET /api/careers/:id
 * @desc    Obtener una carrera por ID
 * @access  Public/Private
 */
router.get('/:id', CareerController.getCareerById);

/**
 * @route   GET /api/careers/:id/students
 * @desc    Obtener estudiantes de una carrera
 * @access  Private (requiere autenticación)
 */
router.get('/:id/students', Authenticate, CareerController.getCareerStudents);

// Rutas protegidas (requieren autenticación)

/**
 * @route   POST /api/careers
 * @desc    Crear una nueva carrera
 * @access  Private (Admin)
 */
router.post('/', Authenticate, CareerController.createCareer);

/**
 * @route   POST /api/careers/seed
 * @desc    Crear carreras de prueba (solo desarrollo)
 * @access  Private
 */
router.post('/seed', CareerController.seedCareers);

/**
 * @route   POST /api/careers/:id/students
 * @desc    Inscribir un estudiante en una carrera
 * @access  Private
 */
router.post('/:id/students', Authenticate, CareerController.enrollStudent);

/**
 * @route   PUT /api/careers/:id
 * @desc    Actualizar una carrera
 * @access  Private (Admin)
 */
router.put('/:id', Authenticate, CareerController.updateCareer);

/**
 * @route   DELETE /api/careers/:id
 * @desc    Desactivar una carrera
 * @access  Private (Admin)
 */
router.delete('/:id', Authenticate, CareerController.deleteCareer);

/**
 * @route   DELETE /api/careers/:id/students/:studentId
 * @desc    Desinscribir un estudiante de una carrera
 * @access  Private
 */
router.delete('/:id/students/:studentId', Authenticate, CareerController.unenrollStudent);

export default router;
