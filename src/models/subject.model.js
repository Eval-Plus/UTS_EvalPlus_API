import prisma from '../config/prisma.js';

export class SubjectModel {
  /**
   * Obtener todas las materias activas
   */
  static async findAll() {
    return await prisma.subject.findMany({
      where: {
        activo: true
      },
      include: {
        career: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        }
      },
      orderBy: [
        { semestre: 'asc' },
        { nombre: 'asc' }
      ]
    });
  }

  /**
   * Obtener materias de un usuario filtradas por carrera
   */
  static async getSubjetcsByUserAndCareer(userId, { careerId, careerName }) {
    const where = {
      students: { some: { userId } }
    };

    if (careerId) {
      where.careerId = careerId;
    } else if (careerName) {
      where.career = { nombre: careerName };
    }

    return await prisma.subject.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        codigo: true,
        semestre: true,
        activo: true,
        teacher: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true
          }
        },
        evaluations: {
          where: {
            activo: true,
            fechaInicio: { lte: new Date() },
            fechaCierre: { gte: new Date() }
          },
          select: {
            id: true,
            periodo: true,
            fechaInicio: true,
            fechaCierre: true
          },
          take: 1, // Solo evaluación activa
          orderBy: { fechaCierre: 'desc' }
        }
      }
    });
  }

  /**
   * Obtener una materia por ID
   */
  static async findById(id) {
    return await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      include: {
        career: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            icon: true,
            color: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
                identificacion: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Obtener una materia por código
   */
  static async findByCode(codigo) {
    return await prisma.subject.findUnique({
      where: { codigo },
      include: {
        career: true
      }
    });
  }

  /**
   * Obtener materias por carrera
   */
  static async findByCareer(careerId) {
    return await prisma.subject.findMany({
      where: {
        careerId: parseInt(careerId),
        activo: true
      },
      orderBy: [
        { semestre: 'asc' },
        { nombre: 'asc' }
      ]
    });
  }

  /**
   * Obtener materias por código de carrera
   */
  static async findByCareerCode(careerCode) {
    const career = await prisma.career.findUnique({
      where: { codigo: careerCode }
    });

    if (!career) {
      return [];
    }

    return await this.findByCareer(career.id);
  }

  /**
   * Obtener materias por semestre
   */
  static async findBySemester(semestre, careerId = null) {
    const where = {
      semestre: parseInt(semestre),
      activo: true
    };

    if (careerId) {
      where.careerId = parseInt(careerId);
    }

    return await prisma.subject.findMany({
      where,
      include: {
        career: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
  }

  /**
   * 🆕 Obtener materias sin profesor asignado
   * @returns {Array} Lista de materias sin profesor
   */
  static async findSubjectsWithoutTeacher() {
    return await prisma.subject.findMany({
      where: {
        teacherId: null,
        activo: true
      },
      include: {
        career: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        }
      },
      orderBy: [
        { semestre: 'asc' },
        { nombre: 'asc' }
      ]
    });
  }

  /**
   * 🆕 Obtener el número de estudiantes inscritos en una materia
   * @param {number} subjectId - ID de la materia
   * @returns {number} Cantidad de estudiantes
   */
  static async getStudentCount(subjectId) {
    const count = await prisma.userSubject.count({
      where: {
        subjectId: parseInt(subjectId)
      }
    });
    return count;
  }

  /**
   * Crear una nueva materia
   */
  static async create(data) {
    return await prisma.subject.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        careerId: parseInt(data.careerId),
        professorName: data.professorName,
        semestre: parseInt(data.semestre) || 1,
        descripcion: data.descripcion,
        activo: data.activo ?? true
      },
      include: {
        career: true
      }
    });
  }

  /**
   * Actualizar una materia
   */
  static async update(id, data) {
    const updateData = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.careerId !== undefined) updateData.careerId = parseInt(data.careerId);
    if (data.teacherId !== undefined) {
      // Permitir null para quitar profesor
      updateData.teacherId = data.teacherId === null ? null : parseInt(data.teacherId);
    }
    if (data.semestre !== undefined) updateData.semestre = parseInt(data.semestre);
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.activo !== undefined) updateData.activo = data.activo;

    // 🔥 IMPORTANTE: Asegurarse de que realmente se hace el UPDATE
    const updated = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        career: true,
        teacher: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Materia ${updated.nombre} actualizada - Profesor ID: ${updated.teacherId}`);

    return updated;
  }

  /**
   * Eliminar (desactivar) una materia
   */
  static async delete(id) {
    return await prisma.subject.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
  }

  /**
   * Obtener usuarios inscritos en una materia
   */
  static async getUsers(subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) },
      include: {
        students: {
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

    return subject?.user.map(ss => ({
      ...ss.student,
      enrolledAt: ss.enrolledAt
    })) || [];
  }

  /**
   * Inscribir un usuario en una materia
   */
  static async enrollUser(userId, subjectId, periodo = null) {
    return await prisma.userSubject.create({
      data: {
        userId: parseInt(userId),
        subjectId: parseInt(subjectId),
        periodo: preiodo || new Date().getFullYear() + '-1'
      },
      include: {
        user: true,
        subject: {
          include: {
            career: true
          }
        }
      }
    });
  }

  /**
   * Desinscribir un usuario de una materia
   */
  static async unenrollUser(userId, subjectId) {
    return await prisma.userSubject.deleteMany({
      where: {
        userId: parseInt(userId),
        subjectId: parseInt(subjectId)
      }
    });
  }

  /**
   * Verificar si un estudiante está inscrito en una materia
   */
  static async isUserEnrolled(userId, subjectId) {
    const enrollment = await prisma.userSubject.findFirst({
      where: {
        userId: parseInt(userId),
        subjectId: parseInt(subjectId)
      }
    });

    return !!enrollment;
  }

  /**
   * 🆕 Obtener una materia aleatoria de una carrera
   * @param {number} careerId - ID de la carrera
   * @returns {Object|null} Materia aleatoria
   */
  static async getRandomSubjectByCareer(careerId) {
    const subjects = await prisma.subject.findMany({
      where: {
        careerId: parseInt(careerId),
        activo: true
      }
    });

    if (subjects.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * subjects.length);
    return subjects[randomIndex];
  }

  /**
   * 🆕 Obtener materias de una carrera y semestre específico (excluyendo una materia)
   * @param {number} careerId - ID de la carrera
   * @param {number} semestre - Número del semestre
   * @param {number} excludeSubjectId - ID de materia a excluir
   * @param {number} limit - Cantidad máxima a retornar
   * @returns {Array} Lista de materias
   */
  static async getSubjectsByCareerAndSemester(careerId, semestre, excludeSubjectId = null, limit = null) {
    const where = {
      careerId: parseInt(careerId),
      semestre: parseInt(semestre),
      activo: true
    };

    if (excludeSubjectId) {
      where.id = { not: parseInt(excludeSubjectId) };
    }

    const query = {
      where,
      orderBy: { nombre: 'asc' }
    };

    if (limit) {
      query.take = limit;
    }

    return await prisma.subject.findMany(query);
  }

  /**
   * 🆕 Obtener materias de un semestre específico de una carrera (para inscripción aleatoria)
   * @param {number} careerId - ID de la carrera
   * @param {number} semestre - Número del semestre
   * @param {number} count - Cantidad de materias a retornar
   * @returns {Array<number>} IDs de materias seleccionadas
   */
  static async getRandomSubjectsBySemester(careerId, semestre, count = 3) {
    const subjects = await this.getSubjectsByCareerAndSemester(careerId, semestre);

    if (subjects.length === 0) {
      return [];
    }

    // Si hay menos materias que las solicitadas, retornar todas
    if (subjects.length <= count) {
      return subjects.map(s => s.id);
    }

    // Seleccionar 'count' materias aleatorias
    const shuffled = subjects
      .map(subject => ({ subject, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ subject }) => subject.id)
      .slice(0, count);

    return shuffled;
  }

  /**
   * 🆕 Obtener todas las materias de una carrera agrupadas por semestre
   * @param {number} careerId - ID de la carrera
   * @returns {Object} Materias agrupadas por semestre
   */
  static async getSubjectsGroupedBySemester(careerId) {
    const subjects = await prisma.subject.findMany({
      where: {
        careerId: parseInt(careerId),
        activo: true
      },
      orderBy: [
        { semestre: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // Agrupar por semestre
    const grouped = subjects.reduce((acc, subject) => {
      const semester = subject.semestre;
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(subject);
      return acc;
    }, {});

    return grouped;
  }

  /**
   * Actualización del método existente para usar la nueva lógica
   * @deprecated Usar getRandomSubjectsBySemester en su lugar
   */
  static async getRandomSubjectsByCareer(careerId, count = 3) {
    // Primero obtener una materia aleatoria para determinar el semestre
    const randomSubject = await this.getRandomSubjectByCareer(careerId);
    
    if (!randomSubject) {
      return [];
    }

    // Obtener materias del mismo semestre
    return await this.getRandomSubjectsBySemester(careerId, randomSubject.semestre, count);
  }

  /**
   * Inscribir un usuario en múltiples materias
   */
  static async enrollUserInMultipleSubjects(userId, subjectIds, periodo = null) {
    const enrollments = [];

    for (const subjectId of subjectIds) {
      try {
        const isEnrolled = await this.isUserEnrolled(userId, subjectId);

        if (!isEnrolled) {
          const enrollment = await this.enrollUser(userId, subjectId, periodo);
          enrollments.push(enrollment);
        }
      } catch (error) {
        console.warn(`No se pudo inscribir en materia ${subjectId}:`, error.message);
      }
    }

    return enrollments;
  }

}
