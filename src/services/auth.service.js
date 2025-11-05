import { verifyGoogleToken } from '../config/google.js';
import { StudentModel } from '../models/student.model.js';
import { generateToken } from '../utils/jwt.js';

export class AuthService {
  /**
   * Login con Google
   * @param {string} googleToken - ID Token de Google
   * @returns {Promise<Object>} Usuario y token JWT
   */
  static async loginWithGoogle(googleToken) {
    // Verificar el token de Google
    const googleUser = await verifyGoogleToken(googleToken);

    if (!googleUser.emailVerified) {
      throw new Error('El email de Google no está verificado');
    }

    // Buscar si el usuario ya existe
    let student = await StudentModel.findByGoogleId(googleUser.googleId);

    // Si no existe, crearlo
    if (!student) {
      student = await StudentModel.create({
        googleId: googleUser.googleId,
        email: googleUser.email,
        nombreCompleto: googleUser.nombreCompleto,
        profilePicture: googleUser.profilePicture,
        isProfileComplete: false
      });
    } else {
      // Actualizar información del perfil de Google si cambió
      student = await StudentModel.update(student.id, {
        nombreCompleto: googleUser.nombreCompleto,
        profilePicture: googleUser.profilePicture
      });
    }

    // Verificar si el perfil está completo
    const isProfileComplete = StudentModel.isProfileComplete(student);
    
    if (isProfileComplete !== student.isProfileComplete) {
      student = await StudentModel.update(student.id, { isProfileComplete });
    }

    // Generar token JWT
    const token = generateToken({
      id: student.id,
      email: student.email,
      googleId: student.googleId
    });

    // Retornar datos del usuario (sin información sensible)
    return {
      token,
      user: {
        id: student.id,
        email: student.email,
        nombreCompleto: student.nombreCompleto,
        profilePicture: student.profilePicture,
        isProfileComplete: student.isProfileComplete,
        identificacion: student.identificacion,
        carreras: student.carreras,
        materias: student.materias
      }
    };
  }

  /**
   * Obtener perfil del usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  static async getProfile(userId) {
    const student = await StudentModel.findById(userId);
    
    if (!student) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: student.id,
      email: student.email,
      nombreCompleto: student.nombreCompleto,
      profilePicture: student.profilePicture,
      isProfileComplete: student.isProfileComplete,
      identificacion: student.identificacion,
      carreras: student.carreras,
      materias: student.materias,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    };
  }
}
