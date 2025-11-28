import { Router } from 'express';
import { Authenticate } from '../middlewares/auth.middleware.js';
import RoleController from '../controllers/role.controller.js';

const router = Router();

/**
 * @route GET /api/roles/my
 * @desc Obtiene roles del usuario autenticado
 * @access Private (JWT)
 */
router.get('/my', Authenticate, RoleController.getMyRoles);

export default router;
