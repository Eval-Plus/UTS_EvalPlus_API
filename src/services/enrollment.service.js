/**
 * Servicio de Inscripciones
 * Maneja toda la lógica de inscripción de estudiantes en carreras y materias
 */

import { CareerModel } from '../models/career.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { AUTO_ASSIGNMENT } from '../config/constants.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('EnrollmentService');

export class EnrollmentService {
  /**
   * Selecciona N carreras aleatorias
   * @param {number} count - Cantidad de carreras a seleccionar
   * @returns {Array<number>} IDs de carreras seleccionadas
   */
  static async getRandomCareers(count = AUTO_ASSIGNMENT.CAREERS_PER_STUDENT) {
    const allCareers = await CareerModel.findAll();

    if (allCareers.length === 0) {
      logger.warn('No hay carreras disponibles para asignar');
      return [];
    }

    if (allCareers.length <= count) {
      return allCareers.map(c => c.id);
    }

    // Algoritmo Fisher-Yates para mezcla aleatoria
    const shuffled = [...allCareers]
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(career => career.id);

    logger.debug(`Se seleccionaron ${shuffled.length} carreras aleatorias`, { careerIds: shuffled });
    
    return shuffled;
  }

  /**
   * Inscribe un usuario en múltiples carreras
   * @param {number} userId - ID del usuario
   * @param {Array<number>} careerIds - IDs de las carreras
   * @returns {Array} Inscripciones creadas
   */
  static async enrollUserInCareers(userId, careerIds) {
    const enrollments = [];

    for (const careerId of careerIds) {
      try {
        const enrollment = await CareerModel.enrollUser(userId, careerId);
        enrollments.push(enrollment);
        logger.success(`Usuario ${userId} inscrito en carrera ${careerId}`);
      } catch (error) {
        logger.warn(`No se pudo inscribir usuario ${userId} en carrera ${careerId}`, {
          error: error.message
        });
      }
    }

    return enrollments;
  }

  /**
   * Obtiene materias aleatorias de una carrera
   * @param {number} careerId - ID de la carrera
   * @param {number} count - Cantidad de materias
   * @returns {Array<number>} IDs de materias
   */
  static async getRandomSubjectsByCareer(
    careerId, 
    count = AUTO_ASSIGNMENT.SUBJECTS_PER_CAREER
  ) {
    return await SubjectModel.getRandomSubjectsByCareer(careerId, count);
  }

  /**
   * Inscribe un usuario en materias de sus carreras
   * @param {number} userId - ID del usuario
   * @param {Array<number>} careerIds - IDs de las carreras
   * @returns {number} Total de materias asignadas
   */
  static async enrollUserInCareerSubjects(userId, careerIds) {
    logger.info(`Asignando materias al usuario ${userId}...`);

    let totalAssigned = 0;

    for (const careerId of careerIds) {
      try {
        const subjectIds = await this.getRandomSubjectsByCareer(careerId);

        if (subjectIds.length > 0) {
          const enrollments = await SubjectModel.enrollUserInMultipleSubjects(
            userId,
            subjectIds
          );

          totalAssigned += enrollments.length;
          logger.success(
            `Usuario ${userId}: ${enrollments.length} materias asignadas de carrera ${careerId}`
          );
        } else {
          logger.warn(`No hay materias disponibles para carrera ${careerId}`);
        }
      } catch (error) {
        logger.error(`Error asignando materias de carrera ${careerId}`, error);
      }
    }

    logger.success(`Total de materias asignadas al usuario ${userId}: ${totalAssigned}`);
    return totalAssigned;
  }

  /**
   * Configuración completa de inscripción para estudiante
   * @param {number} userId - ID del usuario
   */
  static async setupStudentEnrollment(userId) {
    logger.student(`Configurando inscripción de estudiante ${userId}`);

    try {
      // 1. Asignar carreras aleatorias
      const careerIds = await this.getRandomCareers();

      if (careerIds.length === 0) {
        logger.warn('No se pueden asignar carreras: no hay carreras disponibles');
        return;
      }

      // 2. Inscribir en carreras
      await this.enrollUserInCareers(userId, careerIds);
      logger.success(`Estudiante ${userId} inscrito en ${careerIds.length} carreras`);

      // 3. Inscribir en materias de esas carreras
      const totalSubjects = await this.enrollUserInCareerSubjects(userId, careerIds);
      logger.success(
        `Inscripción completada para estudiante ${userId}: ${careerIds.length} carreras, ${totalSubjects} materias`
      );
    } catch (error) {
      logger.error(`Error en configuración de estudiante ${userId}`, error);
      throw error;
    }
  }

  /**
   * Busca materias sin profesor que tengan estudiantes inscritos
   * @returns {Array} Lista de materias disponibles
   */
  static async findSubjectsNeedingTeacher() {
    try {
      const subjects = await SubjectModel.findSubjectsWithoutTeacher();
      
      // Filtrar solo las que tienen estudiantes
      const subjectsWithStudents = [];
      
      for (const subject of subjects) {
        const studentCount = await SubjectModel.getStudentCount(subject.id);
        if (studentCount > 0) {
          subjectsWithStudents.push({ ...subject, studentCount });
        }
      }

      logger.info(
        `Materias sin profesor con estudiantes: ${subjectsWithStudents.length}`,
        { count: subjectsWithStudents.length }
      );
      
      return subjectsWithStudents;
    } catch (error) {
      logger.error('Error buscando materias sin profesor', error);
      return [];
    }
  }

  /**
   * Asigna profesor a múltiples materias
   * @param {number} teacherId - ID del profesor
   * @param {Array} subjects - Materias a asignar
   * @returns {number} Cantidad de materias asignadas
   */
  static async assignTeacherToSubjects(teacherId, subjects) {
    let assignedCount = 0;

    for (const subject of subjects) {
      try {
        logger.debug(`Asignando profesor ${teacherId} a materia ${subject.id}: ${subject.nombre}`);
        
        await SubjectModel.update(subject.id, { teacherId });
        
        assignedCount++;
        logger.success(
          `Profesor ${teacherId} asignado a: ${subject.nombre} (${subject.studentCount} estudiantes)`
        );
      } catch (error) {
        logger.error(
          `Error asignando profesor ${teacherId} a materia ${subject.id}`,
          error
        );
      }
    }

    return assignedCount;
  }

  /**
   * Configuración completa de asignación para profesor
   * @param {number} teacherId - ID del profesor
   */
  static async setupTeacherAssignment(teacherId) {
    logger.teacher(`Configurando asignación de profesor ${teacherId}`);

    try {
      // 1. Buscar materias disponibles
      const subjectsToAssign = await this.findSubjectsNeedingTeacher();

      if (subjectsToAssign.length === 0) {
        logger.warn('No hay materias disponibles para asignar al profesor');
        return 0;
      }

      // 2. Asignar profesor a las materias
      const assignedCount = await this.assignTeacherToSubjects(
        teacherId,
        subjectsToAssign
      );

      logger.success(
        `Asignación completada: Profesor ${teacherId} asignado a ${assignedCount} materias`
      );

      // 3. Verificación en BD
      const verifySubjects = await SubjectModel.findAll();
      const teacherSubjects = verifySubjects.filter(s => s.teacherId === teacherId);
      logger.debug(
        `Verificación BD: Profesor ${teacherId} tiene ${teacherSubjects.length} materias`,
        { subjectIds: teacherSubjects.map(s => s.id) }
      );

      return assignedCount;
    } catch (error) {
      logger.error(`Error en configuración de profesor ${teacherId}`, error);
      throw error;
    }
  }
}

export default EnrollmentService;
