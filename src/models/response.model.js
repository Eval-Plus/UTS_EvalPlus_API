import prisma from '../config/prisma.js';

export class ResponseModel {
  /**
   * Crear una nueva respuesta
   * @param {Object} data - Datos de la respuesta
   * @returns {Object} Respuesta creada
   */
  static async create(data) {
    return await prisma.response.create({
      data: {
        studentEvaluationId: parseInt(data.studentEvaluationId),
        questionId: parseInt(data.questionId),
        valorNumerico: data.valorNumerico ? parseInt(data.valorNumerico) : null,
        valorTexto: data.valorTexto || null
      },
      include: {
        question: true,
        studentEvaluation: {
          include: {
            evaluation: {
              include: {
                subject: { select: { nombre: true } },
                teacher: { select: { nombreCompleto: true } }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Crear múltiples respuestas en una transacción
   * @param {Array} responses - Array de respuestas
   * @returns {Object} Resultado de la operación
   */
  static async createMany(responses) {
    return await prisma.response.createMany({
      data: responses.map(r => ({
        studentEvaluationId: parseInt(r.studentEvaluationId),
        questionId: parseInt(r.questionId),
        valorNumerico: r.valorNumerico ? parseInt(r.valorNumerico) : null,
        valorTexto: r.valorTexto || null
      })),
      skipDuplicates: true
    });
  }

  /**
   * Buscar respuesta por ID
   * @param {number} id - ID de la respuesta
   * @returns {Object|null} Respuesta encontrada
   */
  static async findById(id) {
    return await prisma.response.findUnique({
      where: { id: parseInt(id) },
      include: {
        question: true,
        studentEvaluation: {
          include: {
            student: { select: { nombreCompleto: true } },
            evaluation: {
              include: {
                subject: { select: { nombre: true } },
                teacher: { select: { nombreCompleto: true } }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Buscar respuesta específica por studentEvaluationId y questionId
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @param {number} questionId - ID de la pregunta
   * @returns {Object|null} Respuesta encontrada
   */
  static async findByEvaluationAndQuestion(studentEvaluationId, questionId) {
    return await prisma.response.findUnique({
      where: {
        studentEvaluationId_questionId: {
          studentEvaluationId: parseInt(studentEvaluationId),
          questionId: parseInt(questionId)
        }
      },
      include: {
        question: true
      }
    });
  }

  /**
   * Obtener todas las respuestas de una evaluación de estudiante
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @returns {Array} Lista de respuestas
   */
  static async findByStudentEvaluation(studentEvaluationId) {
    return await prisma.response.findMany({
      where: { studentEvaluationId: parseInt(studentEvaluationId) },
      include: {
        question: true
      },
      orderBy: { question: { orden: 'asc' } }
    });
  }

  /**
   * Actualizar una respuesta
   * @param {number} id - ID de la respuesta
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Respuesta actualizada
   */
  static async update(id, data) {
    const updateData = {};

    if (data.valorNumerico !== undefined) {
      updateData.valorNumerico = data.valorNumerico ? parseInt(data.valorNumerico) : null;
    }
    if (data.valorTexto !== undefined) {
      updateData.valorTexto = data.valorTexto || null;
    }

    return await prisma.response.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        question: true
      }
    });
  }

  /**
   * Eliminar una respuesta
   * @param {number} id - ID de la respuesta
   * @returns {Object} Respuesta eliminada
   */
  static async delete(id) {
    return await prisma.response.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Verificar si ya existe una respuesta para una pregunta
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @param {number} questionId - ID de la pregunta
   * @returns {boolean} True si existe
   */
  static async exists(studentEvaluationId, questionId) {
    const response = await this.findByEvaluationAndQuestion(studentEvaluationId, questionId);
    return !!response;
  }

  /**
   * Contar respuestas de una evaluación de estudiante
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @returns {number} Cantidad de respuestas
   */
  static async countByStudentEvaluation(studentEvaluationId) {
    return await prisma.response.count({
      where: { studentEvaluationId: parseInt(studentEvaluationId) }
    });
  }

  /**
   * Obtener estadísticas de respuestas de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Object} Estadísticas
   */
  static async getEvaluationStatistics(evaluationId) {
    // Obtener todas las respuestas de evaluaciones completadas
    const responses = await prisma.response.findMany({
      where: {
        studentEvaluation: {
          evaluationId: parseInt(evaluationId),
          completada: true
        }
      },
      include: {
        question: {
          select: {
            id: true,
            nroPregunta: true,
            enunciado: true,
            categoria: true,
            aspecto: true
          }
        }
      }
    });

    // Agrupar por pregunta y calcular promedios
    const statistics = {};

    responses.forEach(response => {
      const questionId = response.questionId;
      
      if (!statistics[questionId]) {
        statistics[questionId] = {
          question: response.question,
          totalResponses: 0,
          numericResponses: [],
          textResponses: [],
          average: 0
        };
      }

      statistics[questionId].totalResponses++;

      if (response.valorNumerico !== null) {
        statistics[questionId].numericResponses.push(response.valorNumerico);
      }

      if (response.valorTexto !== null) {
        statistics[questionId].textResponses.push(response.valorTexto);
      }
    });

    // Calcular promedios
    Object.keys(statistics).forEach(questionId => {
      const stat = statistics[questionId];
      if (stat.numericResponses.length > 0) {
        const sum = stat.numericResponses.reduce((a, b) => a + b, 0);
        stat.average = (sum / stat.numericResponses.length).toFixed(2);
      }
    });

    return statistics;
  }

  /**
   * Obtener distribución de respuestas por valor numérico
   * @param {number} evaluationId - ID de la evaluación
   * @param {number} questionId - ID de la pregunta
   * @returns {Object} Distribución de respuestas
   */
  static async getResponseDistribution(evaluationId, questionId) {
    const responses = await prisma.response.findMany({
      where: {
        questionId: parseInt(questionId),
        studentEvaluation: {
          evaluationId: parseInt(evaluationId),
          completada: true
        }
      },
      select: {
        valorNumerico: true
      }
    });

    // Contar distribución (1-5)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    responses.forEach(response => {
      if (response.valorNumerico && distribution[response.valorNumerico] !== undefined) {
        distribution[response.valorNumerico]++;
      }
    });

    const total = responses.length;
    const percentages = {};
    
    Object.keys(distribution).forEach(key => {
      percentages[key] = total > 0 
        ? ((distribution[key] / total) * 100).toFixed(2)
        : 0;
    });

    return {
      distribution,
      percentages,
      total
    };
  }

  /**
   * Obtener respuestas de texto de una pregunta específica
   * @param {number} evaluationId - ID de la evaluación
   * @param {number} questionId - ID de la pregunta
   * @returns {Array} Lista de respuestas de texto
   */
  static async getTextResponses(evaluationId, questionId) {
    return await prisma.response.findMany({
      where: {
        questionId: parseInt(questionId),
        studentEvaluation: {
          evaluationId: parseInt(evaluationId),
          completada: true
        },
        valorTexto: { not: null }
      },
      select: {
        valorTexto: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener promedio general de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Object} Promedio general y por categoría
   */
  static async getGeneralAverage(evaluationId) {
    const statistics = await this.getEvaluationStatistics(evaluationId);
    
    let totalSum = 0;
    let totalCount = 0;
    const categoriesAvg = {};

    Object.values(statistics).forEach(stat => {
      if (stat.numericResponses.length > 0) {
        const avg = parseFloat(stat.average);
        totalSum += avg;
        totalCount++;

        // Agrupar por categoría
        const category = stat.question.categoria;
        if (!categoriesAvg[category]) {
          categoriesAvg[category] = { sum: 0, count: 0 };
        }
        categoriesAvg[category].sum += avg;
        categoriesAvg[category].count++;
      }
    });

    const generalAverage = totalCount > 0 ? (totalSum / totalCount).toFixed(2) : 0;

    // Calcular promedios por categoría
    Object.keys(categoriesAvg).forEach(category => {
      const cat = categoriesAvg[category];
      categoriesAvg[category] = (cat.sum / cat.count).toFixed(2);
    });

    return {
      generalAverage: parseFloat(generalAverage),
      categoriesAverage: categoriesAvg,
      totalQuestions: totalCount
    };
  }
}

export default ResponseModel;
