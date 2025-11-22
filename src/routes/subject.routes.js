import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller.js';
import { Authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas públicas (sin autenticación)
 */

// Obtener todas las materias
router.get('/', SubjectController.getAllSubjects);

// Obtener materias por código de carrera (útil para el frontend)
router.get('/career-code/:careerCode', SubjectController.getSubjectsByCareerCode);

// Obtener materias por ID de carrera
router.get('/career/:careerId', SubjectController.getSubjectsByCareer);

// Obtener materias por semestre
router.get('/semester/:semestre', SubjectController.getSubjectsBySemester);

// Obtener una materia específica
router.get('/:id', SubjectController.getSubjectById);

// Obtener estudiantes de una materia
router.get('/:id/students', SubjectController.getSubjectStudents);

/**
 * Rutas protegidas (requieren autenticación)
 */

// Inscribir estudiante en materia (requiere autenticación)
router.post('/:id/enroll', Authenticate, SubjectController.enrollStudent);

// Desinscribir estudiante de materia (requiere autenticación)
router.delete('/:id/enroll/:studentId', Authenticate, SubjectController.unenrollStudent);

/**
 * Rutas administrativas (solo desarrollo - agregar middleware de admin en producción)
 */

// Crear materia
router.post('/', Authenticate, SubjectController.createSubject);

// Actualizar materia
router.put('/:id', Authenticate, SubjectController.updateSubject);

// Eliminar materia
router.delete('/:id', Authenticate, SubjectController.deleteSubject);

// Seed de materias de prueba (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.post('/seed/create', SubjectController.seedSubjects);
}

export default router;
