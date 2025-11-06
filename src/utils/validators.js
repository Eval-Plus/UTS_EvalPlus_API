/**
 * Validadores para datos de entrada
 */

/**
 * Valida que un email tenga formato correcto
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida que la identificación tenga formato válido
 * Ajusta según las reglas de tu país
 */
export const isValidIdentificacion = (identificacion) => {
  // Ejemplo: entre 6 y 15 caracteres alfanuméricos
  const idRegex = /^[a-zA-Z0-9]{6,15}$/;
  return idRegex.test(identificacion);
};

/**
 * Valida que un array de strings no esté vacío y todos sean válidos
 */
export const isValidStringArray = (arr, minLength = 1, maxLength = 50) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return false;
  }

  return arr.every(item => {
    return typeof item === 'string' && 
           item.trim().length >= minLength && 
           item.trim().length <= maxLength;
  });
};

/**
 * Sanitiza un string removiendo caracteres especiales peligrosos
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .substring(0, 255); // Limitar longitud
};

/**
 * Sanitiza un array de strings
 */
export const sanitizeStringArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0)
    .slice(0, 50); // Máximo 50 items
};

/**
 * Valida datos de actualización de perfil
 */
export const validateProfileUpdate = (data) => {
  const errors = [];

  if (data.identificacion !== undefined) {
    if (!data.identificacion || data.identificacion.trim().length === 0) {
      errors.push('La identificación no puede estar vacía');
    } else if (!isValidIdentificacion(data.identificacion)) {
      errors.push('La identificación debe tener entre 6 y 15 caracteres alfanuméricos');
    }
  }

  if (data.carreras !== undefined) {
    if (!Array.isArray(data.carreras)) {
      errors.push('Las carreras deben ser un array');
    } else if (data.carreras.length === 0) {
      errors.push('Debe proporcionar al menos una carrera');
    } else if (!isValidStringArray(data.carreras)) {
      errors.push('Todas las carreras deben ser strings válidos');
    } else if (data.carreras.length > 10) {
      errors.push('No puede tener más de 10 carreras');
    }
  }

  if (data.materias !== undefined) {
    if (!Array.isArray(data.materias)) {
      errors.push('Las materias deben ser un array');
    } else if (data.materias.length === 0) {
      errors.push('Debe proporcionar al menos una materia');
    } else if (!isValidStringArray(data.materias)) {
      errors.push('Todas las materias deben ser strings válidos');
    } else if (data.materias.length > 50) {
      errors.push('No puede tener más de 50 materias');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
