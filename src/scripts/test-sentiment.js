/**
 * Script de prueba para el servicio de análisis de sentimiento con Hugging Face
 * Ejecutar: node src/scripts/test-sentiment.js
 */

import { SentimentAnalysisService } from '../services/ai/sentiment-analysis.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TestSentiment');

// Comentarios de prueba en español
const testComments = [
  // Positivos
  {
    text: "Excelente profesor, muy dedicado y comprometido con sus estudiantes",
    expected: "positive"
  },
  {
    text: "Me encanta su forma de enseñar, es muy claro y paciente",
    expected: "positive"
  },
  {
    text: "El mejor profesor que he tenido, aprendí muchísimo",
    expected: "positive"
  },
  {
    text: "Muy bueno, domina el tema y explica de manera sencilla",
    expected: "positive"
  },
  
  // Negativos
  {
    text: "No explica bien, es muy confuso y difícil de entender",
    expected: "negative"
  },
  {
    text: "Pésimo profesor, no se le entiende nada",
    expected: "negative"
  },
  {
    text: "No recomiendo esta materia con este profesor, muy malo",
    expected: "negative"
  },
  {
    text: "Horrible experiencia, no aprendí nada",
    expected: "negative"
  },
  
  // Neutrales
  {
    text: "Normal, cumple con lo básico",
    expected: "neutral"
  },
  {
    text: "Es un profesor promedio, nada especial",
    expected: "neutral"
  },
  {
    text: "Regular, algunos temas bien otros mal",
    expected: "neutral"
  },
  
  // Mixtos
  {
    text: "Bueno en teoría pero malo en práctica, no sabe transmitir conocimiento aunque lo domina",
    expected: "mixed"
  },
  {
    text: "Domina el tema pero es muy impaciente con los estudiantes",
    expected: "mixed"
  }
];

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRUEBA DE ANÁLISIS DE SENTIMIENTO CON HUGGING FACE API');
  console.log('='.repeat(70) + '\n');

  let totalTests = testComments.length;
  let correctPredictions = 0;
  let incorrectPredictions = 0;
  const results = [];

  try {
    // Verificar configuración
    logger.info('🔍 Verificando configuración...');
    const stats = SentimentAnalysisService.getStats();
    
    if (!stats.configured) {
      logger.error('❌ HUGGINGFACE_API_KEY no está configurada');
      logger.error('Por favor, configura la variable de entorno en tu archivo .env');
      process.exit(1);
    }
    
    logger.success('✅ Configuración válida');
    logger.info(`📊 Modelo: ${stats.model}`);
    logger.info(`🌐 API URL: ${stats.apiUrl}\n`);

    // Health check
    logger.info('🏥 Verificando estado de la API...');
    const health = await SentimentAnalysisService.healthCheck();
    
    if (health.status !== 'healthy') {
      logger.error('❌ La API no está disponible:', health.error);
      process.exit(1);
    }
    
    logger.success('✅ API disponible\n');

    // Ejecutar pruebas
    for (let i = 0; i < testComments.length; i++) {
      const { text, expected } = testComments[i];
      
      console.log(`\n📝 Test ${i + 1}/${totalTests}`);
      console.log(`Comentario: "${text}"`);
      console.log(`Esperado: ${expected.toUpperCase()}`);

      try {
        const startTime = Date.now();
        const result = await SentimentAnalysisService.analyzeComment(text);
        const duration = Date.now() - startTime;

        const isCorrect = result.sentiment === expected;
        
        if (isCorrect) {
          correctPredictions++;
          console.log(`✅ CORRECTO: ${result.sentiment.toUpperCase()}`);
        } else {
          incorrectPredictions++;
          console.log(`❌ INCORRECTO: ${result.sentiment.toUpperCase()}`);
        }

        console.log(`🎯 Confianza: ${(result.score * 100).toFixed(1)}%`);
        console.log(`📌 Label original: ${result.label || 'N/A'}`);
        console.log(`⚙️  Método: ${result.method}`);
        console.log(`⏱️  Tiempo: ${duration}ms`);

        results.push({
          text,
          expected,
          actual: result.sentiment,
          score: result.score,
          label: result.label,
          method: result.method,
          duration,
          correct: isCorrect
        });

        // Pequeña pausa entre solicitudes para no saturar la API
        if (i < testComments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        incorrectPredictions++;
        
        results.push({
          text,
          expected,
          actual: 'error',
          error: error.message,
          correct: false
        });
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE RESULTADOS');
    console.log('='.repeat(70));
    console.log(`Total de pruebas: ${totalTests}`);
    console.log(`✅ Correctas: ${correctPredictions} (${(correctPredictions / totalTests * 100).toFixed(1)}%)`);
    console.log(`❌ Incorrectas: ${incorrectPredictions} (${(incorrectPredictions / totalTests * 100).toFixed(1)}%)`);

    // Estadísticas de métodos
    const methodCounts = results.reduce((acc, r) => {
      if (r.method) {
        acc[r.method] = (acc[r.method] || 0) + 1;
      }
      return acc;
    }, {});

    console.log('\n📈 Métodos utilizados:');
    Object.entries(methodCounts).forEach(([method, count]) => {
      console.log(`  - ${method}: ${count} (${(count / totalTests * 100).toFixed(1)}%)`);
    });

    // Tiempo promedio (solo para método API)
    const apiResults = results.filter(r => r.method === 'huggingface' && r.duration);
    if (apiResults.length > 0) {
      const avgDuration = apiResults.reduce((sum, r) => sum + r.duration, 0) / apiResults.length;
      console.log(`\n⏱️  Tiempo promedio (API): ${avgDuration.toFixed(0)}ms`);
    }

    // Confianza promedio
    const avgConfidence = results
      .filter(r => r.score)
      .reduce((sum, r) => sum + r.score, 0) / results.filter(r => r.score).length;
    
    console.log(`🎯 Confianza promedio: ${(avgConfidence * 100).toFixed(1)}%`);

    // Detalles de errores
    const errors = results.filter(r => !r.correct);
    if (errors.length > 0) {
      console.log('\n⚠️  PREDICCIONES INCORRECTAS:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. "${err.text}"`);
        console.log(`   Esperado: ${err.expected} | Obtenido: ${err.actual}`);
        if (err.score) {
          console.log(`   Confianza: ${(err.score * 100).toFixed(1)}%`);
        }
        if (err.label) {
          console.log(`   Label: ${err.label}`);
        }
      });
    }

    // Distribución de labels
    const labelCounts = results.reduce((acc, r) => {
      if (r.label) {
        acc[r.label] = (acc[r.label] || 0) + 1;
      }
      return acc;
    }, {});

    if (Object.keys(labelCounts).length > 0) {
      console.log('\n📊 Distribución de labels del modelo:');
      Object.entries(labelCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([label, count]) => {
          console.log(`  - ${label}: ${count}`);
        });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Pruebas completadas');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    logger.error('Error ejecutando pruebas', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests()
  .then(() => {
    console.log('👋 Fin de las pruebas\n');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
