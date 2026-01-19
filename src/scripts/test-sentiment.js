/**
 * Script de prueba para el servicio de análisis de sentimiento
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
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PRUEBA DE ANÁLISIS DE SENTIMIENTO');
  console.log('='.repeat(60) + '\n');

  let totalTests = testComments.length;
  let correctPredictions = 0;
  let incorrectPredictions = 0;
  const results = [];

  try {
    // Precargar modelo
    logger.info('⏳ Cargando modelo de IA...');
    await SentimentAnalysisService.loadModel();
    logger.success('✅ Modelo cargado\n');

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

        console.log(`Confianza: ${(result.score * 100).toFixed(1)}%`);
        console.log(`Método: ${result.method}`);
        console.log(`Tiempo: ${duration}ms`);

        results.push({
          text,
          expected,
          actual: result.sentiment,
          score: result.score,
          method: result.method,
          duration,
          correct: isCorrect
        });

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
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE RESULTADOS');
    console.log('='.repeat(60));
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

    // Tiempo promedio
    const avgDuration = results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`\n⏱️ Tiempo promedio: ${avgDuration.toFixed(0)}ms`);

    // Confianza promedio
    const avgConfidence = results
      .filter(r => r.score)
      .reduce((sum, r) => sum + r.score, 0) / results.filter(r => r.score).length;
    
    console.log(`🎯 Confianza promedio: ${(avgConfidence * 100).toFixed(1)}%`);

    // Detalles de errores
    const errors = results.filter(r => !r.correct);
    if (errors.length > 0) {
      console.log('\n⚠️ PREDICCIONES INCORRECTAS:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. "${err.text}"`);
        console.log(`   Esperado: ${err.expected} | Obtenido: ${err.actual}`);
        if (err.score) {
          console.log(`   Confianza: ${(err.score * 100).toFixed(1)}%`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Pruebas completadas');
    console.log('='.repeat(60) + '\n');

    // Liberar recursos
    await SentimentAnalysisService.dispose();

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
