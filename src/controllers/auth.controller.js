import { AuthService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class AuthController {
  /**
   * POST /api/v1/auth/google
   * Login con Google
   */
  static async googleLogin(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return errorResponse(res, 'El token de Google es requerido', 400);
      }

      const result = await AuthService.loginWithGoogle(idToken);

      return successResponse(
        res,
        result,
        'Login exitoso con Google',
        200
      );
    } catch (error) {
      console.error('Error en googleLogin:', error);
      
      if (error.message === 'Token de Google inválido') {
        return errorResponse(res, error.message, 401);
      }
      
      if (error.message === 'El email de Google no está verificado') {
        return errorResponse(res, error.message, 403);
      }

      return errorResponse(res, 'Error al iniciar sesión con Google', 500);
    }
  }

  /**
   * GET /api/v1/auth/profile
   * Obtener perfil del usuario autenticado
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
}
