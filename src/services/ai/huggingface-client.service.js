/**
 * Cliente para la API de Hugging Face
 * Maneja las comunicaciones con el servicio de inferencia
 */

import axios from 'axios';
import { createLogger } from '../../utils/logger.js';
import { AI_CONFIG } from '../../config/constants.js';

const logger = createLogger('HuggingFaceClient');

class HuggingFaceClient {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.apiUrl = AI_CONFIG.API_URL;
    this.requestTimeout = AI_CONFIG.REQUEST_TIMEOUT;
    this.maxRetries = AI_CONFIG.MAX_RETRIES;
    this.retryDelay = AI_CONFIG.RETRY_DELAY;

    if (!this.apiKey) {
      logger.error('⚠️ HUGGINGFACE_API_KEY no está configurada en las variables de entorno');
    }
  }

  /**
   * Verifica si la API está configurada correctamente
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
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
   * @returns {Promise<Object>} Respuesta de la API
   */
  async makeRequest(text, attempt = 1) {
    try {
      logger.info(`🌐 Enviando solicitud a Hugging Face (intento ${attempt}/${this.maxRetries})`);

      const response = await axios.post(
        this.apiUrl,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.requestTimeout
        }
      );

      logger.success('✅ Respuesta recibida de Hugging Face');
      return response.data;

    } catch (error) {
      // Manejo de errores específicos
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Modelo cargándose (503)
        if (status === 503 && data?.error?.includes('loading')) {
          logger.warn(`⏳ Modelo cargándose... Esperando ${data.estimated_time || 20}s`);
          
          if (attempt < this.maxRetries) {
            const waitTime = data.estimated_time 
              ? Math.min(data.estimated_time * 1000, 30000) 
              : this.retryDelay * attempt;
            
            await this.sleep(waitTime);
            return this.makeRequest(text, attempt + 1);
          }
        }

        // Rate limit (429)
        if (status === 429) {
          logger.error('⚠️ Límite de solicitudes alcanzado');
          throw new Error('RATE_LIMIT');
        }

        // Error de autenticación (401)
        if (status === 401) {
          logger.error('🔐 Error de autenticación - Verifica tu API key');
          throw new Error('AUTH_ERROR');
        }

        // Otros errores
        logger.error(`❌ Error HTTP ${status}:`, data);
        throw new Error(`API_ERROR: ${data?.error || 'Error desconocido'}`);
      }

      // Timeout
      if (error.code === 'ECONNABORTED') {
        logger.error('⏱️ Timeout en la solicitud');
        
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest(text, attempt + 1);
        }
        
        throw new Error('TIMEOUT');
      }

      // Error de red
      if (error.request) {
        logger.error('🌐 Error de red - No se pudo conectar con Hugging Face');
        
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest(text, attempt + 1);
        }
        
        throw new Error('NETWORK_ERROR');
      }

      // Error desconocido
      logger.error('❌ Error desconocido:', error.message);
      throw error;
    }
  }

  /**
   * Analiza el sentimiento de un texto
   * @param {string} text - Texto a analizar
   * @returns {Promise<Array>} Resultados del análisis
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
      results: results[0], // La API devuelve un array, tomamos el primer elemento
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
      
      const testText = 'Este es un texto de prueba';
      await this.analyzeSentiment(testText);
      
      logger.success('✅ API de Hugging Face funcionando correctamente');
      
      return {
        status: 'healthy',
        configured: this.isConfigured(),
        apiUrl: this.apiUrl,
        model: AI_CONFIG.MODEL_NAME
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
      apiUrl: this.apiUrl,
      model: AI_CONFIG.MODEL_NAME,
      timeout: this.requestTimeout,
      maxRetries: this.maxRetries
    };
  }
}

// Singleton instance
const huggingFaceClient = new HuggingFaceClient();

export { huggingFaceClient as HuggingFaceClient };
export default huggingFaceClient;
