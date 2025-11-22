import { CareerModel } from '../models/career.model.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class CareerController {
  /**
   * Obtener todas las carreras
   * GET /api/careers
   */
  static async getAllCareers(req, res) {
    try {
      const careers = await CareerModel.findAll();
      
      return successResponse(res, {
        message: 'Carreras obtenidas exitosamente',
        data: careers
      });
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return errorResponse(res, 'Error al obtener las carreras', 500);
    }
  }

  /**
   * Obtener una carrera por ID
   * GET /api/careers/:id
   */
  static async getCareerById(req, res) {
    try {
      const { id } = req.params;
      const career = await CareerModel.findById(id);

      if (!career) {
        return errorResponse(res, 'Carrera no encontrada', 404);
      }

      return successResponse(res, {
        message: 'Carrera encontrada',
        data: career
      });
    } catch (error) {
      console.error('Error al obtener carrera:', error);
      return errorResponse(res, 'Error al obtener la carrera', 500);
    }
  }

  /**
   * Crear una nueva carrera
   * POST /api/careers
   */
  static async createCareer(req, res) {
    try {
      const { nombre, codigo, icon, color, descripcion, activo } = req.body;

      // Validaciones
      if (!nombre || !codigo) {
        return errorResponse(res, 'Nombre y código son requeridos', 400);
      }

      // Verificar si ya existe una carrera con ese código
      const existingCareer = await CareerModel.findByCode(codigo);
      if (existingCareer) {
        return errorResponse(res, 'Ya existe una carrera con ese código', 409);
      }

      const newCareer = await CareerModel.create({
        nombre,
        codigo,
        icon,
        color,
        descripcion,
        activo
      });

      return successResponse(res, {
        message: 'Carrera creada exitosamente',
        data: newCareer
      }, 201);
    } catch (error) {
      console.error('Error al crear carrera:', error);
      return errorResponse(res, 'Error al crear la carrera', 500);
    }
  }

  /**
   * Actualizar una carrera
   * PUT /api/careers/:id
   */
  static async updateCareer(req, res) {
    try {
      const { id } = req.params;
      const { nombre, codigo, icon, color, descripcion, activo } = req.body;

      // Verificar si existe la carrera
      const existingCareer = await CareerModel.findById(id);
      if (!existingCareer) {
        return errorResponse(res, 'Carrera no encontrada', 404);
      }

      // Si se está cambiando el código, verificar que no exista otro con ese código
      if (codigo && codigo !== existingCareer.codigo) {
        const careerWithCode = await CareerModel.findByCode(codigo);
        if (careerWithCode) {
          return errorResponse(res, 'Ya existe una carrera con ese código', 409);
        }
      }

      const updatedCareer = await CareerModel.update(id, {
        nombre,
        codigo,
        icon,
        color,
        descripcion,
        activo
      });

      return successResponse(res, {
        message: 'Carrera actualizada exitosamente',
        data: updatedCareer
      });
    } catch (error) {
      console.error('Error al actualizar carrera:', error);
      return errorResponse(res, 'Error al actualizar la carrera', 500);
    }
  }

  /**
   * Eliminar (desactivar) una carrera
   * DELETE /api/careers/:id
   */
  static async deleteCareer(req, res) {
    try {
      const { id } = req.params;

      const existingCareer = await CareerModel.findById(id);
      if (!existingCareer) {
        return errorResponse(res, 'Carrera no encontrada', 404);
      }

      await CareerModel.delete(id);

      return successResponse(res, {
        message: 'Carrera desactivada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar carrera:', error);
      return errorResponse(res, 'Error al eliminar la carrera', 500);
    }
  }

  /**
   * Obtener estudiantes de una carrera
   * GET /api/careers/:id/students
   */
  static async getCareerStudents(req, res) {
    try {
      const { id } = req.params;

      const career = await CareerModel.findById(id);
      if (!career) {
        return errorResponse(res, 'Carrera no encontrada', 404);
      }

      const students = await CareerModel.getStudents(id);

      return successResponse(res, {
        message: 'Estudiantes obtenidos exitosamente',
        data: {
          career: {
            id: career.id,
            nombre: career.nombre,
            codigo: career.codigo
          },
          students
        }
      });
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      return errorResponse(res, 'Error al obtener los estudiantes', 500);
    }
  }

  /**
   * Inscribir un estudiante en una carrera
   * POST /api/careers/:id/students
   */
  static async enrollStudent(req, res) {
    try {
      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return errorResponse(res, 'ID del estudiante es requerido', 400);
      }

      const enrollment = await CareerModel.enrollStudent(studentId, id);

      return successResponse(res, {
        message: 'Estudiante inscrito exitosamente',
        data: enrollment
      }, 201);
    } catch (error) {
      console.error('Error al inscribir estudiante:', error);
      
      // Error de duplicado (ya está inscrito)
      if (error.code === 'P2002') {
        return errorResponse(res, 'El estudiante ya está inscrito en esta carrera', 409);
      }
      
      return errorResponse(res, 'Error al inscribir el estudiante', 500);
    }
  }

  /**
   * Desinscribir un estudiante de una carrera
   * DELETE /api/careers/:id/students/:studentId
   */
  static async unenrollStudent(req, res) {
    try {
      const { id, studentId } = req.params;

      await CareerModel.unenrollStudent(studentId, id);

      return successResponse(res, {
        message: 'Estudiante desinscrito exitosamente'
      });
    } catch (error) {
      console.error('Error al desinscribir estudiante:', error);
      return errorResponse(res, 'Error al desinscribir el estudiante', 500);
    }
  }

  /**
   * Seed de carreras (solo para desarrollo/pruebas)
   * POST /api/careers/seed
   */
  static async seedCareers(req, res) {
    try {
      const careers = await CareerModel.seedCareers();

      return successResponse(res, {
        message: `${careers.length} carreras creadas exitosamente`,
        data: careers
      }, 201);
    } catch (error) {
      console.error('Error al crear carreras de prueba:', error);
      return errorResponse(res, 'Error al crear las carreras', 500);
    }
  }
}
