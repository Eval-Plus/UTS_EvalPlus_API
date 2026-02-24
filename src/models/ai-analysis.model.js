/**
 * Modelo para la tabla ai_analysis
 * Maneja el CRUD de análisis de IA generados para docentes
 */

import prisma from '../config/prisma.js';

export class AIAnalysisModel {
  /**
   * Busca el análisis más reciente de un docente en un período
   */
  static async findByTeacherAndPeriod(teacherId, periodo) {
    return await prisma.aIAnalysis.findUnique({
      where: {
        teacherId_periodo: {
          teacherId: parseInt(teacherId),
          periodo,
        },
      },
      include: {
        teacher: {
          select: { id: true, nombreCompleto: true, email: true },
        },
      },
    });
  }

  /**
   * Crea o actualiza el análisis de un docente (upsert)
   * La tabla tiene restricción única por teacherId + periodo
   */
  static async upsert(data) {
    return await prisma.aIAnalysis.upsert({
      where: {
        teacherId_periodo: {
          teacherId: parseInt(data.teacherId),
          periodo: data.periodo,
        },
      },
      update: {
        profile: data.profile,
        strengths: data.strengths,
        improvements: data.improvements,
        recommendations: data.recommendations,
        modelVersion: data.modelVersion,
        evaluationsCount: data.evaluationsCount,
        responsesCount: data.responsesCount,
        averageScore: data.averageScore,
        analysisDate: new Date(),
        updatedAt: new Date(),
      },
      create: {
        teacherId: parseInt(data.teacherId),
        periodo: data.periodo,
        profile: data.profile,
        strengths: data.strengths,
        improvements: data.improvements,
        recommendations: data.recommendations,
        modelVersion: data.modelVersion,
        evaluationsCount: data.evaluationsCount,
        responsesCount: data.responsesCount,
        averageScore: data.averageScore,
      },
      include: {
        teacher: {
          select: { id: true, nombreCompleto: true },
        },
      },
    });
  }

  /**
   * Elimina el análisis de un docente en un período (para forzar regeneración)
   */
  static async delete(teacherId, periodo) {
    return await prisma.aIAnalysis.delete({
      where: {
        teacherId_periodo: {
          teacherId: parseInt(teacherId),
          periodo,
        },
      },
    });
  }

  /**
   * Lista todos los análisis de un período (útil para el dashboard admin)
   */
  static async findAllByPeriod(periodo) {
    return await prisma.aIAnalysis.findMany({
      where: { periodo },
      include: {
        teacher: {
          select: { id: true, nombreCompleto: true, email: true },
        },
      },
      orderBy: { analysisDate: 'desc' },
    });
  }
}

export default AIAnalysisModel;
