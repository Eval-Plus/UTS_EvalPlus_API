require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Eval+ API corriendo en puerto ${PORT}`);
  console.log(`📅 Iniciado: ${new Date().toISOString()}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
