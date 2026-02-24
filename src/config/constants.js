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

// Palabras clave para detectar administradores en emails
export const ADMIN_EMAIL_KEYWORDS = ['admin', 'administrador', 'administrator', 'director', 'coordinador'];

// Tipos de sentimiento
export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  MIXED: 'mixed'
};

// Umbrales de puntuación de sentimiento
export const SENTIMENT_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.8,      // Confianza alta
  MEDIUM_CONFIDENCE: 0.6,    // Confianza media
  LOW_CONFIDENCE: 0.4        // Confianza baja
};

// Configuración del modelo de generación de texto (LLaMA vía Hugging Face)
export const AI_GENERATION_CONFIG = {
  MODEL_NAME: 'meta-llama/Llama-3.2-3B-Instruct:hyperbolic',
  BASE_URL: 'https://router.huggingface.co/v1',

  REQUEST_TIMEOUT: 60000, // 60 segundos (generación es más lenta)
  MAX_RETRIES: 2,
  RETRY_DELAY: 3000,

  MAX_TOKENS: 1500,
  TEMPERATURE: 0.7,

  // Umbrales para clasificar el promedio general del docente
  SCORE_THRESHOLDS: {
    EXCELLENT: 4.5,
    GOOD: 3.5,
    AVERAGE: 2.5,
  },
};

// Configuración del modelo de IA (Hugging Face)
export const AI_CONFIG = {
  // Modelo de análisis de sentimiento en español (Hugging Face)
  MODEL_NAME: 'nlptown/bert-base-multilingual-uncased-sentiment',

  // API de Hugging Face (URL actualizada - Enero 2026)
  API_URL: 'https://router.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment',

  // Timeouts y reintentos
  REQUEST_TIMEOUT: 30000, // 30 segundos
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 segundos entre reintentos

  // Configuración de procesamiento
  MAX_COMMENT_LENGTH: 512, // Máximo de caracteres
  MIN_COMMENT_LENGTH: 5,   // Mínimo de caracteres para analizar

  // Mapeo de labels del modelo nlptown a nuestros tipos
  // Este modelo retorna: "1 star", "2 stars", "3 stars", "4 stars", "5 stars"
  LABEL_MAPPING: {
    '1 star': SENTIMENT_TYPES.NEGATIVE,   // Muy negativo
    '2 stars': SENTIMENT_TYPES.NEGATIVE,  // Negativo
    '3 stars': SENTIMENT_TYPES.NEUTRAL,   // Neutral
    '4 stars': SENTIMENT_TYPES.POSITIVE,  // Positivo
    '5 stars': SENTIMENT_TYPES.POSITIVE,  // Muy positivo
  },

  // Palabras clave para detección rápida (fallback)
  POSITIVE_KEYWORDS: [
    'excelente', 'muy bueno', 'genial', 'increíble', 'fantástico',
    'dedicado', 'claro', 'comprensible', 'paciente', 'atento',
    'recomiendo', 'mejor profesor', 'aprendí mucho', 'explica bien',
    'enseña bien', 'motivador', 'inspirador'
  ],
  NEGATIVE_KEYWORDS: [
    'malo', 'pésimo', 'terrible', 'horrible', 'confuso',
    'no explica', 'difícil', 'aburrido', 'no entiende',
    'no recomiendo', 'peor profesor', 'perdida de tiempo',
    'no aprendí', 'desorganizado'
  ],

  // Configuración de batch processing
  BATCH_SIZE: 10, // Procesar 10 comentarios a la vez
  BATCH_DELAY: 1000, // 1 segundo entre lotes
};

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

  // Sentimientos
  SENTIMENT: {
    ANALYZED: 'Análisis de sentimiento completado',
    UPDATED: 'Sentimiento actualizado exitosamente',
    BATCH_ANALYZED: 'Análisis de sentimientos en lote completado',
    NO_COMMENT: 'No hay comentario para analizar',
    ALREADY_ANALYZED: 'Este comentario ya fue analizado',
    ANALYSIS_FAILED: 'Error en el análisis de sentimiento',
    ANALYSIS_STARTED: 'Análisis de sentimiento iniciado en segundo plano',
    MODEL_LOADING: 'Cargando modelo de IA...',
    MODEL_READY: 'API de Hugging Face lista',
    API_ERROR: 'Error comunicándose con la API de Hugging Face',
    RATE_LIMIT: 'Límite de solicitudes alcanzado, intenta más tarde'
  },

  AI_ANALYSIS: {
    GENERATED: 'Análisis de IA generado exitosamente',
    RETRIEVED: 'Análisis de IA obtenido exitosamente',
    NOT_FOUND: 'No se encontró análisis de IA para este docente en el período',
    GENERATION_FAILED: 'Error al generar el análisis de IA',
    NO_DATA: 'El docente no tiene suficientes datos para generar un análisis',
    GENERATING: 'Generando análisis de IA...',
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
  TOO_MANY_REQUESTS: 429,
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
  ADMIN_EMAIL_KEYWORDS,
  SENTIMENT_TYPES,
  SENTIMENT_THRESHOLDS,
  AI_GENERATION_CONFIG,
  AI_CONFIG,
  AUTO_ASSIGNMENT,
  PROFILE_STATUS,
  MESSAGES,
  HTTP_STATUS,
  PAGINATION,
  PLATFORM
};
