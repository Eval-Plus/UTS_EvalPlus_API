import prisma from '../config/prisma.js';

export class EvaluationTemplateModel {
  /**
   * Obtener todas las plantillas activas
   */
  static async findAll() {
    return await prisma.evaluationTemplate.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
  }

  /**
   * Obtener plantilla por ID
   */
  static async findById(id) {
    return await prisma.evaluationTemplate.findUnique({
      where: { id: parseInt(id) },
      include: {
        questions: {
          where: { activo: true },
          orderBy: { orden: 'asc' }
        }
      }
    });
  }

  /**
   * Obtener la plantilla por defecto (estándar)
   */
  static async findDefault() {
    return await prisma.evaluationTemplate.findFirst({
      where: {
        nombre: 'Evaluación Docente Estándar',
        activo: true
      },
      include: {
        questions: {
          where: { activo: true },
          orderBy: { orden: 'asc' }
        }
      }
    });
  }

  /**
   * Crear nueva plantilla
   */
  static async create(data) {
    return await prisma.evaluationTemplate.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo ?? true
      }
    });
  }

  /**
   * Actualizar plantilla
   */
  static async update(id, data) {
    const updateData = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.activo !== undefined) updateData.activo = data.activo;

    return await prisma.evaluationTemplate.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  }

  /**
   * Desactivar plantilla
   */
  static async delete(id) {
    return await prisma.evaluationTemplate.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
  }

  /**
   * Contar preguntas de una plantilla
   */
  static async countQuestions(id) {
    return await prisma.question.count({
      where: {
        templateId: parseInt(id),
        activo: true
      }
    });
  }
}

export default EvaluationTemplateModel;
