import { UserModel } from '../models/user.model.js';
import { CareerModel } from '../models/career.model.js';
import { SubjectModel } from '../models/subject.model.js';
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
      let user;
      let isNewUser = false;

      // Buscar si el usuario ya existe por Microsoft ID
      user = await UserModel.findByMicrosoftId(microsoftId);

      if (user) {
        // CASO 1: Usuario existente con cuenta de Microsoft vinculada
        // Solo actualizamos su información básica
        user = await UserModel.update(user.id, {
          nombreCompleto,
          profilePicture,
          updatedAt: new Date()
        });
      } else {
        // Usuario no encontrado por Microsoft ID
        // Verificar si existe una cuenta con ese email
        const existingByEmail = await UserModel.findByEmail(email);

        if (existingByEmail) {
          // CASO 2: Usuario existente sin Microsoft vinculado
          // Vinculamos su cuenta de Microsoft con la cuenta existente
          user = await UserModel.update(existingByEmail.id, {
            microsoftId,
            nombreCompleto,
            profilePicture,
            updatedAt: new Date()
          });
        } else {
          // CASO 3: Usuario completamente nuevo
          // Creamos una nueva cuenta
          user = await UserModel.create({
            microsoftId,
            email,
            nombreCompleto,
            profilePicture,
            isProfileComplete: false
          });
          isNewUser = true;

          // 🆕 DETECTAR ROL BASADO EN EL EMAIL
          const isTeacher = this.isTeacherEmail(email);
          const roleName = isTeacher ? 'TEACHER' : 'STUDENT';

          console.log(`👤 Nuevo usuario detectado: ${email}`);
          console.log(`🎭 Rol asignado: ${roleName}`);

          // Asignar rol al usuario
          await UserModel.assignRole(user.id, roleName);

          if (isTeacher) {
            // 🧑‍🏫 LÓGICA PARA PROFESORES
            await this.setupTeacherProfile(user.id);
          } else {
            // 👨‍🎓 LÓGICA PARA ESTUDIANTES
            await this.setupStudentProfile(user.id);
          }
        }
      }

      // Verificar si el perfil está completo
      const isProfileComplete = UserModel.isProfileComplete(user);

      if (user.isProfileComplete !== isProfileComplete) {
        user = await UserModel.update(user.id, {
          isProfileComplete
        });
      }

      // Generar token JWT
      const token = generateToken({
        id: user.id,
        email: user.email,
        microsoftId: user.microsoftId,
        isProfileComplete: user.isProfileComplete
      });

      // Obtener usuario completo con carreras
      const userWithCareers = await UserModel.findByIdWithCareers(user.id);

      return {
        token,
        user: this.sanitizeUser(userWithCareers),
        isNewUser
      };
    } catch (error) {
      console.error('Error en processOAuthUser:', error);
      throw error;
    }
  }

  /**
   * 🆕 Detecta si el email corresponde a un profesor
   * @param {string} email - Email del usuario
   * @returns {boolean} True si es profesor
   */
  static isTeacherEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    // Convertir a minúsculas para comparación case-insensitive
    const emailLower = email.toLowerCase();
    
    // Detectar si contiene la palabra "profesor" o "teacher"
    return emailLower.includes('profesor') || emailLower.includes('teacher');
  }

  /**
   * 🆕 Configura el perfil inicial de un estudiante
   * @param {number} userId - ID del usuario
   */
  static async setupStudentProfile(userId) {
    console.log(`📚 Configurando perfil de estudiante para usuario ${userId}...`);

    // Asignar dos carreras aleatorias
    const randomCareerIds = await this.getRandomCareers(2);

    if (randomCareerIds.length > 0) {
      await this.assignCareersToUser(userId, randomCareerIds);
      console.log(`✅ Se asignaron ${randomCareerIds.length} carreras`);

      // Asignar 3 materias aleatorias por cada carrera
      await this.assignSubjectsToUser(userId, randomCareerIds);
    }
  }

  /**
   * 🆕 Configura el perfil inicial de un profesor
   * @param {number} userId - ID del usuario
   */
  static async setupTeacherProfile(userId) {
    console.log(`🧑‍🏫 Configurando perfil de profesor para usuario ${userId}...`);

    try {
      // Buscar materias sin profesor asignado que tengan estudiantes inscritos
      const subjectsToAssign = await this.findSubjectsNeedingTeacher();

      if (subjectsToAssign.length === 0) {
        console.log('⚠️  No hay materias disponibles para asignar');
        return;
      }

      // Asignar el profesor a esas materias
      let assignedCount = 0;
      for (const subject of subjectsToAssign) {
        try {
          console.log(`  🔄 Intentando asignar materia ${subject.id}: ${subject.nombre}...`);
          
          const updatedSubject = await SubjectModel.update(subject.id, {
            teacherId: userId
          });
          
          assignedCount++;
          console.log(`  ✅ Asignado como profesor de: ${subject.nombre} (ID: ${subject.id}, TeacherID: ${updatedSubject.teacherId})`);
        } catch (error) {
          console.error(`  ❌ Error asignando materia ${subject.id}:`, error.message);
          console.error(`  Stack:`, error.stack);
        }
      }

      console.log(`✅ Profesor asignado a ${assignedCount} materias`);
      
      // 🔍 Verificación adicional: Consultar las materias asignadas
      const verifySubjects = await SubjectModel.findAll();
      const teacherSubjects = verifySubjects.filter(s => s.teacherId === userId);
      console.log(`🔍 Verificación: Profesor tiene ${teacherSubjects.length} materias asignadas en BD`);
      
    } catch (error) {
      console.error('Error en setupTeacherProfile:', error);
      console.error('Stack completo:', error.stack);
    }
  }

  /**
   * 🆕 Busca materias sin profesor que tengan estudiantes inscritos
   * @returns {Array} Lista de materias
   */
  static async findSubjectsNeedingTeacher() {
    try {
      const subjects = await SubjectModel.findSubjectsWithoutTeacher();
      
      // Filtrar solo las que tienen estudiantes inscritos
      const subjectsWithStudents = [];
      
      for (const subject of subjects) {
        const studentCount = await SubjectModel.getStudentCount(subject.id);
        if (studentCount > 0) {
          subjectsWithStudents.push(subject);
        }
      }

      console.log(`📊 Materias sin profesor con estudiantes: ${subjectsWithStudents.length}`);
      return subjectsWithStudents;
    } catch (error) {
      console.error('Error buscando materias sin profesor:', error);
      return [];
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
   * Asigna carreras a un usuario
   */
  static async assignCareersToUser(userId, careerIds) {
    const assignments = [];

    for (const careerId of careerIds) {
      try {
        const enrollment = await CareerModel.enrollUser(userId, careerId);
        assignments.push(enrollment);
      } catch (error) {
        console.warn(`No se pudo asignar carrera ${careerId}:`, error.message);
      }
    }

    return assignments;
  }

  /**
   * Asigna materias aleatorias a un estudiante basado en sus carreras
   */
  static async assignSubjectsToUser(userId, careerIds) {
    console.log(`📖 Asignando materias al estudiante ${userId}...`);

    let totalAssigned = 0;

    for (const careerId of careerIds) {
      try {
        // Obtener 3 materias aleatorias de esta carrera
        const randomSubjectIds = await SubjectModel.getRandomSubjectsByCareer(careerId, 3);

        if (randomSubjectIds.length > 0) {
          // Inscribir al estudiante en esas materias
          const enrollments = await SubjectModel.enrollUserInMultipleSubjects(
            userId,
            randomSubjectIds
          );

          totalAssigned += enrollments.length;
          console.log(`  ✅ Asignadas ${enrollments.length} materias de la carrera ${careerId}`);
        } else {
          console.log(`  ⚠️  No hay materias disponibles para la carrera ${careerId}`);
        }
      } catch (error) {
        console.error(`  ❌ Error asignando materias de carrera ${careerId}:`, error.message);
      }
    }

    console.log(`✅ Total de materias asignadas: ${totalAssigned}`);
    return totalAssigned;
  }

  /**
   * Obtiene el perfil del usuario autenticado
   * @param {number} userId - ID del usuario
   * @returns {Object} Perfil del usuario
   */
  static async getProfile(userId) {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error en getProfile:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario
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
      const user = await UserModel.update(userId, updateData);

      // Verificar si el perfil está completo
      const isProfileComplete = UserModel.isProfileComplete(user);
      
      if (user.isProfileComplete !== isProfileComplete) {
        await UserModel.update(userId, { isProfileComplete });
      }

      // Obtener usuario actualizado
      const updatedUser = await UserModel.findById(userId);

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      console.error('Error en updateProfile:', error);
      throw error;
    }
  }

  /**
   * Remueve información sensible del usuario
   * @param {Object} user - Objeto usuario
   * @returns {Object} Usuario sanitizado
   */
  static sanitizeUser(user) {
    const { microsoftId, ...userData } = user;

    return {
      ...userData,
      hasMicrosoftAccount: Boolean(microsoftId),
      careers: user.careers?.map(sc => ({
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
