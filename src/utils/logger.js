/**
 * Sistema de logging mejorado
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const icons = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  debug: '🔍',
  auth: '🔐',
  user: '👤',
  teacher: '🧑‍🏫',
  student: '👨‍🎓',
  career: '🎓',
  subject: '📚',
  database: '💾',
  api: '🌐',
  process: '⚙️'
};

class Logger {
  constructor(module = 'App') {
    this.module = module;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Formatea el mensaje con timestamp y módulo
   */
  format(level, icon, message, data = null) {
    const timestamp = new Date().toISOString();
    const moduleTag = `[${this.module}]`;
    
    let output = `${timestamp} ${icon} ${level} ${moduleTag}: ${message}`;
    
    if (data && this.isDevelopment) {
      output += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    return output;
  }

  /**
   * Log de información
   */
  info(message, data = null) {
    console.log(
      colors.cyan + this.format('INFO', icons.info, message, data) + colors.reset
    );
  }

  /**
   * Log de éxito
   */
  success(message, data = null) {
    console.log(
      colors.green + this.format('SUCCESS', icons.success, message, data) + colors.reset
    );
  }

  /**
   * Log de advertencia
   */
  warn(message, data = null) {
    console.warn(
      colors.yellow + this.format('WARN', icons.warning, message, data) + colors.reset
    );
  }

  /**
   * Log de error
   */
  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined
    } : null;
    
    console.error(
      colors.red + this.format('ERROR', icons.error, message, errorData) + colors.reset
    );
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message, data = null) {
    if (this.isDevelopment) {
      console.log(
        colors.dim + this.format('DEBUG', icons.debug, message, data) + colors.reset
      );
    }
  }

  /**
   * Logs específicos por contexto
   */
  auth(message, data = null) {
    console.log(
      colors.magenta + this.format('AUTH', icons.auth, message, data) + colors.reset
    );
  }

  user(message, data = null) {
    console.log(
      colors.blue + this.format('USER', icons.user, message, data) + colors.reset
    );
  }

  teacher(message, data = null) {
    console.log(
      colors.blue + this.format('TEACHER', icons.teacher, message, data) + colors.reset
    );
  }

  student(message, data = null) {
    console.log(
      colors.blue + this.format('STUDENT', icons.student, message, data) + colors.reset
    );
  }

  database(message, data = null) {
    console.log(
      colors.cyan + this.format('DB', icons.database, message, data) + colors.reset
    );
  }

  api(message, data = null) {
    console.log(
      colors.green + this.format('API', icons.api, message, data) + colors.reset
    );
  }
}

/**
 * Factory para crear loggers por módulo
 */
export const createLogger = (module) => new Logger(module);

/**
 * Logger global por defecto
 */
export const logger = new Logger('EvalPlus');

export default logger;
