import prisma from '../config/prisma.js';

export class QuestionModel {
  /**
   * Obtener todas las preguntas de una plantilla
   * @param {number} templateId - ID de la plantilla
   * @returns {Array} Lista de preguntas
   */
  static async findByTemplate(templateId) {
    return await prisma.question.findMany({
      where: {
        templateId: parseInt(templateId),
        activo: true
      },
      orderBy: {
        orden: 'asc'
      }
    });
  }

  /**
   * Obtener todas las preguntas de la plantilla por defecto
   * @returns {Array} Lista de preguntas
   */
  static async findDefaultQuestions() {
    // Buscar la plantilla estándar
    const template = await prisma.evaluationTemplate.findFirst({
      where: {
        nombre: 'Evaluación Docente Estándar',
        activo: true
      }
    });

    if (!template) {
      return [];
    }

    return await this.findByTemplate(template.id);
  }

  /**
   * Obtener una pregunta por ID
   * @param {number} id - ID de la pregunta
   * @returns {Object|null} Pregunta encontrada
   */
  static async findById(id) {
    return await prisma.question.findUnique({
      where: { id: parseInt(id) },
      include: {
        template: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      }
    });
  }

  /**
   * Obtener pregunta por número dentro de una plantilla
   * @param {number} templateId - ID de la plantilla
   * @param {number} nroPregunta - Número de pregunta
   * @returns {Object|null} Pregunta encontrada
   */
  static async findByNumber(templateId, nroPregunta) {
    return await prisma.question.findUnique({
      where: {
        templateId_nroPregunta: {
          templateId: parseInt(templateId),
          nroPregunta: parseInt(nroPregunta)
        }
      }
    });
  }

  /**
   * Crear una nueva pregunta
   * @param {Object} data - Datos de la pregunta
   * @returns {Object} Pregunta creada
   */
  static async create(data) {
    return await prisma.question.create({
      data: {
        templateId: parseInt(data.templateId),
        categoria: data.categoria,
        aspecto: data.aspecto,
        nroPregunta: parseInt(data.nroPregunta),
        enunciado: data.enunciado,
        tipoRespuesta: data.tipoRespuesta || 'escala',
        valorMinimo: data.valorMinimo ? parseInt(data.valorMinimo) : 1,
        valorMaximo: data.valorMaximo ? parseInt(data.valorMaximo) : 5,
        esObligatoria: data.esObligatoria ?? true,
        orden: data.orden ? parseInt(data.orden) : data.nroPregunta,
        activo: data.activo ?? true
      },
      include: {
        template: true
      }
    });
  }

  /**
   * Actualizar una pregunta
   * @param {number} id - ID de la pregunta
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Pregunta actualizada
   */
  static async update(id, data) {
    const updateData = {};

    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.aspecto !== undefined) updateData.aspecto = data.aspecto;
    if (data.nroPregunta !== undefined) updateData.nroPregunta = parseInt(data.nroPregunta);
    if (data.enunciado !== undefined) updateData.enunciado = data.enunciado;
    if (data.tipoRespuesta !== undefined) updateData.tipoRespuesta = data.tipoRespuesta;
    if (data.valorMinimo !== undefined) updateData.valorMinimo = parseInt(data.valorMinimo);
    if (data.valorMaximo !== undefined) updateData.valorMaximo = parseInt(data.valorMaximo);
    if (data.esObligatoria !== undefined) updateData.esObligatoria = data.esObligatoria;
    if (data.orden !== undefined) updateData.orden = parseInt(data.orden);
    if (data.activo !== undefined) updateData.activo = data.activo;

    return await prisma.question.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        template: true
      }
    });
  }

  /**
   * Eliminar (desactivar) una pregunta
   * @param {number} id - ID de la pregunta
   * @returns {Object} Pregunta desactivada
   */
  static async delete(id) {
    return await prisma.question.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
  }

  /**
   * Obtener preguntas agrupadas por categoría
   * @param {number} templateId - ID de la plantilla
   * @returns {Object} Preguntas agrupadas
   */
  static async findGroupedByCategory(templateId) {
    const questions = await this.findByTemplate(templateId);

    // Agrupar por categoría
    const grouped = questions.reduce((acc, question) => {
      const category = question.categoria;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(question);
      return acc;
    }, {});

    return grouped;
  }

  /**
   * Obtener preguntas agrupadas por aspecto
   * @param {number} templateId - ID de la plantilla
   * @returns {Object} Preguntas agrupadas
   */
  static async findGroupedByAspect(templateId) {
    const questions = await this.findByTemplate(templateId);

    // Agrupar por aspecto
    const grouped = questions.reduce((acc, question) => {
      const aspect = question.aspecto;
      if (!acc[aspect]) {
        acc[aspect] = [];
      }
      acc[aspect].push(question);
      return acc;
    }, {});

    return grouped;
  }

  /**
   * Contar preguntas de una plantilla
   * @param {number} templateId - ID de la plantilla
   * @returns {number} Cantidad de preguntas
   */
  static async countByTemplate(templateId) {
    return await prisma.question.count({
      where: {
        templateId: parseInt(templateId),
        activo: true
      }
    });
  }

  /**
   * Verificar si una pregunta existe
   * @param {number} templateId - ID de la plantilla
   * @param {number} nroPregunta - Número de pregunta
   * @returns {boolean} True si existe
   */
  static async exists(templateId, nroPregunta) {
    const question = await this.findByNumber(templateId, nroPregunta);
    return !!question;
  }
}

export default QuestionModel;
