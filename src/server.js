import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Eval+ API corriendo en puerto ${PORT}`);
  console.log(`📅 Iniciado: ${new Date().toISOString()}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre de graceful
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
