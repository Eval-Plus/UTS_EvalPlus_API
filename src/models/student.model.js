import prisma from '../config/prisma.js';

export class StudentModel {
  /**
   * Buscar estudiante por email
   */
  static async findByEmail(email) {
    return await prisma.student.findUnique({
      where: { email }
    });
  }

  /**
   * Buscar estudiante por Google ID
   */
  static async findByGoogleId(googleId) {
    return await prisma.student.findUnique({
      where: { googleId }
    });
  }

  /**
   * Buscar estudiante por ID
   */
  static async findById(id) {
    return await prisma.student.findUnique({
      where: { id }
    });
  }

  /**
   * Crear nuevo estudiante
   */
  static async create(data) {
    return await prisma.student.create({
      data
    });
  }

  /**
   * Actualizar estudiante
   */
  static async update(id, data) {
    return await prisma.student.update({
      where: { id },
      data
    });
  }

  /**
   * Verificar si el perfil está completo
   */
  static isProfileComplete(student) {
    return Boolean(
      student.identificacion &&
      student.carreras.length > 0 &&
      student.materias.length > 0
    );
  }
}
