/**
 * Servicio de Análisis de IA para Docentes
 * Genera perfiles completos usando LLaMA vía Hugging Face Router
 *
 * Flujo:
 * 1. Obtiene datos del docente (respuestas + comentarios) reutilizando TeacherReportService
 * 2. Construye el prompt con esa información
 * 3. Llama al modelo LLaMA
 * 4. Parsea la respuesta JSON
 * 5. Guarda/actualiza en la tabla ai_analysis
 */

import { LLMClient } from './llm-client.service.js';
import { AIAnalysisModel } from '../../models/ai-analysis.model.js';
import { TeacherReportService } from '../admin/reports/teacher-report.service.js';
import { createLogger } from '../../utils/logger.js';
import { AI_GENERATION_CONFIG } from '../../config/constants.js';

const logger = createLogger('TeacherAIAnalysisService');

export class TeacherAIAnalysisService {

  // ─────────────────────────────────────────
  // PROMPTS
  // ─────────────────────────────────────────

  /**
   * Prompt de sistema: define el rol y el formato de salida esperado
   */
  static buildSystemPrompt() {
    return `Eres un experto en evaluación docente universitaria con amplia experiencia en pedagogía y análisis de desempeño académico. 
Tu tarea es analizar los datos de evaluación de un docente y generar un informe estructurado, objetivo y constructivo.

REGLAS ESTRICTAS:
- Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes ni después.
- No uses markdown, no uses bloques de código, solo el JSON puro.
- Todos los textos deben estar en español.
- Sé específico, constructivo y basado en los datos proporcionados.
- El perfil debe ser un párrafo descriptivo de 2-3 oraciones.
- Cada lista debe tener entre 2 y 4 elementos.
- Las recomendaciones deben ser accionables y concretas.

FORMATO DE RESPUESTA (JSON exacto):
{
  "profile": "descripción del perfil del docente basada en los datos",
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "improvements": ["área de mejora 1", "área de mejora 2"],
  "recommendations": ["recomendación concreta 1", "recomendación concreta 2", "recomendación concreta 3"]
}`;
  }

  /**
   * Prompt de usuario: incluye todos los datos del docente
   */
  static buildUserPrompt(teacherData) {
    const {
      teacherName,
      periodo,
      totalEvaluations,
      completedEvaluations,
      completionRate,
      averageScore,
      categoriesData,
      commentsSummary,
    } = teacherData;

    const categoriesText = categoriesData
      .map(cat => `  - ${cat.category}: promedio ${cat.averageScore}/5.0 (${cat.questionsCount} preguntas, ${cat.totalResponses} respuestas)`)
      .join('\n');

    const commentsText = commentsSummary.total > 0
      ? `Comentarios anónimos recibidos: ${commentsSummary.total}
  - Positivos: ${commentsSummary.positive} (${commentsSummary.positivePercent}%)
  - Neutrales: ${commentsSummary.neutral} (${commentsSummary.neutralPercent}%)
  - Negativos: ${commentsSummary.negative} (${commentsSummary.negativePercent}%)
  
  Muestra de comentarios positivos: ${commentsSummary.samplePositive.join(' | ') || 'Ninguno'}
  Muestra de comentarios negativos: ${commentsSummary.sampleNegative.join(' | ') || 'Ninguno'}`
      : 'No se recibieron comentarios en este período.';

    return `Analiza el siguiente docente y genera el informe en el formato JSON especificado:

DOCENTE: ${teacherName}
PERÍODO: ${periodo}

DATOS DE EVALUACIÓN:
- Total de evaluaciones asignadas: ${totalEvaluations}
- Evaluaciones completadas por estudiantes: ${completedEvaluations}
- Tasa de completitud: ${completionRate}%
- Promedio general de calificación: ${averageScore}/5.0

DESEMPEÑO POR CATEGORÍA:
${categoriesText}

ANÁLISIS DE COMENTARIOS ESTUDIANTILES:
${commentsText}

Genera el análisis JSON ahora:`;
  }

  // ─────────────────────────────────────────
  // PREPARACIÓN DE DATOS
  // ─────────────────────────────────────────

  /**
   * Recopila y estructura todos los datos del docente necesarios para el prompt
   */
  static async gatherTeacherData(teacherId, periodo, teacherName) {
    logger.info(`Recopilando datos del docente ${teacherId} para período ${periodo}`);

    // Reutilizamos los servicios ya existentes
    const [responsesReport, categoriesReport, comments] = await Promise.all([
      TeacherReportService.getTeacherResponsesReport(teacherId, periodo),
      TeacherReportService.getCategoryStatistics(teacherId, periodo),
      TeacherReportService.getTeacherComments(teacherId, periodo),
    ]);

    // Procesar comentarios para el resumen
    const commentsSummary = this.summarizeComments(comments);

    return {
      teacherName,
      periodo,
      totalEvaluations: responsesReport.totalEvaluations,
      completedEvaluations: responsesReport.completedEvaluations,
      completionRate: responsesReport.completionRate,
      averageScore: responsesReport.averageScore,
      categoriesData: categoriesReport.categories,
      commentsSummary,
      // Metadata para guardar en DB
      responsesCount: responsesReport.questions.reduce((sum, q) => sum + q.totalResponses, 0),
    };
  }

