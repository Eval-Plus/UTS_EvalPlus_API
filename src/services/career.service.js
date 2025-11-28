import { CareerService } from '../services/career.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';

export class CareerController {
  /**
   * Obtener todas las carreras
   * GET /api/careers
   */
  static async getAllCareers(req, res) {
    try {
      const careers = await CareerService.getAllCareers();
      
      return successResponse(
        res,
        careers,
        MESSAGES.CAREER.RETRIEVED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return errorResponse(
        res,
        MESSAGES.GENERIC.ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
    }
  }

  /**
   * Obtener una carrera por ID
   * GET /api/careers/:id
   */
  static async getCareerById(req, res) {
    try {
      const { id } = req.params;
      const career = await CareerService.getCareerById(id);

      return successResponse(
        res,
        career,
        MESSAGES.CAREER.RETRIEVED_ONE,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener carrera:', error);

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
   * Crear una nueva carrera
   * POST /api/careers
   */
  static async createCareer(req, res) {
    try {
      const { nombre, codigo, icon, color, descripcion, activo } = req.body;

      const newCareer = await CareerService.createCareer({
        nombre,
        codigo,
        icon,
        color,
        descripcion,
        activo
      });

      return successResponse(
        res,
        newCareer,
        MESSAGES.CAREER.CREATED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al crear carrera:', error);

      if (error.message === 'Nombre y código son requeridos') {
        return errorResponse(
          res,
          MESSAGES.CAREER.REQUIRED_FIELDS,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (error.message === 'Ya existe una carrera con ese código') {
        return errorResponse(
          res,
          MESSAGES.CAREER.DUPLICATE_CODE,
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
   * Actualizar una carrera
   * PUT /api/careers/:id
   */
  static async updateCareer(req, res) {
    try {
      const { id } = req.params;
      const { nombre, codigo, icon, color, descripcion, activo } = req.body;

      const updatedCareer = await CareerService.updateCareer(id, {
        nombre,
        codigo,
        icon,
        color,
        descripcion,
        activo
      });

      return successResponse(
        res,
        updatedCareer,
        MESSAGES.CAREER.UPDATED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al actualizar carrera:', error);

      if (error.message === 'Carrera no encontrada') {
        return errorResponse(
          res,
          MESSAGES.CAREER.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message === 'Ya existe una carrera con ese código') {
        return errorResponse(
          res,
          MESSAGES.CAREER.DUPLICATE_CODE,
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
   * Eliminar (desactivar) una carrera
   * DELETE /api/careers/:id
   */
  static async deleteCareer(req, res) {
    try {
      const { id } = req.params;
      await CareerService.deleteCareer(id);

      return successResponse(
        res,
        null,
        MESSAGES.CAREER.DELETED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al eliminar carrera:', error);

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
   * Obtener usuarios de una carrera
   * GET /api/careers/:id/users
   */
  static async getCareerUsers(req, res) {
    try {
      const { id } = req.params;
      const data = await CareerService.getCareerUsers(id);

      return successResponse(
        res,
        data,
        'Usuarios obtenidos exitosamente',
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al obtener usuarios:', error);

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
   * Inscribir un usuario en una carrera
   * POST /api/careers/:id/users
   */
  static async enrollUser(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return errorResponse(
          res,
          'ID del usuario es requerido',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const enrollment = await CareerService.enrollUser(userId, id);

      return successResponse(
        res,
        enrollment,
        MESSAGES.ENROLLMENT.STUDENT_ENROLLED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al inscribir usuario:', error);

      if (error.message === 'Carrera no encontrada') {
        return errorResponse(
          res,
          MESSAGES.CAREER.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (error.message === 'El usuario ya está inscrito en esta carrera') {
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
   * Desinscribir un usuario de una carrera
   * DELETE /api/careers/:id/users/:userId
   */
  static async unenrollUser(req, res) {
    try {
      const { id, userId } = req.params;
      await CareerService.unenrollUser(userId, id);

      return successResponse(
        res,
        null,
        MESSAGES.ENROLLMENT.STUDENT_UNENROLLED,
        HTTP_STATUS.OK
      );
    } catch (error) {
      console.error('Error al desinscribir usuario:', error);

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
   * Seed de carreras (solo para desarrollo/pruebas)
   * POST /api/careers/seed
   */
  static async seedCareers(req, res) {
    try {
      const careers = await CareerService.seedCareers();

      return successResponse(
        res,
        careers,
        `${careers.length} carreras creadas exitosamente`,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Error al crear carreras de prueba:', error);

      if (error.message.includes('ya fueron generadas previamente')) {
        return errorResponse(
          res,
          error.message,
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
}
