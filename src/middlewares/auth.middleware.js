import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware para verificar el token JWT
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token no proporcionado', 401);
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    const decoded = verifyToken(token);
    req.user = decoded; // Agregar datos del usuario a la request
    
    next();
  } catch (error) {
    console.error('Error en authenticate middleware:', error);
    return errorResponse(res, 'Token inválido o expirado', 401);
  }
};

/**
 * Middleware opcional para verificar si el perfil está completo
 */
export const requireCompleteProfile = (req, res, next) => {
  if (!req.user.isProfileComplete) {
    return errorResponse(
      res,
      'Debes completar tu perfil para acceder a esta funcionalidad',
      403
    );
  }
  next();
};