  /**
   * Genera un resumen de comentarios para el prompt
   */
  static summarizeComments(comments) {
    const total = comments.length;

    if (total === 0) {
      return {
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        positivePercent: 0,
        neutralPercent: 0,
        negativePercent: 0,
        samplePositive: [],
        sampleNegative: [],
      };
    }

    const positive = comments.filter(c => c.sentiment === 'positive').length;
    const negative = comments.filter(c => c.sentiment === 'negative').length;
    const neutral = total - positive - negative;

    // Tomar muestras representativas (máx 3 por tipo, truncadas a 100 chars)
    const samplePositive = comments
      .filter(c => c.sentiment === 'positive')
      .slice(0, 3)
      .map(c => c.text.substring(0, 100));

    const sampleNegative = comments
      .filter(c => c.sentiment === 'negative')
      .slice(0, 3)
      .map(c => c.text.substring(0, 100));

    return {
      total,
      positive,
      neutral,
      negative,
      positivePercent: parseFloat(((positive / total) * 100).toFixed(1)),
      neutralPercent: parseFloat(((neutral / total) * 100).toFixed(1)),
      negativePercent: parseFloat(((negative / total) * 100).toFixed(1)),
      samplePositive,
      sampleNegative,
    };
  }

  // ─────────────────────────────────────────
  // PARSEO DE RESPUESTA
  // ─────────────────────────────────────────

  /**
   * Extrae y valida el JSON de la respuesta del modelo
   */
  static parseModelResponse(rawText) {
    // Limpiar posible markdown residual
    let cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Buscar el primer { y el último } para extraer solo el JSON
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new Error('El modelo no retornó un JSON válido');
    }

    cleaned = cleaned.substring(start, end + 1);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`JSON malformado en respuesta del modelo: ${cleaned.substring(0, 100)}`);
    }

    // Validar campos requeridos
    const requiredFields = ['profile', 'strengths', 'improvements', 'recommendations'];
    for (const field of requiredFields) {
      if (!parsed[field]) {
        throw new Error(`Campo requerido faltante en respuesta del modelo: ${field}`);
      }
    }

    // Validar que las listas sean arrays no vacíos
    for (const listField of ['strengths', 'improvements', 'recommendations']) {
      if (!Array.isArray(parsed[listField]) || parsed[listField].length === 0) {
        throw new Error(`El campo '${listField}' debe ser un array no vacío`);
      }
    }

    return {
      profile: String(parsed.profile).trim(),
      strengths: parsed.strengths.map(s => String(s).trim()),
      improvements: parsed.improvements.map(s => String(s).trim()),
      recommendations: parsed.recommendations.map(s => String(s).trim()),
    };
  }

  // ─────────────────────────────────────────
  // MÉTODO PRINCIPAL
  // ─────────────────────────────────────────

  /**
   * Genera (o regenera) el análisis de IA para un docente
   *
   * @param {number} teacherId - ID del docente
   * @param {string} periodo - Período académico (ej: '2025-1')
   * @param {string} teacherName - Nombre del docente (para el prompt)
   * @returns {Promise<Object>} Análisis guardado en DB
   */
  static async generateAnalysis(teacherId, periodo, teacherName) {
    logger.info(`Iniciando generación de análisis IA — Docente: ${teacherId}, Período: ${periodo}`);

    // 1. Verificar que el docente tiene datos suficientes
    const teacherData = await this.gatherTeacherData(teacherId, periodo, teacherName);

    if (teacherData.totalEvaluations === 0) {
      throw new Error('NO_DATA: El docente no tiene evaluaciones en este período');
    }

    if (teacherData.completedEvaluations === 0) {
      throw new Error('NO_DATA: El docente no tiene evaluaciones completadas por estudiantes');
    }

    logger.info(
      `Datos recopilados — ${teacherData.completedEvaluations} evaluaciones completadas, ` +
      `promedio: ${teacherData.averageScore}, comentarios: ${teacherData.commentsSummary.total}`
    );

    // 2. Construir prompts
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(teacherData);

    // 3. Llamar al modelo LLaMA
    logger.info('Enviando datos al modelo LLaMA...');
    const rawResponse = await LLMClient.generateText(systemPrompt, userPrompt);

    // 4. Parsear respuesta
    logger.info('Parseando respuesta del modelo...');
    const parsedAnalysis = this.parseModelResponse(rawResponse);

    // 5. Guardar en base de datos (upsert)
    logger.info('Guardando análisis en base de datos...');
    const savedAnalysis = await AIAnalysisModel.upsert({
      teacherId,
      periodo,
      profile: parsedAnalysis.profile,
      strengths: parsedAnalysis.strengths,
      improvements: parsedAnalysis.improvements,
      recommendations: parsedAnalysis.recommendations,
      modelVersion: AI_GENERATION_CONFIG.MODEL_NAME,
      evaluationsCount: teacherData.completedEvaluations,
      responsesCount: teacherData.responsesCount,
      averageScore: teacherData.averageScore,
    });

    logger.success(`Análisis generado y guardado exitosamente para docente ${teacherId}`);

    return savedAnalysis;
  }

  /**
   * Obtiene el análisis existente de un docente (sin regenerar)
   *
   * @param {number} teacherId
   * @param {string} periodo
   * @returns {Promise<Object|null>}
   */
  static async getAnalysis(teacherId, periodo) {
    return await AIAnalysisModel.findByTeacherAndPeriod(teacherId, periodo);
  }

  /**
   * Health check del servicio
   */
  static async healthCheck() {
    return await LLMClient.healthCheck();
  }
}

export default TeacherAIAnalysisService;
