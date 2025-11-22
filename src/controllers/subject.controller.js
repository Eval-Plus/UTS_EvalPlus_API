import { SubjectModel } from '../models/subject.model.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class SubjectController {
  /**
   * Obtener todas las materias
   * GET /api/subjects
   */
  static async getAllSubjects(req, res) {
    try {
      const subjects = await SubjectModel.findAll();
      
      return successResponse(
        res,
        subjects,
        'Materias obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener materias:', error);
      return errorResponse(res, 'Error al obtener las materias', 500);
    }
  }

  /**
   * Obtener una materia por ID
   * GET /api/subjects/:id
   */
  static async getSubjectById(req, res) {
    try {
      const { id } = req.params;
      const subject = await SubjectModel.findById(id);

      if (!subject) {
        return errorResponse(res, 'Materia no encontrada', 404);
      }

      return successResponse(
        res,
        subject,
        'Materia obtenida exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener materia:', error);
      return errorResponse(res, 'Error al obtener la materia', 500);
    }
  }

  /**
   * Obtener materias por carrera
   * GET /api/subjects/career/:careerId
   */
  static async getSubjectsByCareer(req, res) {
    try {
      const { careerId } = req.params;
      const subjects = await SubjectModel.findByCareer(careerId);

      return successResponse(
        res,
        subjects,
        'Materias de la carrera obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener materias por carrera:', error);
      return errorResponse(res, 'Error al obtener las materias', 500);
    }
  }

  /**
   * Obtener materias por código de carrera
   * GET /api/subjects/career-code/:careerCode
   */
  static async getSubjectsByCareerCode(req, res) {
    try {
      const { careerCode } = req.params;
      const subjects = await SubjectModel.findByCareerCode(careerCode);

      return successResponse(
        res,
        subjects,
        `Materias de ${careerCode} obtenidas exitosamente`
      );
    } catch (error) {
      console.error('Error al obtener materias por código de carrera:', error);
      return errorResponse(res, 'Error al obtener las materias', 500);
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

      const subjects = await SubjectModel.findBySemester(semestre, careerId);

      return successResponse(
        res,
        subjects,
        `Materias del semestre ${semestre} obtenidas exitosamente`
      );
    } catch (error) {
      console.error('Error al obtener materias por semestre:', error);
      return errorResponse(res, 'Error al obtener las materias', 500);
    }
  }

  /**
   * Crear una nueva materia
   * POST /api/subjects
   * Body: { nombre, codigo, careerId, professorName, semestre, descripcion }
   */
  static async createSubject(req, res) {
    try {
      const { nombre, codigo, careerId, professorName, semestre, descripcion } = req.body;

      // Validaciones básicas
      if (!nombre || !codigo || !careerId || !professorName) {
        return errorResponse(
          res,
          'Faltan campos obligatorios: nombre, codigo, careerId, professorName',
          400
        );
      }

      // Verificar si ya existe una materia con ese código
      const existingSubject = await SubjectModel.findByCode(codigo);
      if (existingSubject) {
        return errorResponse(res, 'Ya existe una materia con ese código', 409);
      }

      const newSubject = await SubjectModel.create({
        nombre,
        codigo,
        careerId,
        professorName,
        semestre: semestre || 1,
        descripcion
      });

      return successResponse(
        res,
        newSubject,
        'Materia creada exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al crear materia:', error);
      return errorResponse(res, 'Error al crear la materia', 500);
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

      // Verificar que la materia existe
      const existingSubject = await SubjectModel.findById(id);
      if (!existingSubject) {
        return errorResponse(res, 'Materia no encontrada', 404);
      }

      // Si se intenta cambiar el código, verificar que no exista otro con ese código
      if (updateData.codigo && updateData.codigo !== existingSubject.codigo) {
        const subjectWithCode = await SubjectModel.findByCode(updateData.codigo);
        if (subjectWithCode) {
          return errorResponse(res, 'Ya existe una materia con ese código', 409);
        }
      }

      const updatedSubject = await SubjectModel.update(id, updateData);

      return successResponse(
        res,
        updatedSubject,
        'Materia actualizada exitosamente'
      );
    } catch (error) {
      console.error('Error al actualizar materia:', error);
      return errorResponse(res, 'Error al actualizar la materia', 500);
    }
  }

  /**
   * Eliminar (desactivar) una materia
   * DELETE /api/subjects/:id
   */
  static async deleteSubject(req, res) {
    try {
      const { id } = req.params;

      const subject = await SubjectModel.findById(id);
      if (!subject) {
        return errorResponse(res, 'Materia no encontrada', 404);
      }

      await SubjectModel.delete(id);

      return successResponse(
        res,
        null,
        'Materia desactivada exitosamente'
      );
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      return errorResponse(res, 'Error al eliminar la materia', 500);
    }
  }

  /**
   * Obtener estudiantes de una materia
   * GET /api/subjects/:id/students
   */
  static async getSubjectStudents(req, res) {
    try {
      const { id } = req.params;

      const subject = await SubjectModel.findById(id);
      if (!subject) {
        return errorResponse(res, 'Materia no encontrada', 404);
      }

      const students = await SubjectModel.getStudents(id);

      return successResponse(
        res,
        students,
        'Estudiantes de la materia obtenidos exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener estudiantes de materia:', error);
      return errorResponse(res, 'Error al obtener los estudiantes', 500);
    }
  }

  /**
   * Inscribir un estudiante en una materia
   * POST /api/subjects/:id/enroll
   * Body: { studentId }
   */
  static async enrollStudent(req, res) {
    try {
      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return errorResponse(res, 'studentId es requerido', 400);
      }

      // Verificar si ya está inscrito
      const isEnrolled = await SubjectModel.isStudentEnrolled(studentId, id);
      if (isEnrolled) {
        return errorResponse(res, 'El estudiante ya está inscrito en esta materia', 409);
      }

      const enrollment = await SubjectModel.enrollStudent(studentId, id);

      return successResponse(
        res,
        enrollment,
        'Estudiante inscrito exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al inscribir estudiante:', error);
      return errorResponse(res, 'Error al inscribir al estudiante', 500);
    }
  }

  /**
   * Desinscribir un estudiante de una materia
   * DELETE /api/subjects/:id/enroll/:studentId
   */
  static async unenrollStudent(req, res) {
    try {
      const { id, studentId } = req.params;

      const isEnrolled = await SubjectModel.isStudentEnrolled(studentId, id);
      if (!isEnrolled) {
        return errorResponse(res, 'El estudiante no está inscrito en esta materia', 404);
      }

      await SubjectModel.unenrollStudent(studentId, id);

      return successResponse(
        res,
        null,
        'Estudiante desinscrito exitosamente'
      );
    } catch (error) {
      console.error('Error al desinscribir estudiante:', error);
      return errorResponse(res, 'Error al desinscribir al estudiante', 500);
    }
  }

  /**
   * Seed - Crear materias de prueba
   * POST /api/subjects/seed
   * Ruta de desarrollo para poblar la BD
   */
  static async seedSubjects(req, res) {
    try {
      const subjects = await SubjectModel.seedSubjects();

      return successResponse(
        res,
        subjects,
        `${subjects.length} materias creadas exitosamente`,
        201
      );
    } catch (error) {
      console.error('Error al crear materias de prueba:', error);
      return errorResponse(res, 'Error al crear materias de prueba', 500);
    }
  }
}
