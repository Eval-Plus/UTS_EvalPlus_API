import prisma from '../config/prisma.js';

export class StudentModel {
  /**
   * Buscar estudiante por email
   */
  static async findByEmail(email) {
    return await prisma.student.findUnique({
      where: { email }
    });
  }

  /**
   * Buscar estudiante por Microsoft ID
   */
  static async findByMicrosoftId(microsoftId) {
    return await prisma.student.findUnique({
      where: { microsoftId }
    });
  }

  /**
   * Buscar estudiante por ID
   */
  static async findById(id) {
    return await prisma.student.findUnique({
      where: { id }
    });
  }

  /**
   * Buscar estudiante por identificación
   */
  static async findByIdentificacion(identificacion) {
    return await prisma.student.findUnique({
      where: { identificacion }
    });
  }

  /**
   * Crear nuevo estudiante
   */
  static async create(data) {
    return await prisma.student.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Actualizar estudiante
   */
  static async update(id, data) {
    return await prisma.student.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Eliminar estudiante (soft delete si se implementa)
   */
  static async delete(id) {
    return await prisma.student.delete({
      where: { id }
    });
  }

  /**
   * Listar todos los estudiantes con paginación
   */
  static async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.student.count()
    ]);

    return {
      students,
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
  static isProfileComplete(student) {
    return Boolean(
      student.identificacion &&
      student.carreras.length > 0 &&
      student.materias.length > 0
    );
  }

  /**
   * Buscar estudiantes por carrera
   */
  static async findByCarrera(carrera) {
    return await prisma.student.findMany({
      where: {
        carreras: {
          has: carrera
        }
      }
    });
  }

  /**
   * Buscar estudiantes por materia
   */
  static async findByMateria(materia) {
    return await prisma.student.findMany({
      where: {
        materias: {
          has: materia
        }
      }
    });
  }
}
