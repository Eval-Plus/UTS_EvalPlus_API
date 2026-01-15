/**
 * Servicio de Análisis de Docentes
 * Proporciona análisis detallado del desempeño de profesores
 */

import { createLogger } from '../../../utils/logger.js';
import prisma from '../../../config/prisma.js';
import { CURRENT_PERIOD } from '../sync/sync-base.service.js';

const logger = createLogger('TeacherAnalyticsService');

export class TeacherAnalyticsService {
  /**
   * Obtiene análisis completo de todos los docentes
   */
  static async getTeachersAnalysis(filters = {}) {
    try {
      const { periodo = CURRENT_PERIOD, career, sortBy = 'name' } = filters;

      const teachers = await this._getTeachersWithData(periodo, career);
      const teachersData = this._processTeachersData(teachers, periodo);
      const filteredTeachers = this._filterTeachers(teachersData, career);
      const sortedTeachers = this._sortTeachers(filteredTeachers, sortBy);
      const globalStats = this._calculateGlobalStats(filteredTeachers);

      return {
        teachers: sortedTeachers,
        stats: globalStats,
        periodo,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo análisis de docentes', error);
      throw error;
    }
  }

  /**
   * Obtiene análisis detallado de un docente específico
   */
  static async getTeacherAnalysis(teacherId, periodo = CURRENT_PERIOD) {
    try {
      const teacher = await this._getTeacherWithDetails(teacherId);

      if (!teacher || !this._isTeacher(teacher)) {
        return null;
      }

      const evaluationsDetail = this._processEvaluations(teacher.taughtSubjects, periodo);
      const summary = this._calculateTeacherSummary(evaluationsDetail);

      return {
        teacher: this._formatTeacherInfo(teacher),
        summary,
        evaluations: evaluationsDetail,
        subjects: this._formatSubjects(teacher.taughtSubjects),
        periodo,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error obteniendo análisis del docente ${teacherId}`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas globales para análisis
   */
  static async getAnalysisStats(filters = {}) {
    try {
      const { periodo = CURRENT_PERIOD, career } = filters;

      const whereSubject = this._buildSubjectWhere(career);
      const whereEvaluation = this._buildEvaluationWhere(periodo, career);

      const [
        totalTeachers,
        totalEvaluations,
        totalStudents,
        completedResponses
      ] = await Promise.all([
        this._countTeachers(whereSubject),
        this._countEvaluations(whereEvaluation),
        this._countStudents(periodo, whereSubject),
        this._countCompletedResponses(whereEvaluation)
      ]);

      return {
        totalTeachers,
        totalEvaluations,
        totalStudents,
        completedResponses,
        pendingResponses: totalStudents - completedResponses,
        avgCompletion: this._calculateAvgCompletion(completedResponses, totalStudents),
        periodo,
        career: career || 'all'
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de análisis', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS - OBTENCIÓN DE DATOS
  // ==========================================

  static async _getTeachersWithData(periodo, career) {
    return await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: 'TEACHER' }
          }
        }
      },
      include: {
        taughtSubjects: {
          where: {
            activo: true,
            ...(career && {
              career: {
                codigo: career
              }
            })
          },
          include: {
            career: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            },
            students: {
              where: { periodo },
              select: { userId: true }
            },
            evaluations: {
              where: {
                periodo,
                activo: true
              },
              include: {
                studentResponses: {
                  select: {
                    id: true,
                    completada: true,
                    fechaCompleta: true
                  }
                }
              }
            }
          }
        },
        roles: {
          include: { role: true }
        }
      }
    });
  }

  static async _getTeacherWithDetails(teacherId) {
    return await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        taughtSubjects: {
          where: { activo: true },
          include: {
            career: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            },
            students: {
              select: { userId: true }
            },
            evaluations: {
              where: { activo: true },
              include: {
                template: {
                  select: {
                    id: true,
                    nombre: true
                  }
                },
                studentResponses: {
                  include: {
                    responses: {
                      include: {
                        question: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        roles: {
          include: { role: true }
        }
      }
    });
  }

  // ==========================================
  // MÉTODOS PRIVADOS - PROCESAMIENTO
  // ==========================================

  static _processTeachersData(teachers, periodo) {
    return teachers.map(teacher => {
      const subjects = teacher.taughtSubjects;
      const metrics = this._calculateTeacherMetrics(subjects);
      const mainCareer = this._determineMainCareer(subjects);
      const lastActivity = this._getLastActivity(subjects, teacher);

      return {
        id: teacher.id,
        name: teacher.nombreCompleto,
        email: teacher.email,
        career: mainCareer.codigo,
        careerName: mainCareer.nombre,
        totalSubjects: subjects.length,
        ...metrics,
        lastActivity: lastActivity?.toISOString().split('T')[0] || '',
        subjects: this._formatSubjectsSummary(subjects),
        avgRating: 0, // TODO: Implementar ratings
        period: periodo
      };
    });
  }

  static _calculateTeacherMetrics(subjects) {
    let totalStudents = 0;
    let completedResponses = 0;
    let pendingResponses = 0;
    let activeEvaluations = 0;
    let closedEvaluations = 0;

    const now = new Date();

    subjects.forEach(subject => {
      const studentsCount = subject.students.length;
      totalStudents += studentsCount;

      subject.evaluations.forEach(evaluation => {
        const isActive = evaluation.fechaCierre >= now;
        
        if (isActive) {
          activeEvaluations++;
        } else {
          closedEvaluations++;
        }

        const completed = evaluation.studentResponses.filter(r => r.completada).length;
        const pending = studentsCount - completed;

        completedResponses += completed;
        pendingResponses += pending;
      });
    });

    const completionRate = totalStudents > 0
      ? Math.round((completedResponses / totalStudents) * 100)
      : 0;

    return {
      activeEvaluations,
      closedEvaluations,
      completionRate,
      totalStudents,
      completedResponses,
      pendingResponses
    };
  }

  static _determineMainCareer(subjects) {
    if (subjects.length === 0) {
      return { codigo: '', nombre: '' };
    }

    const careerCounts = {};
    subjects.forEach(subject => {
      const careerCode = subject.career.codigo;
      careerCounts[careerCode] = (careerCounts[careerCode] || 0) + 1;
    });

    const mainCareerCode = Object.keys(careerCounts).sort(
      (a, b) => careerCounts[b] - careerCounts[a]
    )[0];

    const mainCareer = subjects.find(s => s.career.codigo === mainCareerCode)?.career;
    return mainCareer || { codigo: '', nombre: '' };
  }

  static _getLastActivity(subjects, teacher) {
    const allResponses = subjects.flatMap(s =>
      s.evaluations.flatMap(e =>
        e.studentResponses.filter(r => r.completada && r.fechaCompleta)
      )
    );

    if (allResponses.length === 0) {
      return teacher.lastLoginAt || teacher.createdAt;
    }

    return allResponses.sort((a, b) =>
      new Date(b.fechaCompleta) - new Date(a.fechaCompleta)
    )[0].fechaCompleta;
  }

  static _processEvaluations(subjects, periodo) {
    const now = new Date();
    const evaluationsDetail = [];

    subjects.forEach(subject => {
      subject.evaluations.forEach(evaluation => {
        const studentsCount = subject.students.length;
        const completedCount = evaluation.studentResponses.filter(r => r.completada).length;

        evaluationsDetail.push({
          id: evaluation.id,
          subjectName: subject.nombre,
          subjectCode: subject.codigo,
          careerName: subject.career.nombre,
          templateName: evaluation.template.nombre,
          periodo: evaluation.periodo,
          fechaInicio: evaluation.fechaInicio,
          fechaCierre: evaluation.fechaCierre,
          isActive: evaluation.fechaCierre >= now,
          totalStudents: studentsCount,
          completedResponses: completedCount,
          pendingResponses: studentsCount - completedCount,
          completionRate: studentsCount > 0
            ? Math.round((completedCount / studentsCount) * 100)
            : 0
        });
      });
    });

    return evaluationsDetail;
  }

  static _calculateTeacherSummary(evaluationsDetail) {
    const totalStudents = evaluationsDetail.reduce((sum, e) => sum + e.totalStudents, 0);
    const completedResponses = evaluationsDetail.reduce((sum, e) => sum + e.completedResponses, 0);

    return {
      totalSubjects: new Set(evaluationsDetail.map(e => e.subjectCode)).size,
      totalEvaluations: evaluationsDetail.length,
      activeEvaluations: evaluationsDetail.filter(e => e.isActive).length,
      closedEvaluations: evaluationsDetail.filter(e => !e.isActive).length,
      totalStudents,
      completedResponses,
      pendingResponses: totalStudents - completedResponses,
      overallCompletionRate: totalStudents > 0
        ? Math.round((completedResponses / totalStudents) * 100)
        : 0
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS - FORMATEO Y UTILIDADES
  // ==========================================

  static _isTeacher(teacher) {
    return teacher.roles.some(ur => ur.role.name === 'TEACHER');
  }

  static _filterTeachers(teachers, career) {
    return career
      ? teachers.filter(t => t.totalSubjects > 0)
      : teachers;
  }

  static _sortTeachers(teachers, sortBy) {
    const sortFunctions = {
      name: (a, b) => a.name.localeCompare(b.name),
      evaluations: (a, b) => b.activeEvaluations - a.activeEvaluations,
      completion: (a, b) => a.completionRate - b.completionRate,
      activity: (a, b) => b.lastActivity.localeCompare(a.lastActivity)
    };

    const sortFn = sortFunctions[sortBy] || sortFunctions.name;
    return [...teachers].sort(sortFn);
  }

  static _calculateGlobalStats(teachers) {
    return {
      totalTeachers: teachers.length,
      totalEvaluations: teachers.reduce((sum, t) => sum + t.activeEvaluations, 0),
      avgCompletion: teachers.length > 0
        ? (teachers.reduce((sum, t) => sum + t.completionRate, 0) / teachers.length).toFixed(1)
        : '0.0',
      totalStudents: teachers.reduce((sum, t) => sum + t.totalStudents, 0)
    };
  }

  static _formatTeacherInfo(teacher) {
    return {
      id: teacher.id,
      name: teacher.nombreCompleto,
      email: teacher.email,
      profilePicture: teacher.profilePicture
    };
  }

  static _formatSubjects(subjects) {
    return subjects.map(s => ({
      id: s.id,
      name: s.nombre,
      code: s.codigo,
      career: s.career.nombre,
      studentsCount: s.students.length
    }));
  }

  static _formatSubjectsSummary(subjects) {
    const now = new Date();
    
    return subjects.map(subject => {
      const evaluation = subject.evaluations[0]; // Asumiendo una evaluación por materia
      if (!evaluation) return null;

      const studentsCount = subject.students.length;
      const completed = evaluation.studentResponses.filter(r => r.completada).length;

      return {
        name: subject.nombre,
        code: subject.codigo,
        students: studentsCount,
        completed,
        pending: studentsCount - completed,
        evaluationId: evaluation.id,
        isActive: evaluation.fechaCierre >= now
      };
    }).filter(Boolean);
  }

  // Métodos auxiliares para estadísticas
  static _buildSubjectWhere(career) {
    return {
      activo: true,
      teacherId: { not: null },
      ...(career && { career: { codigo: career } })
    };
  }

  static _buildEvaluationWhere(periodo, career) {
    return {
      periodo,
      activo: true,
      ...(career && {
        subject: {
          career: { codigo: career }
        }
      })
    };
  }

  static async _countTeachers(whereSubject) {
    const result = await prisma.subject.groupBy({
      by: ['teacherId'],
      where: whereSubject,
      _count: true
    });
    return result.length;
  }

  static async _countEvaluations(whereEvaluation) {
    return await prisma.evaluation.count({
      where: whereEvaluation
    });
  }

  static async _countStudents(periodo, whereSubject) {
    return await prisma.userSubject.count({
      where: {
        periodo,
        subject: whereSubject
      }
    });
  }

  static async _countCompletedResponses(whereEvaluation) {
    return await prisma.studentEvaluation.count({
      where: {
        completada: true,
        evaluation: whereEvaluation
      }
    });
  }

  static _calculateAvgCompletion(completed, total) {
    if (total === 0) return 0;
    return parseFloat(((completed / total) * 100).toFixed(1));
  }
}

export default TeacherAnalyticsService;
