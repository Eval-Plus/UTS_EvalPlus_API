import { AuthService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

import { StudentModel } from '../models/student.model.js';

import jwt from 'jsonwebtoken';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AuthController {
  /**
   * Maneja el callback de Microsoft OAuth
   * Este método es llamado por Passport después de la autenticación
   */
  static async microsoftCallback(req, res) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Error en la autenticación con Microsoft', 401);
      }

      const { token, user, isNewUser } = req.user;

      // Detectar si viene de app móvil o web
      const isMobileApp = req.headers['user-agent']?.includes('Flutter') ||
                          req.query.platform === 'mobile' ||
                          req.headers['x-platform'] === 'mobile';
      if (isMobileApp) {
	// Retornar JSON para Flutter
        return successResponse(
	  res,
	  {
	    token,
	    user,
	    isNewUser
	  },
	  isNewUser ? 'Cuenta creada exitosamente' : 'Inicio de sesión exitoso',
	  200
	);
      } else {
        // Servir página HTML con el token
        const redirectUrl = `/views/auth-callback?token=${token}&isNewUser=${isNewUser}`;
        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Error en microsoftCallback:', error);
      return errorResponse(res, 'Error al procesar la autenticación', 500);
    }
  }

  /**
   * Maneja errores en la autenticación de Microsoft
   */
  static microsoftFailure(req, res) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent('Error en la autenticación con Microsoft')}`;

    return res.redirect(redirectUrl);
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await AuthService.getProfile(userId);

      return successResponse(
        res,
        profile,
        'Perfil obtenido exitosamente',
        200
      );
    } catch (error) {
      console.error('Error en getProfile:', error);

      if (error.message === 'Usuario no encontrado') {
        return errorResponse(res, error.message, 404);
      }

      return errorResponse(res, 'Error al obtener el perfil', 500);
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { identificacion, carreras, materias } = req.body;

      // Validaciones básicas
      if (!identificacion && !carreras && !materias) {
        return errorResponse(
          res,
          'Debe proporcionar al menos un campo para actualizar',
          400
        );
      }

      if (identificacion && identificacion.trim().length === 0) {
        return errorResponse(
          res,
          'La identificación no puede estar vacía',
          400
        );
      }

      if (carreras && (!Array.isArray(carreras) || carreras.length === 0)) {
        return errorResponse(
          res,
          'Las carreras deben ser un array no vacío',
          400
        );
      }

      if (materias && (!Array.isArray(materias) || materias.length === 0)) {
        return errorResponse(
          res,
          'Las materias deben ser un array no vacío',
          400
        );
      }

      const updatedProfile = await AuthService.updateProfile(userId, {
        identificacion,
        carreras,
        materias
      });

      return successResponse(
        res,
        updatedProfile,
        'Perfil actualizado exitosamente',
        200
      );
    } catch (error) {
      console.error('Error en updateProfile:', error);

      // Manejo de errores específicos de Prisma
      if (error.code === 'P2002') {
        return errorResponse(
          res,
          'La identificación ya está registrada',
          409
        );
      }

      return errorResponse(res, 'Error al actualizar el perfil', 500);
    }
  }

  /**
   * Valida un token JWT y retorna información del usuario
   */
  static async validateToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return errorResponse(res, 'Token no proporcionado', 400);
      }

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Opcional: Verificar que el usuario aún existe en la BD
      const user = await StudentModel.findById(decoded.id);

      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      // Retornar información del usuario sin datos sensibles
      return successResponse(
        res,
        {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            // ... otros campos necesarios
          }
        },
        'Token válido',
        200
      );

    } catch (error) {
      console.error('Error validando token:', error);

      // Diferentes tipos de errores JWT
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expirado', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Token inválido', 401);
      }

      return errorResponse(res, 'Error al validar el token', 500);
    }
  }

  /**
   * Cierra sesión del usuario (opcional, para invalidar tokens si implementas blacklist)
   */
  static async logout(req, res) {
    try {
      // Aquí podrías implementar lógica para invalidar el token
      // Por ejemplo, agregándolo a una blacklist en Redis

      return successResponse(
        res,
        null,
        'Sesión cerrada exitosamente',
        200
      );
    } catch (error) {
      console.error('Error en logout:', error);
      return errorResponse(res, 'Error al cerrar sesión', 500);
    }
  }

  /**
   * Verifica el estado de autenticación
   */
  static async checkAuth(req, res) {
    try {
      const userId = req.user.id;
      const profile = await AuthService.getProfile(userId);

      return successResponse(
        res,
        {
          authenticated: true,
          user: profile
        },
        'Usuario autenticado',
        200
      );
    } catch (error) {
      console.error('Error en checkAuth:', error);
      return errorResponse(res, 'Error al verificar autenticación', 500);
    }
  }
}
