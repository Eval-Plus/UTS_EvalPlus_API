import prisma from '../config/prisma.js';

export class UserModel {
  /**
   * Buscar por email
   */
  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Buscar por Microsoft ID
   */
  static async findByMicrosoftId(microsoftId) {
    return await prisma.user.findUnique({
      where: { microsoftId }
    });
  }

  /**
   * Buscar por ID
   */
  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Buscar por ID con sus carreras y roles
   */
  static async findByIdWithCareers(id) {
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        careers: {
          include: {
            career: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                icon: true,
                color: true,
                descripcion: true
              }
            }
          }
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                description: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Obtener todas las carreras de un usuario
   */
  static async getUserCareers(userId) {
    const user = await this.findByIdWithCareers(userId);

    return user?.careers.map(sc => ({
      ...sc.career,
      enrolledAt: sc.enrolledAt
    })) || [];
  }

  /**
   * Obtener todas las materias de un usuario
   */
  static async getUserSubjects(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                career: {
                  select: {
                    id: true,
                    nombre: true,
                    codigo: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return user?.subjects.map(ss => ({
      ...ss.subject,
      enrolledAt: ss.enrolledAt
    })) || [];
  }

  /**
   * Buscar usuario por identificación
   */
  static async findByIdentificacion(identificacion) {
    return await prisma.user.findUnique({
      where: { identificacion }
    });
  }

  /**
  * Obtener roles de un usuario
  */
  static async getUserRoles(userId) {
    const userWithRoles = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return userWithRoles?.roles.map(ur => ur.role) || [];
  }

  /**
  * Verificar si un usuario tiene un rol específico
  */
  static async hasRole(userId, roleName) {
    const roles = await this.getUserRoles(userId);
    return roles.some(role => role.name === roleName);
  }

  /**
  * Asignar un rol a un usuario
  */
  static async assignRole(userId, roleName) {
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      throw new Error(`Rol ${roleName} no encontrado`);
    }

    return await prisma.userRole.create({
      data: {
        userId: parseInt(userId),
        roleId: role.id
      },
      include: {
        user: true,
        role: true
      }
    });
  }

  /**
   * Crear nuevo usuario
   */
  static async create(data) {
    return await prisma.user.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Actualizar usuario
   */
  static async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Eliminar usuario (soft delete si se implementa)
   */
  static async delete(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }

  /**
   * Listar todos los usuarios con paginación
   */
  static async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Verificar si el perfil está completo
   */
  static isProfileComplete(user) {
    // Si student tiene la relación 'careers' cargada
    if (user.careers !== undefined) {
      return Boolean(
        user.identificacion &&
        user.careers.length > 0
      );
    }
    // Si solo tienes el objeto básico, asumimos que necesita completar perfil
    return Boolean(user.identificacion);
  }
}
