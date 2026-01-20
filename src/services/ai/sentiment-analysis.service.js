/**
 * Servicio de Análisis de Sentimiento con Hugging Face API
 * Utiliza la API de Hugging Face para analizar comentarios de estudiantes
 */

import { HuggingFaceClient } from './huggingface-client.service.js';
import { StudentEvaluationModel } from '../../models/student-evaluation.model.js';
import { createLogger } from '../../utils/logger.js';
import { AI_CONFIG, SENTIMENT_TYPES, SENTIMENT_THRESHOLDS } from '../../config/constants.js';

const logger = createLogger('SentimentAnalysisService');

class SentimentAnalysisService {
  constructor() {
    this.client = HuggingFaceClient;
  }

  /**
   * Preprocesa el comentario antes del análisis
   * @param {string} comment - Comentario a preprocesar
   * @returns {string} Comentario procesado
   */
  preprocessComment(comment) {
    if (!comment || typeof comment !== 'string') {
      return '';
    }

    // Limpiar y normalizar
    let processed = comment
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ.,!?¿¡\-]/gi, ''); // Mantener caracteres válidos

    // Truncar si es muy largo
    if (processed.length > AI_CONFIG.MAX_COMMENT_LENGTH) {
      processed = processed.substring(0, AI_CONFIG.MAX_COMMENT_LENGTH);
      logger.warn(`Comentario truncado a ${AI_CONFIG.MAX_COMMENT_LENGTH} caracteres`);
    }

    return processed;
  }

  /**
   * Detecta sentimiento usando palabras clave (fallback rápido)
   * @param {string} comment - Comentario a analizar
   * @returns {Object|null} Resultado del análisis o null
   */
  quickSentimentDetection(comment) {
    const lowerComment = comment.toLowerCase();
    
    const positiveCount = AI_CONFIG.POSITIVE_KEYWORDS.filter(
      keyword => lowerComment.includes(keyword)
    ).length;
    
    const negativeCount = AI_CONFIG.NEGATIVE_KEYWORDS.filter(
      keyword => lowerComment.includes(keyword)
    ).length;

    // Si hay palabras clave claras
    if (positiveCount > 0 || negativeCount > 0) {
      if (positiveCount > negativeCount * 2) {
        return {
          sentiment: SENTIMENT_TYPES.POSITIVE,
          score: 0.75,
          method: 'keyword'
        };
      }
      
      if (negativeCount > positiveCount * 2) {
        return {
          sentiment: SENTIMENT_TYPES.NEGATIVE,
          score: 0.75,
          method: 'keyword'
        };
      }

      // Si hay ambos tipos, es mixto
      if (positiveCount > 0 && negativeCount > 0) {
        return {
          sentiment: SENTIMENT_TYPES.MIXED,
          score: 0.60,
          method: 'keyword'
        };
      }
    }

    return null;
  }

  /**
   * Mapea el label del modelo a nuestro sistema
   * El modelo nlptown retorna: "1 star", "2 stars", "3 stars", "4 stars", "5 stars"
   * @param {string} label - Label del modelo
   * @returns {string} Tipo de sentimiento
   */
  mapLabelToSentiment(label) {
    return AI_CONFIG.LABEL_MAPPING[label] || SENTIMENT_TYPES.NEUTRAL;
  }

  /**
   * Encuentra el resultado con mayor score
   * @param {Array} results - Resultados de la API
   * @returns {Object} Resultado con mayor score
   */
  getBestResult(results) {
    if (!results || results.length === 0) {
      throw new Error('No se recibieron resultados del modelo');
    }

    // Ordenar por score descendente y tomar el primero
    const sorted = [...results].sort((a, b) => b.score - a.score);
    return sorted[0];
  }

  /**
   * Analiza el sentimiento de un comentario usando Hugging Face API
   * @param {string} comment - Comentario a analizar
   * @returns {Promise<Object>} Resultado del análisis
   */
  async analyzeComment(comment) {
    try {
      // Validar comentario
      if (!comment || comment.trim().length < AI_CONFIG.MIN_COMMENT_LENGTH) {
        logger.warn('Comentario muy corto o vacío');
        return {
          sentiment: SENTIMENT_TYPES.NEUTRAL,
          score: 0.5,
          method: 'default'
        };
      }

      // Preprocesar
      const processedComment = this.preprocessComment(comment);
      
      if (processedComment.length < AI_CONFIG.MIN_COMMENT_LENGTH) {
        logger.warn('Comentario procesado muy corto');
        return {
          sentiment: SENTIMENT_TYPES.NEUTRAL,
          score: 0.5,
          method: 'default'
        };
      }

      // Intentar detección rápida primero (opcional, para ahorrar llamadas a la API)
      const quickResult = this.quickSentimentDetection(processedComment);
      if (quickResult && quickResult.score >= SENTIMENT_THRESHOLDS.HIGH_CONFIDENCE) {
        logger.info(`✅ Sentimiento detectado por keywords: ${quickResult.sentiment}`);
        return quickResult;
      }

      // Verificar configuración de la API
      if (!this.client.isConfigured()) {
        logger.warn('⚠️ API de Hugging Face no configurada, usando fallback');
        
        if (quickResult) {
          return quickResult;
        }
        
        return {
          sentiment: SENTIMENT_TYPES.NEUTRAL,
          score: 0.5,
          method: 'fallback',
          error: 'API no configurada'
        };
      }

      // Analizar con Hugging Face API
      logger.info('🤖 Analizando con Hugging Face API...');
      
      const startTime = Date.now();
      const apiResponse = await this.client.analyzeSentiment(processedComment);
      const duration = Date.now() - startTime;

      // Procesar resultados
      const bestResult = this.getBestResult(apiResponse.results);
      const sentiment = this.mapLabelToSentiment(bestResult.label);
      const score = bestResult.score;

      logger.success(
        `✅ Sentimiento: ${sentiment} (${bestResult.label}) - ` +
        `${(score * 100).toFixed(1)}% confianza - ${duration}ms`
      );

      return {
        sentiment,
        score: parseFloat(score.toFixed(3)),
        method: 'huggingface',
        label: bestResult.label,
        duration,
        allScores: apiResponse.results // Para debugging
      };

    } catch (error) {
      logger.error('Error analizando sentimiento con API', error);

      // Fallback a detección por keywords
      const quickResult = this.quickSentimentDetection(comment);
      if (quickResult) {
        logger.warn('⚠️ Usando detección por keywords como fallback');
        return {
          ...quickResult,
          error: error.message
        };
      }

      // Fallback final: neutral
      logger.warn('⚠️ Usando sentimiento neutral como fallback');
      return {
        sentiment: SENTIMENT_TYPES.NEUTRAL,
        score: 0.5,
        method: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Analiza y actualiza el sentimiento de una evaluación de estudiante
   * @param {number} studentEvaluationId - ID de la evaluación del estudiante
   * @param {string} comment - Comentario a analizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async analyzeAndUpdate(studentEvaluationId, comment) {
    try {
      logger.info(`🔍 Analizando comentario de evaluación ${studentEvaluationId}`);

      // Analizar sentimiento
      const analysis = await this.analyzeComment(comment);

      // Actualizar en base de datos
      const updated = await StudentEvaluationModel.updateSentiment(
        studentEvaluationId,
        analysis.sentiment,
        analysis.score
      );

      logger.success(
        `✅ Sentimiento actualizado: ${analysis.sentiment} ` +
        `(${(analysis.score * 100).toFixed(1)}% confianza, método: ${analysis.method})`
      );

      return {
        ...updated,
        analysis: {
          method: analysis.method,
          duration: analysis.duration,
          label: analysis.label,
          error: analysis.error
        }
      };

    } catch (error) {
      logger.error(`Error en análisis y actualización de evaluación ${studentEvaluationId}`, error);
      throw error;
    }
  }

  /**
   * Analiza múltiples comentarios en lote
   * @param {Array<Object>} evaluations - Array de {id, comentario}
   * @returns {Promise<Object>} Resultado del análisis en lote
   */
  async analyzeBatch(evaluations) {
    logger.info(`📊 Analizando ${evaluations.length} comentarios en lote`);

    const results = {
      total: evaluations.length,
      success: 0,
      failed: 0,
      skipped: 0,
      results: []
    };

    // Procesar en lotes para no saturar la API
    const batchSize = AI_CONFIG.BATCH_SIZE;
    const batches = [];
    
    for (let i = 0; i < evaluations.length; i += batchSize) {
      batches.push(evaluations.slice(i, i + batchSize));
    }

    logger.info(`📦 Procesando ${batches.length} lotes de ${batchSize} comentarios`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`📦 Procesando lote ${i + 1}/${batches.length}`);

      for (const evaluation of batch) {
        try {
          // Verificar que tenga comentario
          if (!evaluation.comentario || evaluation.comentario.trim().length === 0) {
            logger.warn(`Evaluación ${evaluation.id} no tiene comentario, omitiendo`);
            results.skipped++;
            results.results.push({
              id: evaluation.id,
              success: false,
              skipped: true,
              reason: 'Sin comentario'
            });
            continue;
          }

          const result = await this.analyzeAndUpdate(
            evaluation.id,
            evaluation.comentario
          );

          results.success++;
          results.results.push({
            id: evaluation.id,
            success: true,
            sentiment: result.sentiment,
            score: result.sentimentScore,
            method: result.analysis?.method
          });

        } catch (error) {
          results.failed++;
          results.results.push({
            id: evaluation.id,
            success: false,
            error: error.message
          });

          logger.error(`Error analizando evaluación ${evaluation.id}`, error);
        }
      }

      // Esperar entre lotes para no saturar la API
      if (i < batches.length - 1) {
        logger.info(`⏳ Esperando ${AI_CONFIG.BATCH_DELAY}ms antes del siguiente lote...`);
        await new Promise(resolve => setTimeout(resolve, AI_CONFIG.BATCH_DELAY));
      }
    }

    logger.success(
      `✅ Análisis en lote completado: ${results.success} exitosos, ` +
      `${results.failed} fallidos, ${results.skipped} omitidos`
    );

    return results;
  }

  /**
   * Verifica el estado del servicio
   * @returns {Promise<Object>} Estado del servicio
   */
  async healthCheck() {
    try {
      const apiHealth = await this.client.healthCheck();
      
      return {
        status: apiHealth.status,
        api: apiHealth,
        config: {
          model: AI_CONFIG.MODEL_NAME,
          maxRetries: AI_CONFIG.MAX_RETRIES,
          timeout: AI_CONFIG.REQUEST_TIMEOUT
        }
      };
    } catch (error) {
      logger.error('Error en health check', error);
      
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Obtiene estadísticas del servicio
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      configured: this.client.isConfigured(),
      model: AI_CONFIG.MODEL_NAME,
      apiUrl: AI_CONFIG.API_URL,
      maxCommentLength: AI_CONFIG.MAX_COMMENT_LENGTH,
      minCommentLength: AI_CONFIG.MIN_COMMENT_LENGTH,
      batchSize: AI_CONFIG.BATCH_SIZE
    };
  }
}

// Singleton instance
const sentimentAnalysisService = new SentimentAnalysisService();

export { sentimentAnalysisService as SentimentAnalysisService };
export default sentimentAnalysisService;
