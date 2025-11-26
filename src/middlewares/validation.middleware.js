/**
 * Middleware de validación reutilizable
 */

import { errorResponse } from '../utils/response.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';
import {
  parseId,
  isNonEmptyString,
  isNonEmptyArray
} from '../utils/helpers.js';

/**
 * Valida que el ID en los parámetros sea válido
 */
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      req.params[paramName] = parseId(id);
      next();
    } catch (error) {
      return errorResponse(
        res,
        `ID inválido en parámetro "${paramName}"`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  };
};

/**
 * Valida que los campos requeridos estén presentes en el body
 */
export const validateRequiredFields = (...fields) => {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      if (!req.body[field]) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return errorResponse(
        res,
        `Campos requeridos faltantes: ${missing.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    next();
  };
};

/**
 * Valida que un campo sea un string no vacío
 */
export const validateStringField = (fieldName) => {
  return (req, res, next) => {
    try {
      if (req.body[fieldName] !== undefined) {
        isNonEmptyString(req.body[fieldName], fieldName);
      }
      next();
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  };
};

/**
 * Valida que un campo sea un array no vacío
 */
export const validateArrayField = (fieldName) => {
  return (req, res, next) => {
    try {
      if (req.body[fieldName] !== undefined) {
        isNonEmptyArray(req.body[fieldName], fieldName);
      }
      next();
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  };
};

/**
 * Valida que al menos un campo esté presente
 */
export const validateAtLeastOne = (...fields) => {
  return (req, res, next) => {
    const hasAtLeastOne = fields.some(field =>
      req.body[field] !== undefined && req.body[field] !== null
    );

    if (!hasAtLeastOne) {
      return errorResponse(
        res,
        `Debe proporcionar al menos uno de estos campos: ${fields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    next();
  };
};

/**
 * Valida paginación en query params
 */
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1) {
    return errorResponse(
      res,
      'El número de página debe ser mayor a 0',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (limit < 1 || limit > 100) {
    return errorResponse(
      res,
      'El límite debe estar entre 1 y 100',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  req.pagination = { page, limit };
  next();
};

/**
 * Valida formato de email
 */
export const validateEmail = (fieldName = 'email') => {
  return (req, res, next) => {
    const email = req.body[fieldName];

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return errorResponse(
          res,
          `Email inválido en campo "${fieldName}"`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    next();
  };
};

export default {
  validateId,
  validateRequiredFields,
  validateStringField,
  validateArrayField,
  validateAtLeastOne,
  validatePagination,
  validateEmail
};
