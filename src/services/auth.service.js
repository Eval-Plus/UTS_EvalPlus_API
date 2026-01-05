/**
 * Servicio de Autenticación
 * Maneja el proceso de autenticación OAuth y gestión de perfiles
 */

import { UserModel } from '../models/user.model.js';
import { RoleService } from './role.service.js';
import { EnrollmentService } from './enrollment.service.js';
import { generateToken } from '../utils/jwt.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AuthService');

export class AuthService {
  /**
   * Procesa el usuario autenticado con OAuth (Microsoft)
   * @param {Object} profile - Perfil de Microsoft
   * @param {string} accessToken - Token de acceso de Microsoft
   * @returns {Object} Usuario y token JWT
   */
  static async processOAuthUser(profile, accessToken) {
    try {
      logger.auth('Procesando usuario OAuth');

      // 1. Extraer datos del perfil
      const userData = this.extractProfileData(profile);

      // 2. Buscar o crear usuario
      const { user, isNewUser } = await this.findOrCreateUser(userData);

      // 3. Si es nuevo, configurar perfil según rol
      if (isNewUser) {
        await this.setupNewUserProfile(user);
      }

      // 4. Verificar completitud del perfil
      await this.updateProfileCompleteness(user.id);

      // 5. Generar token JWT
      const token = this.generateUserToken(user);

      // 6. Obtener usuario completo con relaciones
      const userWithCareers = await UserModel.findByIdWithCareers(user.id);

      logger.success(`Usuario procesado: ${user.email} (Nuevo: ${isNewUser})`);

      return {
        token,
        user: this.sanitizeUser(userWithCareers),
        isNewUser
      };
    } catch (error) {
      logger.error('Error procesando usuario OAuth', error);
      throw error;
    }
  }

  /**
   * Extrae datos relevantes del perfil de Microsoft
   * @param {Object} profile - Perfil de Microsoft
   * @returns {Object} Datos del usuario
   */
  static extractProfileData(profile) {
    const email = profile.emails?.[0]?.value || profile.userPrincipalName;

    if (!email) {
      throw new Error('No se pudo obtener el email del perfil de Microsoft');
    }

    const nombreCompleto = profile.displayName || 
      `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();

    return {
      microsoftId: profile.id,
      email,
      nombreCompleto,
      profilePicture: profile.photos?.[0]?.value || null
    };
  }

  /**
   * Busca usuario existente o crea uno nuevo
   * @param {Object} userData - Datos del usuario
   * @returns {Object} { user, isNewUser }
   */
  static async findOrCreateUser(userData) {
    const { microsoftId, email, nombreCompleto, profilePicture } = userData;

    // Buscar por Microsoft ID
    let user = await UserModel.findByMicrosoftId(microsoftId);

    if (user) {
      // Usuario existente: actualizar información
      logger.info(`Usuario existente encontrado: ${email}`);
      user = await UserModel.update(user.id, {
        nombreCompleto,
        profilePicture,
        // Actualizar ultimo login
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
      return { user, isNewUser: false };
    }

    // Buscar por email
    const existingByEmail = await UserModel.findByEmail(email);

    if (existingByEmail) {
      // Vincular Microsoft ID a cuenta existente
      logger.info(`Vinculando Microsoft ID a cuenta existente: ${email}`);
      user = await UserModel.update(existingByEmail.id, {
        microsoftId,
        nombreCompleto,
        profilePicture,
        // Actualizar ultimo login
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
      return { user, isNewUser: false };
    }

    // Crear nuevo usuario
    logger.user(`Creando nuevo usuario: ${email}`);
    user = await UserModel.create({
      microsoftId,
      email,
      nombreCompleto,
      profilePicture,
      isProfileComplete: false,
      // Tracking primer login
      firstLoginAt: new Date(),
      lastLoginAt: new Date()
    });

    return { user, isNewUser: true };
  }

  /**
   * Configura el perfil de un nuevo usuario según su rol
   * @param {Object} user - Usuario recién creado
   */
  static async setupNewUserProfile(user) {
    logger.info(`Configurando perfil para nuevo usuario: ${user.email}`);

    // Determinar rol basado en email
    const roleName = RoleService.determineRoleFromEmail(user.email);

    // Asignar rol
    await RoleService.assignRole(user.id, roleName);

    // Configurar según el rol
    if (roleName === 'TEACHER') {
      await EnrollmentService.setupTeacherAssignment(user.id); // Ahora crea evaluaciones
    } else {
      await EnrollmentService.setupStudentEnrollment(user.id); // Ahora usa mismo semestre
    }
  }

  /**
   * Actualiza el estado de completitud del perfil
   * @param {number} userId - ID del usuario
   */
  static async updateProfileCompleteness(userId) {
    const user = await UserModel.findByIdWithCareers(userId);
    const isProfileComplete = UserModel.isProfileComplete(user);

    if (user.isProfileComplete !== isProfileComplete) {
      await UserModel.update(userId, { isProfileComplete });
      logger.debug(`Perfil completitud actualizada para usuario ${userId}: ${isProfileComplete}`);
    }
  }

  /**
   * Genera token JWT para el usuario
   * @param {Object} user - Usuario
   * @returns {string} Token JWT
   */
  static generateUserToken(user) {
    return generateToken({
      id: user.id,
      email: user.email,
      microsoftId: user.microsoftId,
      isProfileComplete: user.isProfileComplete
    });
  }

  /**
   * Obtiene el perfil del usuario autenticado
   * @param {number} userId - ID del usuario
   * @returns {Object} Perfil del usuario
   */
  static async getProfile(userId) {
    try {
      const user = await UserModel.findByIdBasic(userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error(`Error obteniendo perfil de usuario ${userId}`, error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario
   * @param {number} userId - ID del usuario
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Usuario actualizado
   */
  static async updateProfile(userId, data) {
    try {
      logger.info(`Actualizando perfil de usuario ${userId}`);

      const updateData = this.sanitizeUpdateData(data);

      await UserModel.update(userId, updateData);
      await this.updateProfileCompleteness(userId);

      const updatedUser = await UserModel.findByIdWithCareers(userId);

      logger.success(`Perfil actualizado para usuario ${userId}`);

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      logger.error(`Error actualizando perfil de usuario ${userId}`, error);
      throw error;
    }
  }

  /**
   * Sanitiza datos de actualización
   * @param {Object} data - Datos sin sanitizar
   * @returns {Object} Datos sanitizados
   */
  static sanitizeUpdateData(data) {
    const updateData = {};

    if (data.identificacion) {
      updateData.identificacion = data.identificacion.trim();
    }

    if (data.carreras && Array.isArray(data.carreras)) {
      updateData.carreras = data.carreras.filter(c => c.trim().length > 0);
    }

    if (data.materias && Array.isArray(data.materias)) {
      updateData.materias = data.materias.filter(m => m.trim().length > 0);
    }

    return updateData;
  }

  /**
   * Remueve información sensible del usuario
   * @param {Object} user - Objeto usuario
   * @returns {Object} Usuario sanitizado
   */
    static sanitizeUser(user) {
    const { microsoftId, ...userData } = user;

    return {
      ...userData,
      hasMicrosoftAccount: Boolean(microsoftId)
    };
  }

  /**
   * Verifica el token de Microsoft (opcional)
   * @param {string} accessToken - Token de acceso
   * @returns {Object} Información del token
   */
  static async verifyMicrosoftToken(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Token de Microsoft inválido');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error verificando token de Microsoft', error);
      throw error;
    }
  }
}

export default AuthService;
