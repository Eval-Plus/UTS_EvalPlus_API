import prisma from '../config/prisma.js';

export class EvaluationModel {
  /**
   * Obtener todas las evaluaciones activas
   */
  static async findAll() {
    return await prisma.evaluation.findMany({
      where: { activo: true },
      include: {
        template: { select: { id: true, nombre: true } },
        subject: { select: { id: true, nombre: true, codigo: true } },
        teacher: { select: { id: true, nombreCompleto: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener evaluación por ID con todas sus relaciones
   */
  static async findById(id) {
    return await prisma.evaluation.findUnique({
      where: { id: parseInt(id) },
      include: {
        template: {
          include: {
            questions: {
              where: { activo: true },
              orderBy: { orden: 'asc' }
            }
          }
        },
        subject: {
          include: {
            career: { select: { id: true, nombre: true, codigo: true } }
          }
        },
        teacher: {
          select: { id: true, nombreCompleto: true, email: true, profilePicture: true }
        },
        studentResponses: {
          where: { completada: true },
          select: { id: true, studentId: true, completada: true, fechaCompleta: true }
        }
      }
    });
  }

  /**
   * Obtener evaluaciones de un profesor específico
   */
  static async findByTeacher(teacherId, periodo = null) {
    const where = {
      teacherId: parseInt(teacherId),
      activo: true
    };

    if (periodo) {
      where.periodo = periodo;
    }

    return await prisma.evaluation.findMany({
      where,
      include: {
        template: { select: { id: true, nombre: true } },
        subject: { 
          select: { 
            id: true, 
            nombre: true, 
            codigo: true,
            career: { select: { nombre: true } },
            // Incluir estudiantes para contar total
            students: {
              select: { userId: true }
            }
          } 
        },
        studentResponses: {
          where: { completada: true },
          select: {
            id: true,
            completada: true,
            fechaCompleta: true
          }
        }
      },
      orderBy: { fechaCierre: 'desc' }
    });
  }

  /**
   * Obtener evaluaciones disponibles para un estudiante
   * (evaluaciones de materias en las que está inscrito)
   */
  static async findAvailableForStudent(studentId) {
    // Obtener materias del estudiante
    const userSubjects = await prisma.userSubject.findMany({
      where: { userId: parseInt(studentId) },
      select: { subjectId: true }
    });

    const subjectIds = userSubjects.map(us => us.subjectId);

    if (subjectIds.length === 0) {
      return [];
    }

    const now = new Date();

    return await prisma.evaluation.findMany({
      where: {
        subjectId: { in: subjectIds },
        activo: true,
        fechaInicio: { lte: now },
        fechaCierre: { gte: now }
      },
      include: {
        template: { select: { id: true, nombre: true } },
        subject: { 
          select: { 
            id: true, 
            nombre: true, 
            codigo: true,
            career: { select: { nombre: true } }
          } 
        },
        teacher: {
          select: { id: true, nombreCompleto: true, profilePicture: true }
        },
        studentResponses: {
          where: { 
            studentId: parseInt(studentId),
            completada: true 
          },
          select: { id: true, completada: true, fechaCompleta: true }
        }
      },
      orderBy: { fechaCierre: 'asc' }
    });
  }

  /**
   * Obtener evaluaciones completadas por un estudiante
   */
  static async findCompletedByStudent(studentId) {
    return await prisma.evaluation.findMany({
      where: {
        studentResponses: {
          some: {
            studentId: parseInt(studentId),
            completada: true
          }
        }
      },
      include: {
        subject: { 
          select: { 
            nombre: true, 
            codigo: true,
            career: { select: { nombre: true } }
          } 
        },
        teacher: { select: { nombreCompleto: true } },
        studentResponses: {
          where: { 
            studentId: parseInt(studentId),
            completada: true 
          },
          select: { fechaCompleta: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener evaluaciones pendientes de un estudiante
   */
  static async findPendingByStudent(studentId) {
    const available = await this.findAvailableForStudent(studentId);
    
    // Filtrar solo las que no han sido completadas
    return available.filter(evaluation => evaluation.studentResponses.length === 0);
  }

  /**
   * Crear nueva evaluación
   */
  static async create(data) {
    return await prisma.evaluation.create({
      data: {
        templateId: parseInt(data.templateId),
        subjectId: parseInt(data.subjectId),
        teacherId: parseInt(data.teacherId),
        periodo: data.periodo,
        fechaInicio: new Date(data.fechaInicio),
        fechaCierre: new Date(data.fechaCierre),
        esObligatoria: data.esObligatoria ?? true,
        activo: data.activo ?? true
      },
      include: {
        template: true,
        subject: true,
        teacher: { select: { id: true, nombreCompleto: true, email: true } }
      }
    });
  }

  /**
   * Actualizar evaluación
   */
  static async update(id, data) {
    const updateData = {};

    if (data.templateId !== undefined) updateData.templateId = parseInt(data.templateId);
    if (data.periodo !== undefined) updateData.periodo = data.periodo;
    if (data.fechaInicio !== undefined) updateData.fechaInicio = new Date(data.fechaInicio);
    if (data.fechaCierre !== undefined) updateData.fechaCierre = new Date(data.fechaCierre);
    if (data.esObligatoria !== undefined) updateData.esObligatoria = data.esObligatoria;
    if (data.activo !== undefined) updateData.activo = data.activo;

    return await prisma.evaluation.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        template: true,
        subject: true,
        teacher: { select: { nombreCompleto: true } }
      }
    });
  }

  /**
   * Desactivar evaluación
   */
  static async delete(id) {
    return await prisma.evaluation.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
  }

  /**
   * Verificar si existe evaluación para materia/profesor/periodo
   */
  static async exists(subjectId, teacherId, periodo) {
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        subjectId_teacherId_periodo: {
          subjectId: parseInt(subjectId),
          teacherId: parseInt(teacherId),
          periodo: periodo
        }
      }
    });

    return !!evaluation;
  }

  /**
   * Obtener estadísticas de una evaluación
   */
  static async getStats(evaluationId) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(evaluationId) },
      include: {
        subject: {
          include: {
            students: true // Todos los estudiantes inscritos
          }
        },
        studentResponses: {
          where: { completada: true }
        }
      }
    });

    if (!evaluation) {
      return null;
    }

    const totalStudents = evaluation.subject.students.length;
    const completedResponses = evaluation.studentResponses.length;
    const pendingResponses = totalStudents - completedResponses;
    const completionRate = totalStudents > 0 
      ? ((completedResponses / totalStudents) * 100).toFixed(2)
      : 0;

    return {
      evaluationId: evaluation.id,
      totalStudents,
      completedResponses,
      pendingResponses,
      completionRate: parseFloat(completionRate)
    };
  }

  /**
   * Verificar si un estudiante puede responder una evaluación
   */
  static async canStudentRespond(evaluationId, studentId) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(evaluationId) },
      select: {
        activo: true,
        fechaInicio: true,
        fechaCierre: true,
        subject: {
          select: {
            students: {
              where: { userId: parseInt(studentId) },
              select: { userId: true }
            }
          }
        },
        studentResponses: {
          where: {
            studentId: parseInt(studentId),
            completada: true
          },
          select: { id: true }
        }
      }
    });

    if (!evaluation) {
      return { canRespond: false, reason: 'Evaluación no encontrada' };
    }

    if (!evaluation.activo) {
      return { canRespond: false, reason: 'Evaluación inactiva' };
    }

    const now = new Date();
    if (now < evaluation.fechaInicio) {
      return { canRespond: false, reason: 'Evaluación aún no ha iniciado' };
    }

    if (now > evaluation.fechaCierre) {
      return { canRespond: false, reason: 'Evaluación ya cerró' };
    }

    if (evaluation.subject.students.length === 0) {
      return { canRespond: false, reason: 'No estás inscrito en esta materia' };
    }

    if (evaluation.studentResponses.length > 0) {
      return { canRespond: false, reason: 'Ya completaste esta evaluación' };
    }

    return { canRespond: true, reason: null };
  }
}

export default EvaluationModel;
