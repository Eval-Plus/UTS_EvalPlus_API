import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT para un usuario
 * @param {Object} payload - Datos del user
 * @returns {String} Token JWT
 */
export const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};
