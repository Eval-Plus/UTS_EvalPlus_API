/**
 * Servicio de Inscripciones - ACTUALIZADO
 * Maneja inscripción de estudiantes (mismo semestre) y profesores (con evaluaciones)
 */

import { CareerModel } from '../models/career.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { EvaluationModel } from '../models/evaluation.model.js';
import { EvaluationTemplateModel } from '../models/evaluation-template.model.js';
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
   * 🆕 Obtener materias del mismo semestre de una carrera
   * @param {number} careerId - ID de la carrera
   * @param {number} count - Cantidad de materias
   * @returns {Array<number>} IDs de materias del mismo semestre
   */
  static async getSubjectsFromSameSemester(careerId, count = AUTO_ASSIGNMENT.SUBJECTS_PER_CAREER) {
    try {
      // 1. Obtener una materia aleatoria para determinar el semestre
      const randomSubject = await SubjectModel.getRandomSubjectByCareer(careerId);

      if (!randomSubject) {
        logger.warn(`No hay materias disponibles en carrera ${careerId}`);
        return [];
      }

      logger.debug(`Materia seleccionada: ${randomSubject.nombre} (Semestre ${randomSubject.semestre})`);

      // 2. Obtener materias del mismo semestre (incluyendo la primera)
      const semesterSubjects = await SubjectModel.getRandomSubjectsBySemester(
        careerId,
        randomSubject.semestre,
        count
      );

      logger.success(`${semesterSubjects.length} materias del semestre ${randomSubject.semestre} seleccionadas`);
      
      return semesterSubjects;
    } catch (error) {
      logger.error(`Error obteniendo materias del mismo semestre en carrera ${careerId}`, error);
      return [];
    }
  }

  /**
   * 🆕 Inscribe un usuario en materias del mismo semestre de sus carreras
   * @param {number} userId - ID del usuario
   * @param {Array<number>} careerIds - IDs de las carreras
   * @returns {number} Total de materias asignadas
   */
  static async enrollUserInCareerSubjects(userId, careerIds) {
    logger.info(`Asignando materias del mismo semestre al usuario ${userId}...`);

    let totalAssigned = 0;

    for (const careerId of careerIds) {
      try {
        // Obtener materias del mismo semestre
        const subjectIds = await this.getSubjectsFromSameSemester(careerId);

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
   * 🆕 Configuración completa de inscripción para estudiante
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

      // 3. Inscribir en materias del mismo semestre de esas carreras
      const totalSubjects = await this.enrollUserInCareerSubjects(userId, careerIds);
      logger.success(
        `Inscripción completada para estudiante ${userId}: ${careerIds.length} carreras, ${totalSubjects} materias del mismo semestre`
      );
    } catch (error) {
      logger.error(`Error en configuración de estudiante ${userId}`, error);
      throw error;
    }
  }

  /**
   * 🆕 Busca materias sin profesor que tengan estudiantes inscritos
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
   * 🆕 Asigna profesor a materias y crea evaluaciones automáticamente
   * @param {number} teacherId - ID del profesor
   * @param {Array} subjects - Materias a asignar
   * @returns {Object} Resultado con materias y evaluaciones creadas
   */
  static async assignTeacherToSubjects(teacherId, subjects) {
    let assignedCount = 0;
    const assignedSubjects = [];

    for (const subject of subjects) {
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
   * 🆕 Crear evaluaciones para las materias asignadas a un profesor
   * @param {number} teacherId - ID del profesor
   * @param {Array} subjects - Materias asignadas
   * @returns {Array} Evaluaciones creadas
   */
  static async createEvaluationsForTeacher(teacherId, subjects) {
    try {
      logger.info(`Creando evaluaciones para profesor ${teacherId}...`);

      // Obtener plantilla por defecto
      const template = await EvaluationTemplateModel.findDefault();
      
      if (!template) {
        logger.warn('No se encontró plantilla de evaluación por defecto');
        return [];
      }

      // Determinar periodo actual (formato: YYYY-S)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const semester = month <= 6 ? 1 : 2;
      const periodo = `${year}-${semester}`;

      // Fechas de la evaluación (3 meses de duración)
      const fechaInicio = new Date();
      const fechaCierre = new Date();
      fechaCierre.setMonth(fechaCierre.getMonth() + 3);

      const createdEvaluations = [];

      for (const subject of subjects) {
        try {
          // Verificar si ya existe una evaluación
          const exists = await EvaluationModel.exists(subject.id, teacherId, periodo);
          
          if (exists) {
            logger.warn(`Ya existe evaluación para materia ${subject.nombre} en periodo ${periodo}`);
            continue;
          }

          // Crear evaluación
          const evaluation = await EvaluationModel.create({
            templateId: template.id,
            subjectId: subject.id,
            teacherId: teacherId,
            periodo: periodo,
            fechaInicio: fechaInicio,
            fechaCierre: fechaCierre,
            esObligatoria: true,
            activo: true
          });

          createdEvaluations.push(evaluation);
          logger.success(`Evaluación creada para ${subject.nombre} (Periodo: ${periodo})`);
        } catch (error) {
          logger.error(`Error creando evaluación para materia ${subject.nombre}`, error);
        }
      }

      logger.success(`${createdEvaluations.length} evaluaciones creadas para profesor ${teacherId}`);
      return createdEvaluations;
    } catch (error) {
      logger.error('Error creando evaluaciones para profesor', error);
      return [];
    }
  }

  /**
   * 🆕 Configuración completa de asignación para profesor
   * @param {number} teacherId - ID del profesor
   * @returns {Object} Resultado de la configuración
   */
  static async setupTeacherAssignment(teacherId) {
    logger.teacher(`Configurando asignación de profesor ${teacherId}`);

    try {
      // 1. Buscar materias disponibles
      const subjectsToAssign = await this.findSubjectsNeedingTeacher();

      if (subjectsToAssign.length === 0) {
        logger.warn('No hay materias disponibles para asignar al profesor');
        return {
          assignedSubjects: 0,
          createdEvaluations: 0,
          subjects: [],
          evaluations: []
        };
      }

      // 2. Asignar profesor a las materias
      const { assignedCount, assignedSubjects } = await this.assignTeacherToSubjects(
        teacherId,
        subjectsToAssign
      );

      logger.success(
        `Profesor ${teacherId} asignado a ${assignedCount} materias`
      );

      // 3. Crear evaluaciones para esas materias
      const createdEvaluations = await this.createEvaluationsForTeacher(
        teacherId,
        assignedSubjects
      );

      // 4. Resumen final
      const result = {
        assignedSubjects: assignedCount,
        createdEvaluations: createdEvaluations.length,
        subjects: assignedSubjects.map(s => ({
          id: s.id,
          nombre: s.nombre,
          codigo: s.codigo,
          semestre: s.semestre,
          studentCount: s.studentCount
        })),
        evaluations: createdEvaluations.map(e => ({
          id: e.id,
          subjectId: e.subjectId,
          periodo: e.periodo,
          fechaInicio: e.fechaInicio,
          fechaCierre: e.fechaCierre
        }))
      };

      logger.success(
        `✅ Configuración completa para profesor ${teacherId}:\n` +
        `   - ${result.assignedSubjects} materias asignadas\n` +
        `   - ${result.createdEvaluations} evaluaciones creadas`
      );

      return result;
    } catch (error) {
      logger.error(`Error en configuración de profesor ${teacherId}`, error);
      throw error;
    }
  }
}

export default EnrollmentService;
