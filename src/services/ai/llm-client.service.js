/**
 * Cliente para modelos de generación de texto vía Hugging Face Router (OpenAI-compatible)
 * Utilizado para análisis de docentes con LLaMA
 */

import { OpenAI } from 'openai';
import { createLogger } from '../../utils/logger.js';
import { AI_GENERATION_CONFIG } from '../../config/constants.js';

const logger = createLogger('LLMClient');

class LLMClient {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.modelName = AI_GENERATION_CONFIG.MODEL_NAME;
    this.maxRetries = AI_GENERATION_CONFIG.MAX_RETRIES;
    this.retryDelay = AI_GENERATION_CONFIG.RETRY_DELAY;

    if (this.apiKey) {
      this.client = new OpenAI({
        baseURL: AI_GENERATION_CONFIG.BASE_URL,
        apiKey: this.apiKey,
      });
      logger.success('Cliente LLM (LLaMA) inicializado correctamente');
    } else {
      this.client = null;
      logger.warn('HUGGINGFACE_API_KEY no configurada — LLMClient no disponible');
    }
  }

  isConfigured() {
    return !!this.apiKey && !!this.client;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Envía un prompt al modelo y retorna el texto generado
   * @param {string} systemPrompt - Instrucciones del sistema
   * @param {string} userPrompt - Mensaje del usuario
   * @param {number} attempt - Intento actual (para reintentos)
   * @returns {Promise<string>} Texto generado
   */
  async generateText(systemPrompt, userPrompt, attempt = 1) {
    if (!this.isConfigured()) {
      throw new Error('LLMClient no configurado — falta HUGGINGFACE_API_KEY');
    }

    try {
      logger.info(`Enviando prompt al modelo LLaMA (intento ${attempt}/${this.maxRetries})`);

      const startTime = Date.now();

      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: AI_GENERATION_CONFIG.MAX_TOKENS,
        temperature: AI_GENERATION_CONFIG.TEMPERATURE,
      });

      const duration = Date.now() - startTime;
      const text = completion.choices[0]?.message?.content ?? '';

      logger.success(`Respuesta recibida del modelo LLaMA en ${duration}ms`);
      return text;

    } catch (error) {
      const isRetryable =
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('503') ||
        error.message?.includes('502');

      if (isRetryable && attempt < this.maxRetries) {
        const waitTime = this.retryDelay * attempt;
        logger.warn(`Error recuperable, reintentando en ${waitTime}ms...`);
        await this.sleep(waitTime);
        return this.generateText(systemPrompt, userPrompt, attempt + 1);
      }

      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        throw new Error('AUTH_ERROR');
      }

      if (error.message?.includes('429')) {
        throw new Error('RATE_LIMIT');
      }

      logger.error('Error en generación de texto:', error.message);
      throw error;
    }
  }

  async healthCheck() {
    try {
      if (!this.isConfigured()) {
        return { status: 'unhealthy', configured: false, error: 'API key no configurada' };
      }

      const response = await this.generateText(
        'Responde solo con la palabra: ok',
        'Test de conexión'
      );

      return {
        status: response.toLowerCase().includes('ok') ? 'healthy' : 'degraded',
        configured: true,
        model: this.modelName,
      };
    } catch (error) {
      return { status: 'unhealthy', configured: this.isConfigured(), error: error.message };
    }
  }

  getInfo() {
    return {
      configured: this.isConfigured(),
      model: this.modelName,
      baseUrl: AI_GENERATION_CONFIG.BASE_URL,
      maxRetries: this.maxRetries,
    };
  }
}

const llmClient = new LLMClient();

export { llmClient as LLMClient };
export default llmClient;
