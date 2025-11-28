import { AuthService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';
import { isMobileRequest } from '../utils/helpers.js';
import jwt from 'jsonwebtoken';

export class AuthController {
  /**
   * Maneja el callback de Microsoft OAuth
   * Este método es llamado por Passport después de la autenticación
   * GET /api/auth/microsoft/callback
   */
  static async microsoftCallback(req, res) {
    try {
      if (!req.user) {
        return errorResponse(
          res,
          MESSAGES.AUTH.MICROSOFT_ERROR,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const { token, user, isNewUser } = req.user;

      // Detectar si viene de app móvil o web usando el helper
      if (isMobileRequest(req)) {
        // Retornar JSON para Flutter
        return successResponse(
          res,
          { token, user, isNewUser },
          isNewUser ? MESSAGES.AUTH.ACCOUNT_CREATED : MESSAGES.AUTH.LOGIN_SUCCESS,
          HTTP_STATUS.OK
        );
      } else {
        // Servir página HTML con el token para web
        const redirectUrl = `/views/auth-callback?token=${token}&isNewUser=${isNewUser}`;
        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Error en microsoftCallback:', error);
      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Maneja errores en la autenticación de Microsoft
   * GET /api/auth/microsoft/failure
   */
  static microsoftFailure(req, res) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const message = encodeURIComponent(MESSAGES.AUTH.MICROSOFT_ERROR);
    const redirectUrl = `${frontendUrl}/auth/error?message=${message}`;

    return res.redirect(redirectUrl);
  }

  /**
   * Obtiene el perfil del usuario autenticado
   * GET /api/auth/profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await AuthService.getProfile(userId);

      return successResponse(
        res,
        profile,
        MESSAGES.AUTH.PROFILE_RETRIEVED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en getProfile:', error);

      if (error.message === 'Usuario no encontrado') {
        return errorResponse(
          res,
          MESSAGES.AUTH.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Actualiza el perfil del usuario
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { identificacion, carreras, materias } = req.body;

      // Validar que al menos un campo esté presente
      if (!identificacion && !carreras && !materias) {
        return errorResponse(
          res,
          'Debe proporcionar al menos un campo para actualizar',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Validar identificación
      if (identificacion !== undefined) {
        if (typeof identificacion !== 'string' || identificacion.trim().length === 0) {
          return errorResponse(
            res,
            'La identificación no puede estar vacía',
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      // Validar carreras
      if (carreras !== undefined) {
        if (!Array.isArray(carreras) || carreras.length === 0) {
          return errorResponse(
            res,
            'Las carreras deben ser un array no vacío',
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      // Validar materias
      if (materias !== undefined) {
        if (!Array.isArray(materias) || materias.length === 0) {
          return errorResponse(
            res,
            'Las materias deben ser un array no vacío',
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      const updatedProfile = await AuthService.updateProfile(userId, {
        identificacion,
        carreras,
        materias
      });

      return successResponse(
        res,
        updatedProfile,
        MESSAGES.AUTH.PROFILE_UPDATED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en updateProfile:', error);

      // Manejo de errores específicos de Prisma (identificación duplicada)
      if (error.code === 'P2002') {
        return errorResponse(
          res,
          'La identificación ya está registrada',
          HTTP_STATUS.CONFLICT
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Valida un token JWT y retorna información del usuario
   * POST /api/auth/validate-token
   */
  static async validateToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return errorResponse(
          res,
          MESSAGES.AUTH.TOKEN_MISSING,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Verificar el token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        // Manejar errores específicos de JWT
        if (jwtError.name === 'TokenExpiredError') {
          return errorResponse(
            res,
            'Token expirado',
            HTTP_STATUS.UNAUTHORIZED
          );
        }
        if (jwtError.name === 'JsonWebTokenError') {
          return errorResponse(
            res,
            MESSAGES.AUTH.TOKEN_INVALID,
            HTTP_STATUS.UNAUTHORIZED
          );
        }
        throw jwtError;
      }

      // Verificar que el usuario aún existe en la BD
      const profile = await AuthService.getProfile(decoded.id);

      if (!profile) {
        return errorResponse(
          res,
          MESSAGES.AUTH.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Retornar información del usuario sin datos sensibles
      return successResponse(
        res,
        {
          valid: true,
          user: profile
        },
        'Token válido',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error validando token:', error);

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Cierra sesión del usuario
   * POST /api/auth/logout
   * 
   * Nota: Si se implementa blacklist de tokens (ej. con Redis),
   * agregar la lógica aquí
   */
  static async logout(req, res) {
    try {
      // TODO: Implementar blacklist de tokens si es necesario
      // Ejemplo:
      // const token = req.headers.authorization?.substring(7);
      // await redis.set(`blacklist:${token}`, '1', 'EX', expirationTime);

      return successResponse(
        res,
        null,
        MESSAGES.AUTH.LOGOUT_SUCCESS,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en logout:', error);
      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Verifica el estado de autenticación
   * GET /api/auth/check
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
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error en checkAuth:', error);

      if (error.message === 'Usuario no encontrado') {
        return errorResponse(
          res,
          MESSAGES.AUTH.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}
