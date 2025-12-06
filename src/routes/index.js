/**
 * Centralizador de rutas
 * Importa y registra todas las rutas de la aplicación
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import careerRoutes from './career.routes.js';
import subjectRoutes from './subject.routes.js';
import roleRoutes from './role.routes.js';
import questionRoutes from './question.routes.js';
import evaluationRoutes from './evaluation.routes.js';

const router = Router();

/**
 * Registrar todas las rutas con sus prefijos
 */
router.use('/auth', authRoutes);
router.use('/careers', careerRoutes);
router.use('/subjects', subjectRoutes);
router.use('/roles', roleRoutes);
router.use('/questions', questionRoutes);
router.use('/evaluations', evaluationRoutes);

/**
 * Ruta de health check
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'evalplus-api',
    version: '1.0.0'
  });
});

/**
 * Ruta de prueba (útil para verificar que el API funciona)
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'Eval+ API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;
