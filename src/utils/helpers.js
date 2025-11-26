/**
 * Funciones auxiliares reutilizables
 */

import { PLATFORM } from '../config/constants.js';

/**
 * Verifica si la petición viene de una app móvil
 * @param {Object} req - Request de Express
 * @returns {boolean}
 */
export const isMobileRequest = (req) => {
  return (
    req.headers['user-agent']?.includes('Flutter') ||
    req.query.platform === PLATFORM.MOBILE ||
    req.headers['x-platform'] === PLATFORM.MOBILE
  );
};

/**
 * Parsea un ID a entero de forma segura
 * @param {string|number} id - ID a parsear
 * @returns {number}
 */
export const parseId = (id) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed < 1) {
    throw new Error(`ID inválido: ${id}`);
  }
  return parsed;
};

/**
 * Parsea múltiples IDs de forma segura
 * @param {Array} ids - Array de IDs
 * @returns {Array<number>}
 */
export const parseIds = (ids) => {
  if (!Array.isArray(ids)) {
    throw new Error('Se esperaba un array de IDs');
  }
  return ids.map(id => parseId(id));
};

/**
 * Valida que un string no esté vacío
 * @param {string} str - String a validar
 * @param {string} fieldName - Nombre del campo (para el mensaje de error)
 * @returns {boolean}
 */
export const isNonEmptyString = (str, fieldName = 'Campo') => {
  if (typeof str !== 'string' || str.trim().length === 0) {
    throw new Error(`${fieldName} no puede estar vacío`);
  }
  return true;
};

/**
 * Valida que un array no esté vacío
 * @param {Array} arr - Array a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {boolean}
 */
export const isNonEmptyArray = (arr, fieldName = 'Campo') => {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`${fieldName} debe ser un array no vacío`);
  }
  return true;
};

/**
 * Crea un objeto de paginación
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @returns {Object}
 */
export const createPagination = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
  };
};

/**
 * Sanitiza un string removiendo caracteres peligrosos
 * @param {string} str - String a sanitizar
 * @param {number} maxLength - Longitud máxima
 * @returns {string}
 */
export const sanitizeString = (str, maxLength = 255) => {
  if (typeof str !== 'string') return '';

  return str
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, maxLength);
};

/**
 * Sanitiza un array de strings
 * @param {Array} arr - Array a sanitizar
 * @param {number} maxLength - Longitud máxima por string
 * @returns {Array}
 */
export const sanitizeStringArray = (arr, maxLength = 255) => {
  if (!Array.isArray(arr)) return [];

  return arr
    .map(item => sanitizeString(item, maxLength))
    .filter(item => item.length > 0);
};

/**
 * Genera un slug a partir de un string
 * @param {string} str - String a convertir
 * @returns {string}
 */
export const slugify = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Delay asíncrono (útil para testing)
 * @param {number} ms - Milisegundos
 * @returns {Promise}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ejecuta una función de forma segura y retorna un resultado o error
 * @param {Function} fn - Función a ejecutar
 * @returns {Object} { success, data, error }
 */
export const safeExecute = async (fn) => {
  try {
    const data = await fn();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error };
  }
};

/**
 * Filtra un objeto removiendo valores undefined o null
 * @param {Object} obj - Objeto a filtrar
 * @returns {Object}
 */
export const removeUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  );
};

/**
 * Genera un código aleatorio
 * @param {number} length - Longitud del código
 * @returns {string}
 */
export const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Agrupa un array de objetos por una propiedad
 * @param {Array} arr - Array a agrupar
 * @param {string} key - Propiedad por la cual agrupar
 * @returns {Object}
 */
export const groupBy = (arr, key) => {
  return arr.reduce((acc, obj) => {
    const groupKey = obj[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(obj);
    return acc;
  }, {});
};

/**
 * Ordena un array de objetos por una propiedad
 * @param {Array} arr - Array a ordenar
 * @param {string} key - Propiedad por la cual ordenar
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array}
 */
export const sortBy = (arr, key, order = 'asc') => {
  return [...arr].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

export default {
  isMobileRequest,
  parseId,
  parseIds,
  isNonEmptyString,
  isNonEmptyArray,
  createPagination,
  sanitizeString,
  sanitizeStringArray,
  slugify,
  delay,
  safeExecute,
  removeUndefined,
  generateRandomCode,
  groupBy,
  sortBy
};
