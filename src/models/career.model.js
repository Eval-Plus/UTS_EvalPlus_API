import prisma from '../config/prisma.js';

export class CareerModel {
  /**
   * Obtener todas las carreras activas
   */
  static async findAll() {
    return await prisma.career.findMany({
      where: {
        activo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
  }

  /**
   * Obtener una carrera por ID
   */
  static async findById(id) {
    return await prisma.career.findUnique({
      where: { id: parseInt(id) },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Obtener una carrera por código
   */
  static async findByCode(codigo) {
    return await prisma.career.findUnique({
      where: { codigo }
    });
  }

  /**
   * Crear una nueva carrera
   */
  static async create(data) {
    return await prisma.career.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        icon: data.icon || 'school',
        color: data.color || '0xFF135D66',
        descripcion: data.descripcion,
        activo: data.activo ?? true
      }
    });
  }

  /**
   * Actualizar una carrera
   */
  static async update(id, data) {
    return await prisma.career.update({
      where: { id: parseInt(id) },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        icon: data.icon,
        color: data.color,
        descripcion: data.descripcion,
        activo: data.activo
      }
    });
  }

  /**
   * Eliminar (desactivar) una carrera
   */
  static async delete(id) {
    return await prisma.career.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
  }

  /**
   * Obtener usuarios de una carrera
   */
  static async getUsers(careerId) {
    const career = await prisma.career.findUnique({
      where: { id: parseInt(careerId) },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
                identificacion: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    return career?.users.map(sc => ({
      ...sc.user,
      enrolledAt: sc.enrolledAt
    })) || [];
  }

  /**
   * Inscribir un usuario en una carrera
   */
  static async enrollUser(userId, careerId) {
    return await prisma.userCareer.create({
      data: {
        userId: parseInt(userId),
        careerId: parseInt(careerId)
      },
      include: {
        user: true,
        career: true
      }
    });
  }

  /**
   * Desinscribir un usuario de una carrera
   */
  static async unenrollUser(userId, careerId) {
    return await prisma.userCareer.deleteMany({
      where: {
        userId: parseInt(userId),
        careerId: parseInt(careerId)
      }
    });
  }
}
