import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifica el token de Google y obtiene la información del usuario
 * @param {string} token - ID Token de Google
 * @returns {Promise<Object>} Información del usuario
 */
export const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      googleId: payload.sub,
      email: payload.email,
      nombreCompleto: payload.name,
      profilePicture: payload.picture,
      emailVerified: payload.email_verified
    };
  } catch (error) {
    throw new Error('Token de Google inválido');
  }
};

export default client;
