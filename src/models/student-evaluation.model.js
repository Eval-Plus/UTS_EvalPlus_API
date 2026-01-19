import prisma from '../config/prisma.js';

export class StudentEvaluationModel {
  /**
   * Crear un nuevo registro de evaluación de estudiante
   * @param {Object} data - Datos de la evaluación
   * @returns {Object} Evaluación creada
   */
  static async create(data) {
    return await prisma.studentEvaluation.create({
      data: {
        evaluationId: parseInt(data.evaluationId),
        studentId: parseInt(data.studentId),
        completada: false,
        fechaInicio: new Date()
      },
      include: {
        evaluation: {
          include: {
            subject: { select: { nombre: true, codigo: true } },
            teacher: { select: { nombreCompleto: true } }
          }
        }
      }
    });
  }

  /**
   * Buscar evaluación de estudiante por ID
   * @param {number} id - ID de la evaluación del estudiante
   * @returns {Object|null} Evaluación encontrada
   */
  static async findById(id) {
    return await prisma.studentEvaluation.findUnique({
      where: { id: parseInt(id) },
      include: {
        evaluation: {
          include: {
            subject: { select: { nombre: true, codigo: true } },
            teacher: { select: { nombreCompleto: true } },
            template: { select: { id: true, nombre: true } }
          }
        },
        student: {
          select: { id: true, nombreCompleto: true, email: true }
        },
        responses: {
          include: {
            question: true
          }
        }
      }
    });
  }

  /**
   * Buscar evaluación de estudiante por evaluationId y studentId
   * @param {number} evaluationId - ID de la evaluación
   * @param {number} studentId - ID del estudiante
   * @returns {Object|null} Evaluación encontrada
   */
  static async findByEvaluationAndStudent(evaluationId, studentId) {
    return await prisma.studentEvaluation.findUnique({
      where: {
        evaluationId_studentId: {
          evaluationId: parseInt(evaluationId),
          studentId: parseInt(studentId)
        }
      },
      include: {
        evaluation: {
          include: {
            subject: { select: { nombre: true, codigo: true } },
            teacher: { select: { nombreCompleto: true } },
            template: { select: { id: true, nombre: true } }
          }
        },
        responses: {
          include: {
            question: true
          }
        }
      }
    });
  }

  /**
   * Obtener todas las evaluaciones de un estudiante
   * @param {number} studentId - ID del estudiante
   * @param {boolean} completada - Filtrar por completadas/pendientes
   * @returns {Array} Lista de evaluaciones
   */
  static async findByStudent(studentId, completada = null) {
    const where = { studentId: parseInt(studentId) };
    
    if (completada !== null) {
      where.completada = completada;
    }

    return await prisma.studentEvaluation.findMany({
      where,
      include: {
        evaluation: {
          include: {
            subject: { select: { nombre: true, codigo: true } },
            teacher: { select: { nombreCompleto: true } }
          }
        },
        responses: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener todas las evaluaciones completadas de una evaluación específica
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Array} Lista de evaluaciones completadas
   */
  static async findCompletedByEvaluation(evaluationId) {
    return await prisma.studentEvaluation.findMany({
      where: {
        evaluationId: parseInt(evaluationId),
        completada: true
      },
      include: {
        student: {
          select: { id: true, nombreCompleto: true }
        },
        responses: {
          include: {
            question: true
          }
        }
      },
      orderBy: { fechaCompleta: 'desc' }
    });
  }

  /**
   * Actualizar evaluación de estudiante
   * @param {number} id - ID de la evaluación
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Evaluación actualizada
   */
  static async update(id, data) {
    const updateData = {};

    if (data.completada !== undefined) updateData.completada = data.completada;
    if (data.comentario !== undefined) updateData.comentario = data.comentario;
    if (data.fechaInicio !== undefined) updateData.fechaInicio = new Date(data.fechaInicio);
    if (data.fechaCompleta !== undefined) updateData.fechaCompleta = new Date(data.fechaCompleta);
    
    // 🆕 Campos de sentimiento
    if (data.sentiment !== undefined) updateData.sentiment = data.sentiment;
    if (data.sentimentScore !== undefined) updateData.sentimentScore = data.sentimentScore;
    if (data.sentimentAnalyzedAt !== undefined) updateData.sentimentAnalyzedAt = new Date(data.sentimentAnalyzedAt);

    return await prisma.studentEvaluation.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        evaluation: true,
        responses: true
      }
    });
  }

  /**
   * Marcar evaluación como completada
   * @param {number} id - ID de la evaluación del estudiante
   * @param {string} comentario - Comentario opcional del estudiante
   * @returns {Object} Evaluación actualizada
   */
  static async markAsCompleted(id, comentario = null) {
    return await prisma.studentEvaluation.update({
      where: { id: parseInt(id) },
      data: {
        completada: true,
        comentario: comentario,
        fechaCompleta: new Date()
      },
      include: {
        evaluation: true,
        responses: true
      }
    });
  }

  /**
   * Verificar si un estudiante ya tiene una evaluación iniciada o completada
   * @param {number} evaluationId - ID de la evaluación
   * @param {number} studentId - ID del estudiante
   * @returns {boolean} True si existe
   */
  static async exists(evaluationId, studentId) {
    const evaluation = await this.findByEvaluationAndStudent(evaluationId, studentId);
    return !!evaluation;
  }

  /**
   * Contar evaluaciones completadas de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {number} Cantidad de evaluaciones completadas
   */
  static async countCompletedByEvaluation(evaluationId) {
    return await prisma.studentEvaluation.count({
      where: {
        evaluationId: parseInt(evaluationId),
        completada: true
      }
    });
  }

