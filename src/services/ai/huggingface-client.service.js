/**
 * Cliente para la API de Hugging Face
 * Maneja las comunicaciones con el servicio de inferencia usando el SDK oficial
 */

import { HfInference } from '@huggingface/inference';
import { createLogger } from '../../utils/logger.js';
import { AI_CONFIG } from '../../config/constants.js';

const logger = createLogger('HuggingFaceClient');

class HuggingFaceClient {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.modelName = AI_CONFIG.MODEL_NAME;
    this.maxRetries = AI_CONFIG.MAX_RETRIES;
    this.retryDelay = AI_CONFIG.RETRY_DELAY;

    // Inicializar cliente de Hugging Face Inference
    if (this.apiKey) {
      this.client = new HfInference(this.apiKey);
      logger.success('✅ Cliente de Hugging Face Inference inicializado');
    } else {
      this.client = null;
      logger.error('⚠️ HUGGINGFACE_API_KEY no está configurada en las variables de entorno');
    }
  }

  /**
   * Verifica si la API está configurada correctamente
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey && !!this.client;
  }

  /**
   * Espera un tiempo determinado (para reintentos)
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise<void>}
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Realiza una solicitud a la API con reintentos
   * @param {string} text - Texto a analizar
   * @param {number} attempt - Número de intento actual
   * @returns {Promise<Array>} Respuesta de la API
   */
  async makeRequest(text, attempt = 1) {
    try {
      logger.info(`🌐 Enviando solicitud a Hugging Face (intento ${attempt}/${this.maxRetries})`);

      const startTime = Date.now();
      
      // Usar el SDK oficial de Hugging Face
      const result = await this.client.textClassification({
        model: this.modelName,
        inputs: text
      });

      const duration = Date.now() - startTime;

      logger.success(`✅ Respuesta recibida de Hugging Face en ${duration}ms`);
      return result;

    } catch (error) {
      // Modelo cargándose
      if (error.message?.includes('loading') || error.message?.includes('currently loading')) {
        logger.warn(`⏳ Modelo cargándose... Esperando antes de reintentar`);
        
        if (attempt < this.maxRetries) {
          const waitTime = this.retryDelay * attempt;
          await this.sleep(waitTime);
          return this.makeRequest(text, attempt + 1);
        }
        
        throw new Error('MODEL_LOADING');
      }

      // Rate limit
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        logger.error('⚠️ Límite de solicitudes alcanzado');
        throw new Error('RATE_LIMIT');
      }

      // Error de autenticación
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        logger.error('🔐 Error de autenticación - Verifica tu API key');
        throw new Error('AUTH_ERROR');
      }

      // Timeout o error de red
      if (error.message?.includes('timeout') || error.message?.includes('ECONNABORTED')) {
        logger.error('⏱️ Timeout en la solicitud');
        
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest(text, attempt + 1);
        }
        
        throw new Error('TIMEOUT');
      }

      // Error de red genérico
      if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
        logger.error('🌐 Error de red - No se pudo conectar con Hugging Face');
        
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest(text, attempt + 1);
        }
        
        throw new Error('NETWORK_ERROR');
      }

      // Error desconocido
      logger.error('❌ Error en la solicitud:', error.message);
      
      // Reintentar si aún quedan intentos
      if (attempt < this.maxRetries) {
        logger.warn(`🔄 Reintentando (${attempt}/${this.maxRetries})...`);
        await this.sleep(this.retryDelay * attempt);
        return this.makeRequest(text, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Analiza el sentimiento de un texto
   * @param {string} text - Texto a analizar
   * @returns {Promise<Object>} Resultados del análisis
   */
  async analyzeSentiment(text) {
    if (!this.isConfigured()) {
      throw new Error('HUGGINGFACE_API_KEY no está configurada');
    }

    if (!text || typeof text !== 'string') {
      throw new Error('El texto debe ser un string válido');
    }

    // Truncar si es muy largo
    const truncatedText = text.length > AI_CONFIG.MAX_COMMENT_LENGTH
      ? text.substring(0, AI_CONFIG.MAX_COMMENT_LENGTH)
      : text;

    logger.info(`📝 Analizando texto de ${truncatedText.length} caracteres`);

    const startTime = Date.now();
    const results = await this.makeRequest(truncatedText);
    const duration = Date.now() - startTime;

    logger.info(`⏱️ Análisis completado en ${duration}ms`);

    return {
      results, // Array de resultados del modelo
      duration,
      textLength: truncatedText.length
    };
  }

  /**
   * Verifica el estado de la API
   * @returns {Promise<Object>} Estado de la API
   */
  async healthCheck() {
    try {
      logger.info('🏥 Verificando estado de la API...');
      
      if (!this.isConfigured()) {
        return {
          status: 'unhealthy',
          configured: false,
          error: 'API key no configurada'
        };
      }

      const testText = 'Este es un texto de prueba';
      await this.analyzeSentiment(testText);
      
      logger.success('✅ API de Hugging Face funcionando correctamente');
      
      return {
        status: 'healthy',
        configured: true,
        model: this.modelName
      };
    } catch (error) {
      logger.error('❌ Error en health check:', error.message);
      
      return {
        status: 'unhealthy',
        configured: this.isConfigured(),
        error: error.message
      };
    }
  }

  /**
   * Obtiene información sobre el servicio
   * @returns {Object} Información del servicio
   */
  getInfo() {
    return {
      configured: this.isConfigured(),
      model: this.modelName,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };
  }
}

// Singleton instance
const huggingFaceClient = new HuggingFaceClient();

export { huggingFaceClient as HuggingFaceClient };
export default huggingFaceClient;
