/**
 * Servicio de Inscripciones - REFACTORIZADO
 * Maneja inscripción de estudiantes y profesores con nuevos límites
 */

import { CareerModel } from '../models/career.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { createLogger } from '../utils/logger.js';
import prisma from '../config/prisma.js';

const logger = createLogger('EnrollmentService');

// Constante de periodo academico actual
const CURRENT_PERIOD = '2025-1';

// 🆕 Límites de inscripción
const ENROLLMENT_LIMITS = {
  MAX_SUBJECTS_STUDENT: 7,  // 7 materias (1 por cada una de las 7 carreras)
  MAX_SUBJECTS_TEACHER: 7   // 7 materias por docente
};

export class EnrollmentService {
  // ==========================================
  // MÉTODOS PARA ESTUDIANTES
  // ==========================================

  /**
   * 🆕 Obtiene TODAS las carreras activas de la BD
   * @returns {Array<number>} IDs de todas las carreras
   */
  static async getAllActiveCareerIds() {
    try {
      const careers = await CareerModel.findAll();
      const careerIds = careers.map(c => c.id);

      logger.info(`Total de carreras activas: ${careerIds.length}`);
      
      return careerIds;
    } catch (error) {
      logger.error('Error obteniendo todas las carreras', error);
      return [];
    }
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
        // Crear insccripción con periodo
        const enrollment = await prisma.userCareer.create({
          data: {
            userId: parseInt(userId),
            careerId: parseInt(careerId),
            periodo: CURRENT_PERIOD
          }
        });

        enrollments.push(enrollment);
        logger.success(`Usuario ${userId} inscrito en carrera ${careerId} - Período: ${CURRENT_PERIOD}`);
      } catch (error) {
        if (error.code === 'P2002') {
          logger.debug(`Usuario ${userId} ya inscrito en carrera ${careerId}`);
        } else {
          logger.warn(`Error inscribiendo usuario ${userId} en carrera ${careerId}`, {
            error: error.message
          });
        }
      }
    }

    return enrollments;
  }

  /**
   * 🆕 Obtiene UNA materia aleatoria de un semestre aleatorio por carrera
   * @param {number} careerId - ID de la carrera
   * @returns {number|null} ID de materia seleccionada
   */
  static async getOneRandomSubjectFromCareer(careerId) {
    try {
      // 1. Obtener todas las materias agrupadas por semestre
      const subjectsBySemester = await SubjectModel.getSubjectsGroupedBySemester(careerId);
      
      // 2. Verificar que haya materias disponibles
      const availableSemesters = Object.keys(subjectsBySemester);
      if (availableSemesters.length === 0) {
        logger.warn(`No hay materias disponibles en carrera ${careerId}`);
        return null;
      }

      // 3. Seleccionar un semestre aleatorio
      const randomSemester = availableSemesters[
        Math.floor(Math.random() * availableSemesters.length)
      ];
      
      const semesterSubjects = subjectsBySemester[randomSemester];
      
      logger.debug(`Carrera ${careerId}: Semestre ${randomSemester} seleccionado con ${semesterSubjects.length} materias`);

      // 4. Seleccionar una materia aleatoria del semestre
      const randomSubject = semesterSubjects[
        Math.floor(Math.random() * semesterSubjects.length)
      ];

      logger.success(
        `Carrera ${careerId}: Materia ${randomSubject.nombre} seleccionada del semestre ${randomSemester}`
      );
      
      return randomSubject.id;
    } catch (error) {
      logger.error(`Error obteniendo materia de carrera ${careerId}`, error);
      return null;
    }
  }

  /**
   * 🆕 Inscribe un usuario en UNA materia por cada carrera (total 7 materias)
   * @param {number} userId - ID del usuario
   * @param {Array<number>} careerIds - IDs de las carreras (debe ser 7)
   * @returns {Object} Resumen de inscripciones
   */
  static async enrollUserInCareerSubjects(userId, careerIds) {
    logger.info(`Asignando materias al estudiante ${userId} en ${careerIds.length} carreras...`);

    const enrollmentSummary = {
      totalCareers: careerIds.length,
      totalSubjectsAssigned: 0,
      careerDetails: []
    };

    for (const careerId of careerIds) {
      try {
        // Obtener UNA materia aleatoria de esta carrera
        const subjectId = await this.getOneRandomSubjectFromCareer(careerId);

        if (!subjectId) {
          logger.warn(`No hay materias disponibles para carrera ${careerId}`);
          enrollmentSummary.careerDetails.push({
            careerId,
            subjectsAssigned: 0,
            success: false,
            reason: 'Sin materias disponibles'
          });
          continue;
        }

        // Inscribir en la materia seleccionada
        const enrollment = await SubjectModel.enrollUser(
          userId,
          subjectId,
          CURRENT_PERIOD
        );

        enrollmentSummary.totalSubjectsAssigned += 1;
        enrollmentSummary.careerDetails.push({
          careerId,
          subjectId,
          subjectsAssigned: 1,
          success: true
        });

        logger.success(
          `Usuario ${userId}: 1 materia asignada en carrera ${careerId}`
        );
      } catch (error) {
        logger.error(`Error asignando materia de carrera ${careerId}`, error);
        enrollmentSummary.careerDetails.push({
          careerId,
          subjectsAssigned: 0,
          success: false,
          reason: error.message
        });
      }
    }

    logger.success(
      `📊 Resumen estudiante ${userId}:\n` +
      `   - Carreras procesadas: ${enrollmentSummary.totalCareers}\n` +
      `   - Total materias asignadas: ${enrollmentSummary.totalSubjectsAssigned}`
    );
    
    return enrollmentSummary;
  }

  /**
   * 🆕 Configuración completa de inscripción para estudiante
   * Inscribe en TODAS las carreras con 1 materia por carrera (total 7 materias)
   * @param {number} userId - ID del usuario
   * @returns {Object} Resumen de la configuración
   */
  static async setupStudentEnrollment(userId) {
    logger.student(`🎓 Configurando inscripción de estudiante ${userId}`);

    try {
      // 1. Obtener TODAS las carreras activas
      const careerIds = await this.getAllActiveCareerIds();

      if (careerIds.length === 0) {
        logger.warn('⚠️ No hay carreras disponibles en el sistema');
        return {
          success: false,
          message: 'No hay carreras disponibles',
          careers: 0,
          subjects: 0
        };
      }

      // 2. Verificar que haya exactamente 7 carreras
      if (careerIds.length !== 7) {
        logger.warn(`⚠️ Se esperaban 7 carreras pero se encontraron ${careerIds.length}`);
      }

      // 3. Inscribir en todas las carreras
      const careerEnrollments = await this.enrollUserInCareers(userId, careerIds);
      logger.success(`✅ Estudiante ${userId} inscrito en ${careerEnrollments.length} carreras`);

      // 4. Inscribir en materias (1 por carrera = total 7 materias)
      const subjectSummary = await this.enrollUserInCareerSubjects(userId, careerIds);

      // 5. Resumen final
      const result = {
        success: true,
        message: 'Inscripción completada exitosamente',
        careers: careerEnrollments.length,
        subjects: subjectSummary.totalSubjectsAssigned,
        details: subjectSummary.careerDetails
      };

      logger.success(
        `✅ ¡Configuración completada para estudiante ${userId}!\n` +
        `   📚 ${result.careers} carreras\n` +
        `   📖 ${result.subjects} materias (1 por carrera)`
      );

      return result;
    } catch (error) {
      logger.error(`Error en configuración de estudiante ${userId}`, error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PARA PROFESORES
  // ==========================================

  /**
   * Busca materias sin profesor que tengan estudiantes inscritos
   * @returns {Array} Lista de materias disponibles con conteo de estudiantes
   */
  static async findSubjectsNeedingTeacher() {
    try {
      const subjects = await SubjectModel.findSubjectsWithoutTeacher();
      
      const subjectsWithStudents = [];
      
      for (const subject of subjects) {
        const studentCount = await SubjectModel.getStudentCount(subject.id);
        if (studentCount > 0) {
          subjectsWithStudents.push({ ...subject, studentCount });
        }
      }

      logger.info(
        `Materias sin profesor con estudiantes: ${subjectsWithStudents.length}`
      );
      
      return subjectsWithStudents;
    } catch (error) {
      logger.error('Error buscando materias sin profesor', error);
      return [];
    }
  }

  /**
   * 🆕 Asigna profesor a materias (máximo 7)
   * @param {number} teacherId - ID del profesor
   * @param {Array} subjects - Materias a asignar
   * @returns {Object} Resultado con materias asignadas
   */
  static async assignTeacherToSubjects(teacherId, subjects) {
    let assignedCount = 0;
    const assignedSubjects = [];

    // Limitar a máximo 7 materias
    const subjectsToAssign = subjects.slice(0, ENROLLMENT_LIMITS.MAX_SUBJECTS_TEACHER);

    logger.info(
      `Asignando profesor ${teacherId} a ${subjectsToAssign.length} materias ` +
      `(límite: ${ENROLLMENT_LIMITS.MAX_SUBJECTS_TEACHER})`
    );

    for (const subject of subjectsToAssign) {
      try {
        logger.debug(`Asignando profesor ${teacherId} a materia ${subject.id}: ${subject.nombre}`);
        
        await SubjectModel.update(subject.id, { teacherId });
        
        assignedCount++;
        assignedSubjects.push(subject);
        
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

    return { assignedCount, assignedSubjects };
  }

  /**
   * 🆕 Configuración completa de asignación para profesor (SIN crear evaluaciones)
   * @param {number} teacherId - ID del profesor
   * @returns {Object} Resultado de la configuración
   */
  static async setupTeacherAssignment(teacherId) {
    logger.teacher(`🧑‍🏫 Configurando asignación de profesor ${teacherId}`);

    try {
      // 1. Buscar materias disponibles
      const subjectsToAssign = await this.findSubjectsNeedingTeacher();

      if (subjectsToAssign.length === 0) {
        logger.warn('No hay materias disponibles para asignar al profesor');
        return {
          success: false,
          message: 'No hay materias disponibles sin profesor asignado',
          assignedSubjects: 0,
          subjects: []
        };
      }

      // 2. Asignar profesor a las materias (máximo 7)
      const { assignedCount, assignedSubjects } = await this.assignTeacherToSubjects(
        teacherId,
        subjectsToAssign
      );

      if (assignedCount === 0) {
        return {
          success: false,
          message: 'No se pudieron asignar materias al profesor',
          assignedSubjects: 0,
          subjects: []
        };
      }

      logger.success(
        `Profesor ${teacherId} asignado a ${assignedCount} materias`
      );

      // 3. Resumen final (SIN evaluaciones)
      const result = {
        success: true,
        message: 'Asignación completada exitosamente',
        assignedSubjects: assignedCount,
        subjects: assignedSubjects.map(s => ({
          id: s.id,
          nombre: s.nombre,
          codigo: s.codigo,
          semestre: s.semestre,
          studentCount: s.studentCount
        }))
      };

      logger.success(
        `✅ Configuración completa para profesor ${teacherId}:\n` +
        `   - ${result.assignedSubjects} materias asignadas (máx: ${ENROLLMENT_LIMITS.MAX_SUBJECTS_TEACHER})`
      );

      return result;
    } catch (error) {
      logger.error(`Error en configuración de profesor ${teacherId}`, error);
      throw error;
    }
  }
}

export default EnrollmentService;
