import { StudentModel } from '../models/student.model.js';
import { CareerModel } from '../models/career.model.js';
import { generateToken } from '../utils/jwt.js';

export class AuthService {
  /**
   * Procesa el usuario autenticado con OAuth (Microsoft)
   * @param {Object} profile - Perfil de Microsoft
   * @param {string} accessToken - Token de acceso de Microsoft
   * @returns {Object} Usuario y token JWT
   */
  static async processOAuthUser(profile, accessToken) {
    try {
      // Extraer datos del perfil de Microsoft
      const microsoftId = profile.id;
      const email = profile.emails?.[0]?.value || profile.userPrincipalName;
      const nombreCompleto = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
      const profilePicture = profile.photos?.[0]?.value || null;

      if (!email) {
        throw new Error('No se pudo obtener el email del perfil de Microsoft');
      }

      // Variables para tracking del flujo
      let student;
      let isNewUser = false;

      // Buscar si el estudiante ya existe por Microsoft ID
      student = await StudentModel.findByMicrosoftId(microsoftId);

      if (student) {
        // CASO 1: Usuario existente con cuenta de Microsoft vinculada
        // Solo actualizamos su información básica
        student = await StudentModel.update(student.id, {
          nombreCompleto,
          profilePicture,
          updatedAt: new Date()
        });
      } else {
        // Usuario no encontrado por Microsoft ID
        // Verificar si existe una cuenta con ese email
        const existingByEmail = await StudentModel.findByEmail(email);

        if (existingByEmail) {
          // CASO 2: Usuario existente sin Microsoft vinculado
          // Vinculamos su cuenta de Microsoft con la cuenta existente
          student = await StudentModel.update(existingByEmail.id, {
            microsoftId,
            nombreCompleto,
            profilePicture,
            updatedAt: new Date()
          });
        } else {
          // CASO 3: Usuario completamente nuevo
          // Creamos una nueva cuenta
          student = await StudentModel.create({
            microsoftId,
            email,
            nombreCompleto,
            profilePicture,
            isProfileComplete: false
          });
          isNewUser = true;

	  // Add: Asignar dos carreras aleatorias
	  console.log(`📚 Asignando carreras al nuevo estudiante ${student.id}...`);

	  const randomCareerIds = await this.getRandomCareers(2);

	  if (randomCareerIds.length > 0) {
	    await this.assignCareersToStudent(student.id, randomCareerIds);
	    console.log(`✅ Se asignaron ${randomCareerIds.length} carreras`);
	  }
        }
      }

      // Verificar si el perfil está completo
      const isProfileComplete = StudentModel.isProfileComplete(student);

      if (student.isProfileComplete !== isProfileComplete) {
        student = await StudentModel.update(student.id, {
          isProfileComplete
        });
      }

      // Generar token JWT
      const token = generateToken({
        id: student.id,
        email: student.email,
        microsoftId: student.microsoftId,
        isProfileComplete: student.isProfileComplete
      });

      // Obtener estudiante completo con carreras
      const studentWithCareers = await StudentModel.findByIdWithCareers(student.id);

      return {
        token,
        user: this.sanitizeUser(student),
        isNewUser
      };
    } catch (error) {
      console.error('Error en processOAuthUser:', error);
      throw error;
    }
  }

  /**
   * Selecciona N carreras aleatorias
   */
  static async getRandomCareers(count = 2) {
    const allCareers = await CareerModel.findAll();

    if (allCareers.length === 0) {
      console.warn('⚠️  No hay carreras disponibles');
      return [];
    }

    if (allCareers.length <= count) {
      return allCareers.map(c => c.id);
    }

    // Mezclar y tomar las primeras 'count'
    const shuffled = allCareers
      .map(career => ({ career, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ career }) => career.id)
      .slice(0, count);

    return shuffled;
  }

  /**
   * Asigna carreras a un estudiante
   */
  static async assignCareersToStudent(studentId, careerIds) {
    const assignments = [];

    for (const careerId of careerIds) {
      try {
        const enrollment = await CareerModel.enrollStudent(studentId, careerId);
        assignments.push(enrollment);
      } catch (error) {
        console.warn(`No se pudo asignar carrera ${careerId}:`, error.message);
      }
    }

    return assignments;
  }


  /**
   * Obtiene el perfil del usuario autenticado
   * @param {number} userId - ID del usuario
   * @returns {Object} Perfil del usuario
   */
  static async getProfile(userId) {
    try {
      const student = await StudentModel.findById(userId);

      if (!student) {
        throw new Error('Usuario no encontrado');
      }

      return this.sanitizeUser(student);
    } catch (error) {
      console.error('Error en getProfile:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del estudiante
   * @param {number} userId - ID del usuario
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Usuario actualizado
   */
  static async updateProfile(userId, data) {
    try {
      // Validar y sanitizar datos
      const updateData = {};

      if (data.identificacion) {
        updateData.identificacion = data.identificacion.trim();
      }

      if (data.carreras && Array.isArray(data.carreras)) {
        updateData.carreras = data.carreras.filter(c => c.trim().length > 0);
      }

      if (data.materias && Array.isArray(data.materias)) {
        updateData.materias = data.materias.filter(m => m.trim().length > 0);
      }

      // Actualizar usuario
      const student = await StudentModel.update(userId, updateData);

      // Verificar si el perfil está completo
      const isProfileComplete = StudentModel.isProfileComplete(student);
      
      if (student.isProfileComplete !== isProfileComplete) {
        await StudentModel.update(userId, { isProfileComplete });
      }

      // Obtener usuario actualizado
      const updatedStudent = await StudentModel.findById(userId);

      return this.sanitizeUser(updatedStudent);
    } catch (error) {
      console.error('Error en updateProfile:', error);
      throw error;
    }
  }

  /**
   * Remueve información sensible del usuario
   * @param {Object} student - Objeto estudiante
   * @returns {Object} Usuario sanitizado
   */
  static sanitizeUser(student) {
    const { microsoftId, ...userData } = student;

    return {
      ...userData,
      hasMicrosoftAccount: Boolean(microsoftId),
      careers: student.careers?.map(sc => ({
        id: sc.career.id,
        nombre: sc.career.nombre,
        codigo: sc.career.codigo,
        icon: sc.career.icon,
        color: sc.career.color,
        enrolledAt: sc.enrolledAt
      })) || []
    };
  }

  /**
   * Verifica el estado del token de Microsoft (opcional)
   * @param {string} accessToken - Token de acceso de Microsoft
   * @returns {Object} Información del token
   */
  static async verifyMicrosoftToken(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Token de Microsoft inválido');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al verificar token de Microsoft:', error);
      throw error;
    }
  }
}
