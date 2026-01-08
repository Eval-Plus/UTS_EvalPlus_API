/**
 * Servicio de Roles
 * Maneja toda la lógica relacionada con roles de usuario
 */

import { UserModel } from '../models/user.model.js';
import { RoleModel } from '../models/role.model.js';
import { ROLES, TEACHER_EMAIL_KEYWORDS, ADMIN_EMAIL_KEYWORDS } from '../config/constants.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('RoleService');

export class RoleService {
  /**
   * Detecta si un email corresponde a un profesor
   * @param {string} email - Email del usuario
   * @returns {boolean} True si es profesor
   */
  static isTeacherEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailLower = email.toLowerCase();

    // Verificar si contiene alguna palabra clave de profesor
    const isTeacher = TEACHER_EMAIL_KEYWORDS.some(keyword =>
      emailLower.includes(keyword)
    );

    logger.debug(`Email "${email}" es profesor: ${isTeacher}`);

    return isTeacher;
  }

  /**
   * Detecta si un email corresponde a un administrador
   * @param {string} email - Email del usuario
   * @returns {boolean} True si es administrador
   */
  static isAdminEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailLower = email.toLowerCase();

    // Verificar si contiene alguna palabra clave de administrador
    const isAdmin = ADMIN_EMAIL_KEYWORDS.some(keyword =>
      emailLower.includes(keyword)
    );

    logger.debug(`Email "${email}" es administrador: ${isAdmin}`);

    return isAdmin;
  }

  /**
   * Determina el rol basado en el email
   * @param {string} email - Email del usuario
   * @returns {string} Nombre del rol (ADMIN, TEACHER o STUDENT)
   */
  static determineRoleFromEmail(email) {
    // Verificar primero si es administrador
    if (this.isAdminEmail(email)) {
      logger.info(`Rol determinado para "${email}": ${ROLES.ADMIN}`);
      return ROLES.ADMIN;
    }

    const isTeacher = this.isTeacherEmail(email);
    const role = isTeacher ? ROLES.TEACHER : ROLES.STUDENT;

    logger.info(`Rol determinado para "${email}": ${role}`);

    return role;
  }

  /**
   * Asigna un rol a un usuario
   * @param {number} userId - ID del usuario
   * @param {string} roleName - Nombre del rol
   */
  static async assignRole(userId, roleName) {
    try {
      await UserModel.assignRole(userId, roleName);
      logger.success(`Rol "${roleName}" asignado al usuario ${userId}`);
    } catch (error) {
      logger.error(`Error asignando rol "${roleName}" al usuario ${userId}`, error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario tiene un rol específico
   * @param {number} userId - ID del usuario
   * @param {string} roleName - Nombre del rol
   * @returns {boolean}
   */
  static async hasRole(userId, roleName) {
    return await UserModel.hasRole(userId, roleName);
  }

  /**
   * Obtiene todos los roles de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Array} Lista de roles
   */
  static async getUserRoles(userId) {
    return await RoleModel.getRolesByUserId(userId);
  }

  /**
   * Verifica si el usuario es profesor
   * @param {number} userId - ID del usuario
   * @returns {boolean}
   */
  static async isTeacher(userId) {
    return await this.hasRole(userId, ROLES.TEACHER);
  }

  /**
   * Verifica si el usuario es estudiante
   * @param {number} userId - ID del usuario
   * @returns {boolean}
   */
  static async isStudent(userId) {
    return await this.hasRole(userId, ROLES.STUDENT);
  }

  /**
   * Verifica si el usuario es administrador
   * @param {number} userId - ID del usuario
   * @returns {boolean}
   */
  static async isAdmin(userId) {
    return await this.hasRole(userId, ROLES.ADMIN);
  }
}

export default RoleService;
