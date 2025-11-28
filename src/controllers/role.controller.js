import { RoleService } from '../services/role.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class RoleController {

  /**
   * GET /api/roles/my
   * Retorna los roles del usuario autenticado
   */
  static async getMyRoles(req, res) {
    try {
      const userId = req.user.id;

      const roles = await RoleService.getUserRoles(userId);

      return successResponse(res, roles);
    } catch (error) {
      console.error("🔥 ERROR en /api/roles/my:", error);
      return errorResponse(res, error);
    }
  }
}

export default RoleController;
