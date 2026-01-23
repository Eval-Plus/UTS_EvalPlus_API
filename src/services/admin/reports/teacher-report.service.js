/**
 * Servicio de Reportes de Docentes
 * Maneja toda la lógica para obtener datos de reportes completos
 * 
 * Ubicación: src/services/admin/reports/teacher-report.service.js
 */

import prisma from '../../../config/prisma.js';

export class TeacherReportService {
  /**
   * Obtiene el reporte completo de respuestas de un docente
   * @param {number} teacherId - ID del docente
   * @param {string} periodo - Periodo académico (opcional)
   * @returns {Object} Datos completos del reporte de respuestas
   */
  static async getTeacherResponsesReport(teacherId, periodo = null) {
    try {
      // 1. Obtener todas las evaluaciones del docente (activas)
      const whereClause = {
        teacherId: parseInt(teacherId),
        activo: true,
      };

      if (periodo) {
        whereClause.periodo = periodo;
      }

      const evaluations = await prisma.evaluation.findMany({
        where: whereClause,
        include: {
          template: {
            include: {
              questions: {
                where: { activo: true },
                orderBy: { orden: 'asc' },
              },
            },
          },
          studentResponses: {
            select: {
              id: true,
              completada: true,
              responses: {
                include: {
                  question: {
                    select: {
                      id: true,
                      nroPregunta: true,
                      categoria: true,
                      aspecto: true,
                      enunciado: true,
                      orden: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (evaluations.length === 0) {
        return {
          teacherId,
          periodo,
          totalEvaluations: 0,
          completedEvaluations: 0,
          pendingEvaluations: 0,
          completionRate: 0,
          averageScore: 0,
          questions: [],
        };
      }

      // 2. Calcular estadísticas de evaluaciones
      // Total de evaluaciones = evaluaciones con al menos 1 student response completada
      const evaluationsWithResponses = evaluations.filter(
        evaluation => evaluation.studentResponses.length > 0
      );
      
      // Evaluaciones completadas = evaluaciones con student responses completadas
      const completedEvaluations = evaluations.filter(
        evaluation => evaluation.studentResponses.some(se => se.completada)
      );
      
      // Evaluaciones pendientes = evaluaciones sin ningún student response
      const pendingEvaluations = evaluations.filter(
        evaluation => evaluation.studentResponses.length === 0
      );

      const totalEvaluations = evaluations.length;
      const completedCount = completedEvaluations.length;
      const pendingCount = pendingEvaluations.length;
      
      const completionRate = totalEvaluations > 0 
        ? ((completedCount / totalEvaluations) * 100)
        : 0;

      // 3. Obtener plantilla de preguntas (usar la primera evaluación como referencia)
      const template = evaluations[0].template;
      const questions = template.questions;

      // 4. Procesar respuestas por pregunta
      // Solo considerar student evaluations completadas
      const allCompletedStudentEvaluations = evaluations.flatMap(
        evaluation => evaluation.studentResponses.filter(se => se.completada)
      );

      const questionsReport = questions.map(question => {
        // Obtener todas las respuestas para esta pregunta de evaluaciones completadas
        const questionResponses = allCompletedStudentEvaluations.flatMap(se => 
          se.responses.filter(r => r.question.id === question.id)
        );

        // Contar distribución de respuestas (1-5)
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalScore = 0;
        let responseCount = 0;

        questionResponses.forEach(response => {
          if (response.valorNumerico !== null) {
            const value = response.valorNumerico;
            if (distribution[value] !== undefined) {
              distribution[value]++;
              totalScore += value;
              responseCount++;
            }
          }
        });

        // Calcular promedio
        const average = responseCount > 0 ? totalScore / responseCount : 0;

        return {
          id: question.id,
          number: question.nroPregunta,
          text: question.enunciado,
          category: question.categoria,
          aspect: question.aspecto,
          order: question.orden,
          responses: distribution,
          totalResponses: responseCount,
          average: parseFloat(average.toFixed(2)),
        };
      });

      // 5. Calcular promedio general
      const totalAverage = questionsReport.length > 0
        ? questionsReport.reduce((sum, q) => sum + q.average, 0) / questionsReport.length
        : 0;

      // 6. Retornar reporte completo (SIN subjects)
      return {
        teacherId,
        periodo,
        totalEvaluations,
        completedEvaluations: completedCount,
        pendingEvaluations: pendingCount,
        completionRate: parseFloat(completionRate.toFixed(2)),
        averageScore: parseFloat(totalAverage.toFixed(2)),
        questions: questionsReport,
      };

    } catch (error) {
      console.error('Error en getTeacherResponsesReport:', error);
      throw new Error('Error al obtener reporte de respuestas del docente');
    }
  }

  /**
   * Obtiene detalles de respuestas de una pregunta específica
   * @param {number} teacherId - ID del docente
   * @param {number} questionId - ID de la pregunta
   * @param {string} periodo - Periodo académico (opcional)
   * @returns {Object} Detalles de respuestas de la pregunta
   */
  static async getQuestionResponsesDetail(teacherId, questionId, periodo = null) {
    try {
      // Obtener evaluaciones del docente
      const whereClause = {
        teacherId: parseInt(teacherId),
        activo: true,
      };

      if (periodo) {
        whereClause.periodo = periodo;
      }

      const evaluations = await prisma.evaluation.findMany({
        where: whereClause,
        include: {
          studentResponses: {
            where: { completada: true },
            include: {
              responses: {
                where: { questionId: parseInt(questionId) },
                include: {
                  question: true,
                },
              },
            },
          },
        },
      });

      // Recopilar todas las respuestas
      const allResponses = evaluations.flatMap(evaluation =>
        evaluation.studentResponses.flatMap(se => se.responses)
      );

      if (allResponses.length === 0) {
        return {
          questionId,
          totalResponses: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          average: 0,
        };
      }

      // Calcular distribución
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalScore = 0;

      allResponses.forEach(response => {
        if (response.valorNumerico !== null) {
          const value = response.valorNumerico;
          if (distribution[value] !== undefined) {
            distribution[value]++;
            totalScore += value;
          }
        }
      });

      const total = allResponses.length;
      const average = total > 0 ? totalScore / total : 0;

      // Calcular porcentajes
      const percentages = {};
      Object.keys(distribution).forEach(key => {
        percentages[key] = total > 0
          ? parseFloat(((distribution[key] / total) * 100).toFixed(2))
          : 0;
      });

      return {
        questionId,
        question: allResponses[0]?.question,
        totalResponses: total,
        distribution,
        percentages,
        average: parseFloat(average.toFixed(2)),
      };

    } catch (error) {
      console.error('Error en getQuestionResponsesDetail:', error);
      throw new Error('Error al obtener detalles de respuestas de la pregunta');
    }
  }

  /**
   * Obtiene estadísticas resumidas de respuestas por categoría
   * @param {number} teacherId - ID del docente
   * @param {string} periodo - Periodo académico (opcional)
   * @returns {Object} Estadísticas por categoría
   */
  static async getCategoryStatistics(teacherId, periodo = null) {
    try {
      const report = await this.getTeacherResponsesReport(teacherId, periodo);

      // Agrupar preguntas por categoría
      const categoriesMap = {};

      report.questions.forEach(question => {
        const category = question.category;

        if (!categoriesMap[category]) {
          categoriesMap[category] = {
            category,
            questions: [],
            totalResponses: 0,
            averageScore: 0,
          };
        }

        categoriesMap[category].questions.push(question);
        categoriesMap[category].totalResponses += question.totalResponses;
      });

      // Calcular promedios por categoría
      const categories = Object.values(categoriesMap).map(cat => {
        const avgScore = cat.questions.length > 0
          ? cat.questions.reduce((sum, q) => sum + q.average, 0) / cat.questions.length
          : 0;

        return {
          category: cat.category,
          questionsCount: cat.questions.length,
          totalResponses: cat.totalResponses,
          averageScore: parseFloat(avgScore.toFixed(2)),
        };
      });

      return {
        teacherId,
        periodo,
        categories,
      };

    } catch (error) {
      console.error('Error en getCategoryStatistics:', error);
      throw new Error('Error al obtener estadísticas por categoría');
    }
  }
}

export default TeacherReportService;
