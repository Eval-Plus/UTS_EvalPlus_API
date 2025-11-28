import prisma from '../config/prisma.js';

export class RoleModel {

  /**
   * Obtiene todos los roles de un usuario
   * @param {number} userId
   */
  static async getRolesByUserId(userId) {
    return await prisma.role.findMany({
      where: { users: { some: { userId } } },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        createdAt: true
      }
    });
  }

  /**
   * Verifica si un usuario tiene un rol
   * @param {number} userId
   * @param {string} roleName
   */
  static async userHasRole(userId, roleName) {
    const role = await prisma.role.findFirst({
      where: {
        name: roleName,
        users: { some: { userId } }
      }
    });

    return Boolean(role);
  }
}

export default RoleModel;
