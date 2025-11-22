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
   * Seed inicial - Crear materias de prueba para Ingeniería de Sistemas
   */
  static async seedSubjects() {
    // Obtener la carrera de Ingeniería de Sistemas
    const career = await prisma.career.findUnique({
      where: { codigo: 'ING-SIS' }
    });

    if (!career) {
      console.error('No se encontró la carrera ING-SIS. Ejecuta el seed de carreras primero.');
      return [];
    }

    const subjects = [
      {
        nombre: 'Fundamentos de Programación',
        codigo: 'B101',
        careerId: career.id,
        professorName: 'Dr. Roberto Silva',
        semestre: 1,
        descripcion: 'Introducción a los conceptos básicos de programación y algoritmos'
      },
      {
        nombre: 'Estructuras de Datos',
        codigo: 'B193',
        careerId: career.id,
        professorName: 'Ing. Carlos Rodríguez',
        semestre: 2,
        descripcion: 'Estudio de estructuras de datos fundamentales: listas, pilas, colas, árboles'
      },
      {
        nombre: 'Programación Orientada a Objetos',
        codigo: 'B191',
        careerId: career.id,
        professorName: 'Dr. Juan Pérez',
        semestre: 3,
        descripcion: 'Paradigma de programación orientada a objetos con Java y Python'
      },
      {
        nombre: 'Bases de Datos',
        codigo: 'B192',
        careerId: career.id,
        professorName: 'Dra. María García',
        semestre: 4,
        descripcion: 'Diseño, implementación y gestión de bases de datos relacionales'
      },
      {
        nombre: 'Desarrollo Web',
        codigo: 'B194',
        careerId: career.id,
        professorName: 'Ing. Ana Martínez',
        semestre: 5,
        descripcion: 'Desarrollo de aplicaciones web con HTML, CSS, JavaScript y frameworks modernos'
      },
      {
        nombre: 'Ingeniería de Software',
        codigo: 'B601',
        careerId: career.id,
        professorName: 'Dr. Luis Fernández',
        semestre: 6,
        descripcion: 'Metodologías ágiles, arquitectura de software y gestión de proyectos'
      }
    ];

    const createdSubjects = [];
    for (const subject of subjects) {
      const existing = await this.findByCode(subject.codigo);
      if (!existing) {
        const created = await this.create(subject);
        createdSubjects.push(created);
      }
    }

    return createdSubjects;
  }
}
