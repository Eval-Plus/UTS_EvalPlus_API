/**
 * Servicio de Carreras
 * Maneja toda la lógica de negocio relacionada con carreras
 */

import { CareerModel } from '../models/career.model.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('CareerService');

export class CareerService {
  /**
   * Obtener todas las carreras activas
   * @returns {Array} Lista de carreras
   */
  static async getAllCareers() {
    try {
      logger.info('Obteniendo todas las carreras');
      const careers = await CareerModel.findAll();
      logger.success(`${careers.length} carreras obtenidas`);
      return careers;
    } catch (error) {
      logger.error('Error obteniendo carreras', error);
      throw error;
    }
  }

  /**
   * Obtener una carrera por ID
   * @param {number} id - ID de la carrera
   * @returns {Object} Carrera encontrada
   */
  static async getCareerById(id) {
    try {
      logger.debug(`Buscando carrera con ID: ${id}`);
      const career = await CareerModel.findById(id);

      if (!career) {
        logger.warn(`Carrera ${id} no encontrada`);
        throw new Error('Carrera no encontrada');
      }

      logger.success(`Carrera encontrada: ${career.nombre}`);
      return career;
    } catch (error) {
      logger.error(`Error obteniendo carrera ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtener una carrera por código
   * @param {string} codigo - Código de la carrera
   * @returns {Object|null} Carrera encontrada o null
   */
  static async getCareerByCode(codigo) {
    try {
      logger.debug(`Buscando carrera con código: ${codigo}`);
      const career = await CareerModel.findByCode(codigo);
      
      if (career) {
        logger.success(`Carrera encontrada: ${career.nombre}`);
      } else {
        logger.warn(`Carrera con código ${codigo} no encontrada`);
      }
      
      return career;
    } catch (error) {
      logger.error(`Error buscando carrera por código ${codigo}`, error);
      throw error;
    }
  }

  /**
   * Crear una nueva carrera
   * @param {Object} data - Datos de la carrera
   * @returns {Object} Carrera creada
   */
  static async createCareer(data) {
    try {
      logger.info(`Creando carrera: ${data.nombre}`);

      // Validar datos obligatorios
      if (!data.nombre || !data.codigo) {
        throw new Error('Nombre y código son requeridos');
      }

      // Verificar si ya existe una carrera con ese código
      const existingCareer = await this.getCareerByCode(data.codigo);
      if (existingCareer) {
        logger.warn(`Ya existe una carrera con código: ${data.codigo}`);
        throw new Error('Ya existe una carrera con ese código');
      }

      const newCareer = await CareerModel.create(data);
      logger.success(`Carrera creada: ${newCareer.nombre} (ID: ${newCareer.id})`);

      return newCareer;
    } catch (error) {
      logger.error('Error creando carrera', error);
      throw error;
    }
  }

  /**
   * Actualizar una carrera existente
   * @param {number} id - ID de la carrera
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Carrera actualizada
   */
  static async updateCareer(id, data) {
    try {
      logger.info(`Actualizando carrera ${id}`);

      // Verificar que la carrera existe
      const existingCareer = await this.getCareerById(id);

      // Si se está cambiando el código, verificar que no exista otro con ese código
      if (data.codigo && data.codigo !== existingCareer.codigo) {
        const careerWithCode = await this.getCareerByCode(data.codigo);
        if (careerWithCode) {
          logger.warn(`Ya existe otra carrera con código: ${data.codigo}`);
          throw new Error('Ya existe una carrera con ese código');
        }
      }

      const updatedCareer = await CareerModel.update(id, data);
      logger.success(`Carrera ${id} actualizada: ${updatedCareer.nombre}`);

      return updatedCareer;
    } catch (error) {
      logger.error(`Error actualizando carrera ${id}`, error);
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) una carrera
   * @param {number} id - ID de la carrera
   * @returns {Object} Carrera desactivada
   */
  static async deleteCareer(id) {
    try {
      logger.info(`Desactivando carrera ${id}`);

      // Verificar que la carrera existe
      await this.getCareerById(id);

      const deletedCareer = await CareerModel.delete(id);
      logger.success(`Carrera ${id} desactivada`);

      return deletedCareer;
    } catch (error) {
      logger.error(`Error desactivando carrera ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtener usuarios de una carrera
   * @param {number} careerId - ID de la carrera
   * @returns {Object} Carrera con sus usuarios
   */
  static async getCareerUsers(careerId) {
    try {
      logger.debug(`Obteniendo usuarios de carrera ${careerId}`);

      // Verificar que la carrera existe
      const career = await this.getCareerById(careerId);

      const users = await CareerModel.getUsers(careerId);
      logger.success(`${users.length} usuarios encontrados en carrera ${careerId}`);

      return {
        career: {
          id: career.id,
          nombre: career.nombre,
          codigo: career.codigo
        },
        users
      };
    } catch (error) {
      logger.error(`Error obteniendo usuarios de carrera ${careerId}`, error);
      throw error;
    }
  }

  /**
   * Inscribir un usuario en una carrera
   * @param {number} userId - ID del usuario
   * @param {number} careerId - ID de la carrera
   * @returns {Object} Inscripción creada
   */
  static async enrollUser(userId, careerId) {
    try {
      logger.info(`Inscribiendo usuario ${userId} en carrera ${careerId}`);

      // Verificar que la carrera existe
      await this.getCareerById(careerId);

      const enrollment = await CareerModel.enrollUser(userId, careerId);
      logger.success(`Usuario ${userId} inscrito en carrera ${careerId}`);

      return enrollment;
    } catch (error) {
      if (error.code === 'P2002') {
        logger.warn(`Usuario ${userId} ya está inscrito en carrera ${careerId}`);
        throw new Error('El usuario ya está inscrito en esta carrera');
      }
      logger.error(`Error inscribiendo usuario ${userId} en carrera ${careerId}`, error);
      throw error;
    }
  }

  /**
   * Desinscribir un usuario de una carrera
   * @param {number} userId - ID del usuario
   * @param {number} careerId - ID de la carrera
   */
  static async unenrollUser(userId, careerId) {
    try {
      logger.info(`Desinscribiendo usuario ${userId} de carrera ${careerId}`);

      // Verificar que la carrera existe
      await this.getCareerById(careerId);

      await CareerModel.unenrollUser(userId, careerId);
      logger.success(`Usuario ${userId} desinscrito de carrera ${careerId}`);
    } catch (error) {
      logger.error(`Error desinscribiendo usuario ${userId} de carrera ${careerId}`, error);
      throw error;
    }
  }

  /**
   * Seed de carreras (solo para desarrollo)
   * @returns {Array} Carreras creadas
   */
  static async seedCareers() {
    try {
      logger.info('Iniciando seed de carreras');

      // Verificar si ya existen carreras
      const existingCareers = await this.getAllCareers();

      if (existingCareers.length >= 5) {
        logger.warn('Ya existen carreras, no se crearán duplicados');
        throw new Error('Las carreras ya fueron generadas previamente. No se pueden duplicar.');
      }

      // Datos de las carreras de ejemplo
      const careersData = [
        {
          nombre: 'Ingeniería de Sistemas',
          codigo: 'ING-SIS',
          icon: 'computer',
          color: '0xFF2196F3',
          descripcion: 'Carrera enfocada en el desarrollo de software y sistemas computacionales'
        },
        {
          nombre: 'Administración de Empresas',
          codigo: 'ADM-EMP',
          icon: 'business',
          color: '0xFF4CAF50',
          descripcion: 'Formación en gestión empresarial y liderazgo organizacional'
        },
        {
          nombre: 'Contaduría Pública',
          codigo: 'CON-PUB',
          icon: 'account_balance',
          color: '0xFFF44336',
          descripcion: 'Especialización en contabilidad, finanzas y auditoría'
        },
        {
          nombre: 'Derecho',
          codigo: 'DER',
          icon: 'gavel',
          color: '0xFF9C27B0',
          descripcion: 'Estudio de las ciencias jurídicas y el sistema legal'
        },
        {
          nombre: 'Medicina',
          codigo: 'MED',
          icon: 'local_hospital',
          color: '0xFFE91E63',
          descripcion: 'Formación médica y ciencias de la salud'
        }
      ];

      const createdCareers = [];

      for (const careerData of careersData) {
        try {
          const career = await this.createCareer(careerData);
          createdCareers.push(career);
        } catch (error) {
          logger.warn(`No se pudo crear carrera ${careerData.nombre}`, { error: error.message });
        }
      }

      logger.success(`Seed completado: ${createdCareers.length} carreras creadas`);
      return createdCareers;
    } catch (error) {
      logger.error('Error en seed de carreras', error);
      throw error;
    }
  }
}

export default CareerService;