  /**
   * Obtener progreso de una evaluación (% completado)
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Object} Estadísticas de progreso
   */
  static async getEvaluationProgress(evaluationId) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(evaluationId) },
      include: {
        subject: {
          include: {
            students: true
          }
        }
      }
    });

    if (!evaluation) {
      return null;
    }

    const totalStudents = evaluation.subject.students.length;
    const completed = await this.countCompletedByEvaluation(evaluationId);
    const pending = totalStudents - completed;
    const percentage = totalStudents > 0 ? ((completed / totalStudents) * 100).toFixed(2) : 0;

    return {
      totalStudents,
      completed,
      pending,
      percentage: parseFloat(percentage)
    };
  }

  /**
   * Eliminar evaluación de estudiante (solo para testing/admin)
   * @param {number} id - ID de la evaluación
   * @returns {Object} Evaluación eliminada
   */
  static async delete(id) {
    return await prisma.studentEvaluation.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Obtener comentarios anónimos de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Array} Lista de comentarios (sin datos del estudiante)
   */
  static async getAnonymousComments(evaluationId) {
    const evaluations = await prisma.studentEvaluation.findMany({
      where: {
        evaluationId: parseInt(evaluationId),
        completada: true,
        comentario: { not: null }
      },
      select: {
        id: true,
        comentario: true,
        fechaCompleta: true,
        sentiment: true,
        sentimentScore: true,
        sentimentAnalyzedAt: true
      },
      orderBy: { fechaCompleta: 'desc' }
    });

    return evaluations;
  }

  // ==========================================
  // 🆕 MÉTODOS PARA ANÁLISIS DE SENTIMIENTO
  // ==========================================

  /**
   * Actualizar el sentimiento de un comentario
   * @param {number} id - ID de la evaluación del estudiante
   * @param {string} sentiment - Tipo de sentimiento
   * @param {number} score - Puntuación de confianza (0.0 - 1.0)
   * @returns {Object} Evaluación actualizada
   */
  static async updateSentiment(id, sentiment, score = null) {
    return await prisma.studentEvaluation.update({
      where: { id: parseInt(id) },
      data: {
        sentiment,
        sentimentScore: score,
        sentimentAnalyzedAt: new Date()
      },
      select: {
        id: true,
        comentario: true,
        sentiment: true,
        sentimentScore: true,
        sentimentAnalyzedAt: true
      }
    });
  }

  /**
   * Obtener evaluaciones con comentarios sin analizar
   * @param {number} evaluationId - ID de la evaluación (opcional)
   * @returns {Array} Lista de evaluaciones pendientes de análisis
   */
  static async findUnanalyzedComments(evaluationId = null) {
    const where = {
      completada: true,
      comentario: { not: null },
      sentiment: null
    };

    if (evaluationId) {
      where.evaluationId = parseInt(evaluationId);
    }

    return await prisma.studentEvaluation.findMany({
      where,
      select: {
        id: true,
        evaluationId: true,
        comentario: true,
        fechaCompleta: true,
        evaluation: {
          select: {
            id: true,
            subject: { select: { nombre: true, codigo: true } },
            teacher: { select: { nombreCompleto: true } }
          }
        }
      },
      orderBy: { fechaCompleta: 'desc' }
    });
  }

  /**
   * Obtener estadísticas de sentimientos de una evaluación
   * @param {number} evaluationId - ID de la evaluación
   * @returns {Object} Estadísticas de sentimientos
   */
  static async getSentimentStatistics(evaluationId) {
    const evaluations = await prisma.studentEvaluation.findMany({
      where: {
        evaluationId: parseInt(evaluationId),
        completada: true,
        comentario: { not: null }
      },
      select: {
        sentiment: true,
        sentimentScore: true
      }
    });

    const total = evaluations.length;
    const analyzed = evaluations.filter(e => e.sentiment !== null).length;
    const pending = total - analyzed;

    // Contar por tipo de sentimiento
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
      unanalyzed: pending
    };

    evaluations.forEach(e => {
      if (e.sentiment) {
        sentimentCounts[e.sentiment]++;
      }
    });

    // Calcular promedio de scores
    const scores = evaluations
      .filter(e => e.sentimentScore !== null)
      .map(e => e.sentimentScore);
    
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

    return {
      total,
      analyzed,
      pending,
      sentimentDistribution: sentimentCounts,
      averageConfidence: averageScore ? parseFloat(averageScore.toFixed(3)) : null,
      percentageAnalyzed: total > 0 ? parseFloat(((analyzed / total) * 100).toFixed(2)) : 0
    };
  }

  /**
   * Obtener comentarios filtrados por sentimiento
   * @param {number} evaluationId - ID de la evaluación
   * @param {string} sentimentType - Tipo de sentimiento a filtrar
   * @returns {Array} Lista de comentarios con ese sentimiento
   */
  static async findBySentiment(evaluationId, sentimentType) {
    return await prisma.studentEvaluation.findMany({
      where: {
        evaluationId: parseInt(evaluationId),
        completada: true,
        comentario: { not: null },
        sentiment: sentimentType
      },
      select: {
        id: true,
        comentario: true,
        sentiment: true,
        sentimentScore: true,
        sentimentAnalyzedAt: true,
        fechaCompleta: true
      },
      orderBy: [
        { sentimentScore: 'desc' },
        { fechaCompleta: 'desc' }
      ]
    });
  }
}

export default StudentEvaluationModel;
