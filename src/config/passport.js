import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { AuthService } from '../services/auth.service.js';

/**
 * Configuración de Passport con estrategia de Microsoft
 */
passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_REDIRECT_URI,
      tenant: process.env.MICROSOFT_TENANT_ID,
      scope: ['user.read', 'profile', 'email', 'openid'],
      passReqToCallback: false
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Procesar el usuario con el servicio de autenticación
        const result = await AuthService.processOAuthUser(profile, accessToken);

        return done(null, result);
      } catch (error) {
        console.error('Error en estrategia de Microsoft:', error);
        return done(error, null);
      }
    }
  )
);

/**
 * Serialización del usuario (no necesario para JWT, pero requerido por Passport)
 */
passport.serializeUser((user, done) => {
  done(null, user);
});

/**
 * Deserialización del usuario
 */
passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
