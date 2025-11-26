/**
 * Constantes globales de la aplicación
 */

// Roles del sistema
export const ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN'
};

// Palabras clave para detectar profesores en emails
export const TEACHER_EMAIL_KEYWORDS = ['profesor', 'teacher', 'docente'];

// Configuración de asignación automática
export const AUTO_ASSIGNMENT = {
  CAREERS_PER_STUDENT: 2,
  SUBJECTS_PER_CAREER: 3
};

// Estados de perfil
export const PROFILE_STATUS = {
  INCOMPLETE: false,
  COMPLETE: true
};

// Mensajes de respuesta comunes
export const MESSAGES = {
  // Autenticación
  AUTH: {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    ACCOUNT_CREATED: 'Cuenta creada exitosamente',
    LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
    PROFILE_UPDATED: 'Perfil actualizado exitosamente',
    PROFILE_RETRIEVED: 'Perfil obtenido exitosamente',
    TOKEN_INVALID: 'Token inválido o expirado',
    TOKEN_MISSING: 'Token no proporcionado',
    USER_NOT_FOUND: 'Usuario no encontrado',
    MICROSOFT_ERROR: 'Error en la autenticación con Microsoft'
  },

  // Carreras
  CAREER: {
    RETRIEVED: 'Carreras obtenidas exitosamente',
    RETRIEVED_ONE: 'Carrera encontrada',
    CREATED: 'Carrera creada exitosamente',
    UPDATED: 'Carrera actualizada exitosamente',
    DELETED: 'Carrera desactivada exitosamente',
    NOT_FOUND: 'Carrera no encontrada',
    DUPLICATE_CODE: 'Ya existe una carrera con ese código',
    REQUIRED_FIELDS: 'Nombre y código son requeridos'
  },

  // Materias
  SUBJECT: {
    RETRIEVED: 'Materias obtenidas exitosamente',
    RETRIEVED_ONE: 'Materia obtenida exitosamente',
    CREATED: 'Materia creada exitosamente',
    UPDATED: 'Materia actualizada exitosamente',
    DELETED: 'Materia desactivada exitosamente',
    NOT_FOUND: 'Materia no encontrada',
    DUPLICATE_CODE: 'Ya existe una materia con ese código'
  },

  // Inscripciones
  ENROLLMENT: {
    STUDENT_ENROLLED: 'Estudiante inscrito exitosamente',
    STUDENT_UNENROLLED: 'Estudiante desinscrito exitosamente',
    ALREADY_ENROLLED: 'El estudiante ya está inscrito',
    NOT_ENROLLED: 'El estudiante no está inscrito'
  },

  // Permisos
  PERMISSION: {
    DENIED: 'No tienes permisos para este recurso',
    INCOMPLETE_PROFILE: 'Debes completar tu perfil para acceder'
  },

  // Genéricos
  GENERIC: {
    SUCCESS: 'Operación exitosa',
    ERROR: 'Error en la operación',
    SERVER_ERROR: 'Error interno del servidor',
    NOT_FOUND: 'Recurso no encontrado',
    VALIDATION_ERROR: 'Error de validación'
  }
};

// Códigos de estado HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Tipos de plataforma
export const PLATFORM = {
  WEB: 'web',
  MOBILE: 'mobile'
};

export default {
  ROLES,
  TEACHER_EMAIL_KEYWORDS,
  AUTO_ASSIGNMENT,
  PROFILE_STATUS,
  MESSAGES,
  HTTP_STATUS,
  PAGINATION,
  PLATFORM
};
