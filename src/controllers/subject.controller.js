import { SubjectService } from '../services/subject.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';

export class SubjectController {
  /**
   * Obtener todas las materias
   * GET /api/subjects
   */
  static async getAllSubjects(req, res) {
    try {
      const subjects = await SubjectService.getAllSubjects();
      
      return successResponse(
        res,
        subjects,
        MESSAGES.SUBJECT.RETRIEVED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener materias:', error);
      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener una materia por ID
   * GET /api/subjects/:id
   */
  static async getSubjectById(req, res) {
    try {
      const { id } = req.params;
      const subject = await SubjectService.getSubjectById(id);

      return successResponse(
        res,
        subject,
        MESSAGES.SUBJECT.RETRIEVED_ONE,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener materia:', error);

      if (error.message === 'Materia no encontrada') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener materias por carrera
   * GET /api/subjects/career/:careerId
   */
  static async getSubjectsByCareer(req, res) {
    try {
      const { careerId } = req.params;
      const subjects = await SubjectService.getSubjectsByCareer(careerId);

      return successResponse(
        res,
        subjects,
        MESSAGES.SUBJECT.RETRIEVED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener materias por carrera:', error);
      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener materias por código de carrera
   * GET /api/subjects/career-code/:careerCode
   */
  static async getSubjectsByCareerCode(req, res) {
    try {
      const { careerCode } = req.params;
      const subjects = await SubjectService.getSubjectsByCareerCode(careerCode);

      return successResponse(
        res,
        subjects,
        `Materias de ${careerCode} obtenidas exitosamente`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener materias por código de carrera:', error);

      if (error.message === 'Carrera no encontrada') {
        return errorResponse(
          res,
          MESSAGES.CAREER.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener materias por semestre
   * GET /api/subjects/semester/:semestre?careerId=X
   */
  static async getSubjectsBySemester(req, res) {
    try {
      const { semestre } = req.params;
      const { careerId } = req.query;

      const subjects = await SubjectService.getSubjectsBySemester(semestre, careerId);

      return successResponse(
        res,
        subjects,
        `Materias del semestre ${semestre} obtenidas exitosamente`,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener materias por semestre:', error);
      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Crear una nueva materia
   * POST /api/subjects
   */
  static async createSubject(req, res) {
    try {
      const { nombre, codigo, careerId, professorName, semestre, descripcion } = req.body;

      const newSubject = await SubjectService.createSubject({
        nombre,
        codigo,
        careerId,
        professorName,
        semestre,
        descripcion
      });

      return successResponse(
        res,
        newSubject,
        MESSAGES.SUBJECT.CREATED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al crear materia:', error);

      if (error.message.includes('campos obligatorios')) {
        return errorResponse(
          res,
          error.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message === 'La carrera especificada no existe') {
        return errorResponse(
          res,
          MESSAGES.CAREER.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message === 'Ya existe una materia con ese código') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.DUPLICATE_CODE,
          HTTP_STATUS.CONFLICT
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Actualizar una materia
   * PUT /api/subjects/:id
   */
  static async updateSubject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedSubject = await SubjectService.updateSubject(id, updateData);

      return successResponse(
        res,
        updatedSubject,
        MESSAGES.SUBJECT.UPDATED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al actualizar materia:', error);

      if (error.message === 'Materia no encontrada') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message === 'La carrera especificada no existe') {
        return errorResponse(
          res,
          MESSAGES.CAREER.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message === 'Ya existe una materia con ese código') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.DUPLICATE_CODE,
          HTTP_STATUS.CONFLICT
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Eliminar (desactivar) una materia
   * DELETE /api/subjects/:id
   */
  static async deleteSubject(req, res) {
    try {
      const { id } = req.params;
      await SubjectService.deleteSubject(id);

      return successResponse(
        res,
        null,
        MESSAGES.SUBJECT.DELETED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al eliminar materia:', error);

      if (error.message === 'Materia no encontrada') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener usuarios de una materia
   * GET /api/subjects/:id/users
   */
  static async getSubjectUsers(req, res) {
    try {
      const { id } = req.params;
      const users = await SubjectService.getSubjectUsers(id);

      return successResponse(
        res,
        users,
        'Usuarios de la materia obtenidos exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener usuarios de materia:', error);

      if (error.message === 'Materia no encontrada') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Inscribir un usuario en una materia
   * POST /api/subjects/:id/enroll
   */
  static async enrollUser(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return errorResponse(
          res,
          'userId es requerido',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const enrollment = await SubjectService.enrollUser(userId, id);

      return successResponse(
        res,
        enrollment,
        MESSAGES.ENROLLMENT.STUDENT_ENROLLED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al inscribir usuario:', error);

      if (error.message === 'Materia no encontrada') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message === 'El usuario ya está inscrito en esta materia') {
        return errorResponse(
          res,
          MESSAGES.ENROLLMENT.ALREADY_ENROLLED,
          HTTP_STATUS.CONFLICT
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Desinscribir un usuario de una materia
   * DELETE /api/subjects/:id/enroll/:userId
   */
  static async unenrollUser(req, res) {
    try {
      const { id, userId } = req.params;
      await SubjectService.unenrollUser(userId, id);

      return successResponse(
        res,
        null,
        MESSAGES.ENROLLMENT.STUDENT_UNENROLLED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al desinscribir usuario:', error);

      if (error.message === 'Materia no encontrada') {
        return errorResponse(
          res,
          MESSAGES.SUBJECT.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message === 'El usuario no está inscrito en esta materia') {
        return errorResponse(
          res,
          MESSAGES.ENROLLMENT.NOT_ENROLLED,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }
}
