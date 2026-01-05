/**
 * Servicio de Inscripciones - REFACTORIZADO
 * Maneja inscripción de estudiantes (todas las carreras, 2 materias c/u) y profesores
 */

import { CareerModel } from '../models/career.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { EvaluationModel } from '../models/evaluation.model.js';
import { EvaluationTemplateModel } from '../models/evaluation-template.model.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('EnrollmentService');

// Constante de periodo academico actual
const CURRENT_PERIOD = '2025-1';

// 🆕 Constantes de configuración
const STUDENT_CONFIG = {
  MAX_SUBJECTS_PER_CAREER: 2,  // Máximo 2 materias por carrera
  ENROLL_ALL_CAREERS: true      // Inscribir en todas las carreras
};

const TEACHER_CONFIG = {
  AUTO_CREATE_EVALUATIONS: true,
  EVALUATION_DURATION_MONTHS: 3
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
        const enrollment = await SubjectModel.enrollUserInMultipleSubjects(
          userId,
          subjectIds,
          CURRENT_PERIOD
        );

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
   * 🆕 Obtiene materias de un semestre aleatorio por carrera
   * @param {number} careerId - ID de la carrera
   * @param {number} maxSubjects - Máximo de materias a retornar (default: 2)
   * @returns {Array<number>} IDs de materias seleccionadas
   */
  static async getRandomSubjectsFromCareer(careerId, maxSubjects = STUDENT_CONFIG.MAX_SUBJECTS_PER_CAREER) {
    try {
      // 1. Obtener todas las materias agrupadas por semestre
      const subjectsBySemester = await SubjectModel.getSubjectsGroupedBySemester(careerId);
      
      // 2. Verificar que haya materias disponibles
      const availableSemesters = Object.keys(subjectsBySemester);
      if (availableSemesters.length === 0) {
        logger.warn(`No hay materias disponibles en carrera ${careerId}`);
        return [];
      }

      // 3. Seleccionar un semestre aleatorio
      const randomSemester = availableSemesters[
        Math.floor(Math.random() * availableSemesters.length)
      ];
      
      const semesterSubjects = subjectsBySemester[randomSemester];
      
      logger.debug(`Carrera ${careerId}: Semestre ${randomSemester} seleccionado con ${semesterSubjects.length} materias`);

      // 4. Si hay menos materias que el máximo, retornar todas
      if (semesterSubjects.length <= maxSubjects) {
        return semesterSubjects.map(s => s.id);
      }

      // 5. Seleccionar aleatoriamente hasta maxSubjects materias
      const shuffled = [...semesterSubjects]
        .sort(() => Math.random() - 0.5)
        .slice(0, maxSubjects);

      logger.success(
        `Carrera ${careerId}: ${shuffled.length} materias seleccionadas del semestre ${randomSemester}`
      );
      
      return shuffled.map(s => s.id);
    } catch (error) {
      logger.error(`Error obteniendo materias de carrera ${careerId}`, error);
      return [];
    }
  }

  /**
   * 🆕 Inscribe un usuario en materias de sus carreras
   * Para cada carrera: semestre aleatorio + máximo 2 materias
   * @param {number} userId - ID del usuario
   * @param {Array<number>} careerIds - IDs de las carreras
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
        // Obtener materias aleatorias de esta carrera
        const subjectIds = await this.getRandomSubjectsFromCareer(careerId);

        if (subjectIds.length === 0) {
          logger.warn(`No hay materias disponibles para carrera ${careerId}`);
          enrollmentSummary.careerDetails.push({
            careerId,
            subjectsAssigned: 0,
            success: false,
            reason: 'Sin materias disponibles'
          });
          continue;
        }

        // Inscribir en las materias seleccionadas
        const enrollments = await SubjectModel.enrollUserInMultipleSubjects(
          userId,
          subjectIds
        );

        enrollmentSummary.totalSubjectsAssigned += enrollments.length;
        enrollmentSummary.careerDetails.push({
          careerId,
          subjectsAssigned: enrollments.length,
          success: true
        });

        logger.success(
          `Usuario ${userId}: ${enrollments.length} materias asignadas en carrera ${careerId}`
        );
      } catch (error) {
        logger.error(`Error asignando materias de carrera ${careerId}`, error);
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
   * Inscribe en TODAS las carreras con máximo 2 materias por carrera
   * @param {number} userId - ID del usuario
   * @returns {Object} Resumen de la configuración
   */
  static async setupStudentEnrollment(userId) {
    logger.student(`🎓 Configurando inscripción de estudiante ${userId}`);

    try {
      // 1. Obtener TODAS las carreras activas
      const careerIds = await this.getAllActiveCareerIds();

      if (careerIds.length === 0) {
        logger.warn('⚠️  No hay carreras disponibles en el sistema');
        return {
          success: false,
          message: 'No hay carreras disponibles',
          careers: 0,
          subjects: 0
        };
      }

      // 2. Inscribir en todas las carreras
      const careerEnrollments = await this.enrollUserInCareers(userId, careerIds);
      logger.success(`✅ Estudiante ${userId} inscrito en ${careerEnrollments.length} carreras`);

      // 3. Inscribir en materias (máximo 2 por carrera)
      const subjectSummary = await this.enrollUserInCareerSubjects(userId, careerIds);

      // 4. Resumen final
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
        `   📖 ${result.subjects} materias (máx. ${STUDENT_CONFIG.MAX_SUBJECTS_PER_CAREER} por carrera)`
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
   * Asigna profesor a materias
   * @param {number} teacherId - ID del profesor
   * @param {Array} subjects - Materias a asignar
   * @returns {Object} Resultado con materias asignadas
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
   * Crear evaluaciones para las materias asignadas a un profesor
   * @param {number} teacherId - ID del profesor
   * @param {Array} subjects - Materias asignadas
   * @returns {Array} Evaluaciones creadas
   */
  static async createEvaluationsForTeacher(teacherId, subjects) {
    if (!TEACHER_CONFIG.AUTO_CREATE_EVALUATIONS) {
      logger.info('Creación automática de evaluaciones deshabilitada');
      return [];
    }

    try {
      logger.info(`📝 Creando evaluaciones para profesor ${teacherId}...`);

      // Obtener plantilla por defecto
      const template = await EvaluationTemplateModel.findDefault();
      
      if (!template) {
        logger.warn('No se encontró plantilla de evaluación por defecto');
        return [];
      }

      // Aqui ya no se calcula el periodo, se usa el periodo actual
      const periodo = CURRENT_PERIOD;

      // Fechas de la evaluación
      const fechaInicio = new Date();
      const fechaCierre = new Date();
      fechaCierre.setMonth(fechaCierre.getMonth() + TEACHER_CONFIG.EVALUATION_DURATION_MONTHS);

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
   * Configuración completa de asignación para profesor
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
