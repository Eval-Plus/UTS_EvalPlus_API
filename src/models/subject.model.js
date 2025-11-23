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
    if (data.professorName !== undefined) updateData.professorName = data.professorName;
    if (data.semestre !== undefined) updateData.semestre = parseInt(data.semestre);
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.activo !== undefined) updateData.activo = data.activo;

    return await prisma.subject.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        career: true
      }
    });
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
   * Obtener estudiantes inscritos en una materia
   */
  static async getStudents(subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) },
      include: {
        students: {
          include: {
            student: {
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

    return subject?.students.map(ss => ({
      ...ss.student,
      enrolledAt: ss.enrolledAt
    })) || [];
  }

  /**
   * Inscribir un estudiante en una materia
   */
  static async enrollStudent(studentId, subjectId) {
    return await prisma.studentSubject.create({
      data: {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId)
      },
      include: {
        student: true,
        subject: {
          include: {
            career: true
          }
        }
      }
    });
  }

  /**
   * Desinscribir un estudiante de una materia
   */
  static async unenrollStudent(studentId, subjectId) {
    return await prisma.studentSubject.deleteMany({
      where: {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId)
      }
    });
  }

  /**
   * Verificar si un estudiante está inscrito en una materia
   */
  static async isStudentEnrolled(studentId, subjectId) {
    const enrollment = await prisma.studentSubject.findFirst({
      where: {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId)
      }
    });

    return !!enrollment;
  }

  /**
   * Obtener N materias aleatorias de una carrera
   */
  static async getRandomSubjectsByCareer(careerId, count = 3) {
    const subjects = await prisma.subject.findMany({
      where: {
        careerId: parseInt(careerId),
        activo: true
      }
    });

    if (subjects.length === 0) {
      return [];
    }

    if (subjects.length <= count) {
      return subjects.map(s => s.id);
    }

    // Mezclar y tomar las primeras 'count'
    const shuffled = subjects
      .map(subject => ({ subject, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ subject }) => subject.id)
      .slice(0, count);

    return shuffled;
  }

  /**
   * Inscribir un estudiante en múltiples materias
   */
  static async enrollStudentInMultipleSubjects(studentId, subjectIds) {
    const enrollments = [];

    for (const subjectId of subjectIds) {
      try {
        const isEnrolled = await this.isStudentEnrolled(studentId, subjectId);

        if (!isEnrolled) {
          const enrollment = await this.enrollStudent(studentId, subjectId);
          enrollments.push(enrollment);
        }
      } catch (error) {
        console.warn(`No se pudo inscribir en materia ${subjectId}:`, error.message);
      }
    }

    return enrollments;
  }

}
