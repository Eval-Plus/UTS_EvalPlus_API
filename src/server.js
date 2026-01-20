import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

// Verificar variables de entorno críticas al inicio
console.log('🔍 Verificando configuración...\n');

const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Faltan variables de entorno requeridas:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

// Verificar HUGGINGFACE_API_KEY (opcional pero recomendada)
if (!process.env.HUGGINGFACE_API_KEY) {
  console.warn('⚠️  HUGGINGFACE_API_KEY no configurada');
  console.warn('   El análisis de sentimiento usará modo fallback (keywords)\n');
} else {
  const keyPreview = process.env.HUGGINGFACE_API_KEY.substring(0, 10);
  console.log(`✅ HUGGINGFACE_API_KEY configurada (${keyPreview}...)\n`);
}

const server = app.listen(PORT, () => {
  console.log(`🚀 Eval+ API corriendo en puerto ${PORT}`);
  console.log(`📅 Iniciado: ${new Date().toISOString()}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📚 Endpoints principales:`);
  console.log(`   - http://localhost:${PORT}/api/health`);
  console.log(`   - http://localhost:${PORT}/api/test`);
  console.log(`   - http://localhost:${PORT}/api/sentiment/stats\n`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📛 SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
