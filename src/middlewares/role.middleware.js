import prisma from '../config/prisma.js';
import { errorResponse } from '../utils/response.js';

export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: { role: true }
      });
      
      const roleNames = userRoles.map(ur => ur.role.name);
      const hasPermission = allowedRoles.some(role => roleNames.includes(role));
      
      if (!hasPermission) {
        return errorResponse(res, 'No tienes permisos para este recurso', 403);
      }
      
      req.userRoles = roleNames;
      next();
    } catch (error) {
      return errorResponse(res, 'Error verificando permisos', 500);
    }
  };
};
