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
   * Buscar estudiante por ID con sus carreras
   */
  static async findByIdWithCareers(id) {
    return await prisma.student.findUnique({
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
        }
      }
    });
  }

  /**
   * Obtener todas las carreras de un estudiante
   */
  static async getStudentCareers(studentId) {
    const student = await this.findByIdWithCareers(studentId);

    return student?.careers.map(sc => ({
      ...sc.career,
      enrolledAt: sc.enrolledAt
    })) || [];
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
    // Si student tiene la relación 'careers' cargada
    if (student.careers !== undefined) {
      return Boolean(
        student.identificacion &&
        student.careers.length > 0
      );
    }
    // Si solo tienes el objeto básico, asumimos que necesita completar perfil
    return Boolean(student.identificacion);
  }
}
