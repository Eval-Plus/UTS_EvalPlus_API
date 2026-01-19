/**
 * Servicio de Análisis de Sentimiento con IA
 * Utiliza Transformers.js para analizar comentarios de estudiantes
 */

import { pipeline } from '@xenova/transformers';
import { StudentEvaluationModel } from '../../models/student-evaluation.model.js';
import { createLogger } from '../../utils/logger.js';
import { AI_CONFIG, SENTIMENT_TYPES, SENTIMENT_THRESHOLDS } from '../../config/constants.js';

const logger = createLogger('SentimentAnalysisService');

class SentimentAnalysisService {
  constructor() {
    this.classifier = null;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * Inicializa el modelo de IA (lazy loading)
   * @returns {Promise<void>}
   */
  async loadModel() {
    if (this.classifier) {
      return this.classifier;
    }

    if (this.isLoading) {
      logger.info('Modelo ya se está cargando, esperando...');
      return this.loadPromise;
    }

    this.isLoading = true;
    logger.info('🤖 Iniciando carga del modelo de análisis de sentimiento...');

    try {
      this.loadPromise = pipeline(
        'sentiment-analysis',
        AI_CONFIG.MODEL_NAME_ES, // Usamos el modelo multilingüe
        {
          cache_dir: AI_CONFIG.CACHE_DIR,
        }
      );

      this.classifier = await this.loadPromise;
      logger.success('✅ Modelo de IA cargado exitosamente');
      this.isLoading = false;
      
      return this.classifier;
    } catch (error) {
      this.isLoading = false;
      logger.error('Error cargando modelo de IA', error);
      throw new Error('No se pudo cargar el modelo de análisis de sentimiento');
    }
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
      .toLowerCase()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .replace(/[^\w\sáéíóúñü.,!?-]/gi, ''); // Mantener caracteres válidos en español

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
   * @param {string} label - Label del modelo
   * @returns {string} Tipo de sentimiento
   */
  mapLabelToSentiment(label) {
    const upperLabel = label.toUpperCase();
    return AI_CONFIG.LABEL_MAPPING[upperLabel] || SENTIMENT_TYPES.NEUTRAL;
  }

  /**
   * Analiza el sentimiento de un comentario usando IA
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

      // Intentar detección rápida primero
      const quickResult = this.quickSentimentDetection(processedComment);
      if (quickResult && quickResult.score >= SENTIMENT_THRESHOLDS.MEDIUM_CONFIDENCE) {
        logger.info(`✅ Sentimiento detectado por keywords: ${quickResult.sentiment}`);
        return quickResult;
      }

      // Cargar modelo si no está cargado
      await this.loadModel();

      // Analizar con IA
      logger.info('🤖 Analizando con modelo de IA...');
      
      const startTime = Date.now();
      const results = await Promise.race([
        this.classifier(processedComment),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), AI_CONFIG.ANALYSIS_TIMEOUT)
        )
      ]);
      
      const duration = Date.now() - startTime;
      logger.info(`⏱️ Análisis completado en ${duration}ms`);

      // Procesar resultados
      if (!results || results.length === 0) {
        throw new Error('No se obtuvieron resultados del modelo');
      }

      const result = results[0];
      const sentiment = this.mapLabelToSentiment(result.label);
      const score = result.score;

      logger.success(`✅ Sentimiento: ${sentiment} (${(score * 100).toFixed(1)}% confianza)`);

      return {
        sentiment,
        score: parseFloat(score.toFixed(3)),
        method: 'ai',
        label: result.label,
        duration
      };

    } catch (error) {
      logger.error('Error analizando sentimiento con IA', error);

      // Fallback a detección por keywords
      const quickResult = this.quickSentimentDetection(comment);
      if (quickResult) {
        logger.warn('⚠️ Usando detección por keywords como fallback');
        return quickResult;
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
          label: analysis.label
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
      results: []
    };

    // Cargar modelo una sola vez
    await this.loadModel();

    for (const evaluation of evaluations) {
      try {
        const result = await this.analyzeAndUpdate(
          evaluation.id,
          evaluation.comentario
        );

        results.success++;
        results.results.push({
          id: evaluation.id,
          success: true,
          sentiment: result.sentiment,
          score: result.sentimentScore
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

    logger.success(
      `✅ Análisis en lote completado: ${results.success} exitosos, ${results.failed} fallidos`
    );

    return results;
  }

  /**
   * Obtiene estadísticas del servicio
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      modelLoaded: !!this.classifier,
      isLoading: this.isLoading,
      modelName: AI_CONFIG.MODEL_NAME_ES,
      cacheDir: AI_CONFIG.CACHE_DIR
    };
  }

  /**
   * Libera recursos del modelo (útil para testing o shutdown)
   */
  async dispose() {
    if (this.classifier) {
      logger.info('🧹 Liberando recursos del modelo de IA');
      this.classifier = null;
      this.isLoading = false;
      this.loadPromise = null;
    }
  }
}

// Singleton instance
const sentimentAnalysisService = new SentimentAnalysisService();

export { sentimentAnalysisService as SentimentAnalysisService };
export default sentimentAnalysisService;
