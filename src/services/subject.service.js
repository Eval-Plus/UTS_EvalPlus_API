/**
 * Servicio de Materias
 * Maneja toda la lógica de negocio relacionada con materias
 */

import { SubjectModel } from '../models/subject.model.js';
import { CareerModel } from '../models/career.model.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SubjectService');

export class SubjectService {
  /**
   * Obtener todas las materias activas
   * @returns {Array} Lista de materias
   */
  static async getAllSubjects() {
    try {
      logger.info('Obteniendo todas las materias');
      const subjects = await SubjectModel.findAll();
      logger.success(`${subjects.length} materias obtenidas`);
      return subjects;
    } catch (error) {
      logger.error('Error obteniendo materias', error);
      throw error;
    }
  }

  /**
   * Obtener una materia por ID
   * @param {number} id - ID de la materia
   * @returns {Object} Materia encontrada
   */
  static async getSubjectById(id) {
    try {
      logger.debug(`Buscando materia con ID: ${id}`);
      const subject = await SubjectModel.findById(id);

      if (!subject) {
        logger.warn(`Materia ${id} no encontrada`);
        throw new Error('Materia no encontrada');
      }

      logger.success(`Materia encontrada: ${subject.nombre}`);
      return subject;
    } catch (error) {
      logger.error(`Error obteniendo materia ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtener una materia por código
   * @param {string} codigo - Código de la materia
   * @returns {Object|null} Materia encontrada o null
   */
  static async getSubjectByCode(codigo) {
    try {
      logger.debug(`Buscando materia con código: ${codigo}`);
      const subject = await SubjectModel.findByCode(codigo);
      
      if (subject) {
        logger.success(`Materia encontrada: ${subject.nombre}`);
      } else {
        logger.warn(`Materia con código ${codigo} no encontrada`);
      }
      
      return subject;
    } catch (error) {
      logger.error(`Error buscando materia por código ${codigo}`, error);
      throw error;
    }
  }

  /**
   * Obtener materias por carrera
   * @param {number} careerId - ID de la carrera
   * @returns {Array} Lista de materias
   */
  static async getSubjectsByCareer(careerId) {
    try {
      logger.debug(`Obteniendo materias de carrera ${careerId}`);
      const subjects = await SubjectModel.findByCareer(careerId);
      logger.success(`${subjects.length} materias encontradas para carrera ${careerId}`);
      return subjects;
    } catch (error) {
      logger.error(`Error obteniendo materias de carrera ${careerId}`, error);
      throw error;
    }
  }

  /**
   * Obtener materias por código de carrera
   * @param {string} careerCode - Código de la carrera
   * @returns {Array} Lista de materias
   */
  static async getSubjectsByCareerCode(careerCode) {
    try {
      logger.debug(`Obteniendo materias para carrera con código: ${careerCode}`);
      
      // Verificar que la carrera existe
      const career = await CareerModel.findByCode(careerCode);
      if (!career) {
        logger.warn(`Carrera con código ${careerCode} no encontrada`);
        throw new Error('Carrera no encontrada');
      }

      const subjects = await SubjectModel.findByCareerCode(careerCode);
      logger.success(`${subjects.length} materias encontradas para ${careerCode}`);
      return subjects;
    } catch (error) {
      logger.error(`Error obteniendo materias por código de carrera ${careerCode}`, error);
      throw error;
    }
  }

  /**
   * Obtener materias por semestre
   * @param {number} semestre - Número del semestre
   * @param {number|null} careerId - ID de la carrera (opcional)
   * @returns {Array} Lista de materias
   */
  static async getSubjectsBySemester(semestre, careerId = null) {
    try {
      logger.debug(`Obteniendo materias del semestre ${semestre}`, { careerId });
      const subjects = await SubjectModel.findBySemester(semestre, careerId);
      logger.success(`${subjects.length} materias encontradas para semestre ${semestre}`);
      return subjects;
    } catch (error) {
      logger.error(`Error obteniendo materias del semestre ${semestre}`, error);
      throw error;
    }
  }

  /**
   * Crear una nueva materia
   * @param {Object} data - Datos de la materia
   * @returns {Object} Materia creada
   */
  static async createSubject(data) {
    try {
      logger.info(`Creando materia: ${data.nombre}`);

      // Validar datos obligatorios
      if (!data.nombre || !data.codigo || !data.careerId || !data.professorName) {
        throw new Error('Faltan campos obligatorios: nombre, codigo, careerId, professorName');
      }

      // Verificar que la carrera existe
      const career = await CareerModel.findById(data.careerId);
      if (!career) {
        throw new Error('La carrera especificada no existe');
      }

      // Verificar si ya existe una materia con ese código
      const existingSubject = await this.getSubjectByCode(data.codigo);
      if (existingSubject) {
        logger.warn(`Ya existe una materia con código: ${data.codigo}`);
        throw new Error('Ya existe una materia con ese código');
      }

      const newSubject = await SubjectModel.create(data);
      logger.success(`Materia creada: ${newSubject.nombre} (ID: ${newSubject.id})`);

      return newSubject;
    } catch (error) {
      logger.error('Error creando materia', error);
      throw error;
    }
  }

  /**
   * Actualizar una materia existente
   * @param {number} id - ID de la materia
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Materia actualizada
   */
  static async updateSubject(id, data) {
    try {
      logger.info(`Actualizando materia ${id}`);

      // Verificar que la materia existe
      const existingSubject = await this.getSubjectById(id);

      // Si se está cambiando la carrera, verificar que existe
      if (data.careerId) {
        const career = await CareerModel.findById(data.careerId);
        if (!career) {
          throw new Error('La carrera especificada no existe');
        }
      }

      // Si se está cambiando el código, verificar que no exista otro con ese código
      if (data.codigo && data.codigo !== existingSubject.codigo) {
        const subjectWithCode = await this.getSubjectByCode(data.codigo);
        if (subjectWithCode) {
          logger.warn(`Ya existe otra materia con código: ${data.codigo}`);
          throw new Error('Ya existe una materia con ese código');
        }
      }

      const updatedSubject = await SubjectModel.update(id, data);
      logger.success(`Materia ${id} actualizada: ${updatedSubject.nombre}`);

      return updatedSubject;
    } catch (error) {
      logger.error(`Error actualizando materia ${id}`, error);
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) una materia
   * @param {number} id - ID de la materia
   * @returns {Object} Materia desactivada
   */
  static async deleteSubject(id) {
    try {
      logger.info(`Desactivando materia ${id}`);

      // Verificar que la materia existe
      await this.getSubjectById(id);

      const deletedSubject = await SubjectModel.delete(id);
      logger.success(`Materia ${id} desactivada`);

      return deletedSubject;
    } catch (error) {
      logger.error(`Error desactivando materia ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtener usuarios inscritos en una materia
   * @param {number} subjectId - ID de la materia
   * @returns {Array} Lista de usuarios
   */
  static async getSubjectUsers(subjectId) {
    try {
      logger.debug(`Obteniendo usuarios de materia ${subjectId}`);

      // Verificar que la materia existe
      await this.getSubjectById(subjectId);

      const users = await SubjectModel.getUsers(subjectId);
      logger.success(`${users.length} usuarios encontrados en materia ${subjectId}`);

      return users;
    } catch (error) {
      logger.error(`Error obteniendo usuarios de materia ${subjectId}`, error);
      throw error;
    }
  }

  /**
   * Inscribir un usuario en una materia
   * @param {number} userId - ID del usuario
   * @param {number} subjectId - ID de la materia
   * @returns {Object} Inscripción creada
   */
  static async enrollUser(userId, subjectId) {
    try {
      logger.info(`Inscribiendo usuario ${userId} en materia ${subjectId}`);

      // Verificar que la materia existe
      await this.getSubjectById(subjectId);

      // Verificar si ya está inscrito
      const isEnrolled = await SubjectModel.isUserEnrolled(userId, subjectId);
      if (isEnrolled) {
        logger.warn(`Usuario ${userId} ya está inscrito en materia ${subjectId}`);
        throw new Error('El usuario ya está inscrito en esta materia');
      }

      const enrollment = await SubjectModel.enrollUser(userId, subjectId);
      logger.success(`Usuario ${userId} inscrito en materia ${subjectId}`);

      return enrollment;
    } catch (error) {
      logger.error(`Error inscribiendo usuario ${userId} en materia ${subjectId}`, error);
      throw error;
    }
  }

  /**
   * Desinscribir un usuario de una materia
   * @param {number} userId - ID del usuario
   * @param {number} subjectId - ID de la materia
   */
  static async unenrollUser(userId, subjectId) {
    try {
      logger.info(`Desinscribiendo usuario ${userId} de materia ${subjectId}`);

      // Verificar que la materia existe
      await this.getSubjectById(subjectId);

      // Verificar si está inscrito
      const isEnrolled = await SubjectModel.isUserEnrolled(userId, subjectId);
      if (!isEnrolled) {
        logger.warn(`Usuario ${userId} no está inscrito en materia ${subjectId}`);
        throw new Error('El usuario no está inscrito en esta materia');
      }

      await SubjectModel.unenrollUser(userId, subjectId);
      logger.success(`Usuario ${userId} desinscrito de materia ${subjectId}`);
    } catch (error) {
      logger.error(`Error desinscribiendo usuario ${userId} de materia ${subjectId}`, error);
      throw error;
    }
  }

  /**
   * Obtener materias sin profesor asignado
   * @returns {Array} Lista de materias
   */
  static async getSubjectsWithoutTeacher() {
    try {
      logger.debug('Buscando materias sin profesor');
      const subjects = await SubjectModel.findSubjectsWithoutTeacher();
      logger.success(`${subjects.length} materias sin profesor encontradas`);
      return subjects;
    } catch (error) {
      logger.error('Error buscando materias sin profesor', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de estudiantes en una materia
   * @param {number} subjectId - ID de la materia
   * @returns {number} Cantidad de estudiantes
   */
  static async getStudentCount(subjectId) {
    try {
      logger.debug(`Obteniendo conteo de estudiantes en materia ${subjectId}`);
      const count = await SubjectModel.getStudentCount(subjectId);
      logger.debug(`Materia ${subjectId} tiene ${count} estudiantes`);
      return count;
    } catch (error) {
      logger.error(`Error obteniendo conteo de estudiantes en materia ${subjectId}`, error);
      throw error;
    }
  }
}

export default SubjectService;
