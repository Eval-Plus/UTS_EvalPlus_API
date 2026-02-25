/**
 * Servicio de Análisis de IA para Docentes
 * Genera perfiles concisos y fieles a los datos reales usando LLaMA vía Hugging Face Router
 *
 * Flujo:
 * 1. Obtiene datos del docente reutilizando TeacherReportService
 * 2. Construye el prompt con esa información
 * 3. Llama al modelo LLaMA
 * 4. Parsea la respuesta JSON de forma robusta
 * 5. Guarda/actualiza en la tabla ai_analysis
 */

import { LLMClient } from './llm-client.service.js';
import { AIAnalysisModel } from '../../models/ai-analysis.model.js';
import { TeacherReportService } from '../admin/reports/teacher-report.service.js';
import { createLogger } from '../../utils/logger.js';
import { AI_GENERATION_CONFIG } from '../../config/constants.js';

const logger = createLogger('TeacherAIAnalysisService');

// ─────────────────────────────────────────
// CONSTANTES DE VALIDACIÓN
// ─────────────────────────────────────────

const LIMITS = {
  PROFILE_WORDS_MAX:       30,
  STRENGTHS_MAX:            2,
  IMPROVEMENTS_MAX:         2,
  RECOMMENDATIONS_MAX:      2,
  RESPONSES_COMMENT_WORDS:  40,
  COMMENTS_COMMENT_WORDS:   40,
};

export class TeacherAIAnalysisService {

  // ─────────────────────────────────────────
  // PROMPTS
  // ─────────────────────────────────────────

  /**
   * Prompt de sistema.
   *
   * Principios de diseño:
   * - Los campos responsesComment y commentsComment van PRIMERO en el template
   *   JSON para que no sean víctimas del truncado por MAX_TOKENS.
   * - Se exige explícitamente que los campos narrativos sean CONCLUSIONES
   *   interpretativas, no un reflejo de los datos que ya son visibles.
   * - Se prohíbe inventar información no presente en los datos.
   * - Límites numéricos explícitos en el prompt como primera línea de defensa
   *   (el código los refuerza como segunda línea).
   */
  static buildSystemPrompt() {
    return `Eres un evaluador docente universitario experto en interpretar datos de evaluaciones estudiantiles.

REGLAS ABSOLUTAS:
- NO inventes información. Basa cada campo únicamente en los datos proporcionados.
- Si los datos son negativos, refleja eso con honestidad. No suavices resultados malos.
- Responde ÚNICAMENTE con el bloque JSON entre ---JSON_START--- y ---JSON_END---. Nada fuera de esos marcadores.
- Todos los textos en español.

INSTRUCCIONES POR CAMPO:

"responsesComment" — máximo 40 palabras.
Escribe una CONCLUSIÓN INTERPRETATIVA de las puntuaciones. No repitas los números.
Ejemplo correcto: "El docente muestra dominio metodológico pero falla en la comunicación con el estudiante, lo que afecta la experiencia de aprendizaje."
Ejemplo incorrecto: "El docente obtuvo 3.2 en didáctica y 2.8 en comunicación."

"commentsComment" — máximo 40 palabras.
Escribe una CONCLUSIÓN sobre la percepción estudiantil. Incluye la tasa de satisfacción (% de comentarios positivos). No transcribas los comentarios.
Ejemplo correcto: "Con un 30% de satisfacción, los estudiantes perciben al docente como poco claro y desorganizado, predominando comentarios de frustración."

"profile" — máximo 30 palabras.
Una VALORACIÓN GLOBAL del docente que integre tanto respuestas como comentarios. No es un resumen de campos anteriores; es una lectura de conjunto del perfil profesional.

"strengths" — exactamente 2 elementos. Si no hay evidencia de fortalezas reales, usa los aspectos con mejor puntuación relativa.

"improvements" — exactamente 2 elementos. Basadas en las categorías con puntuaciones más bajas o comentarios más negativos.

"recommendations" — exactamente 2 elementos. Acciones concretas y específicas derivadas de las oportunidades de mejora.

---JSON_START---
{
  "responsesComment": "Conclusión interpretativa de las puntuaciones. Máximo 40 palabras.",
  "commentsComment": "Conclusión sobre percepción estudiantil con tasa de satisfacción en %. Máximo 40 palabras.",
  "profile": "Valoración global del perfil docente integrando respuestas y comentarios. Máximo 30 palabras.",
  "strengths": ["Fortaleza 1 con evidencia en los datos", "Fortaleza 2 con evidencia en los datos"],
  "improvements": ["Área de mejora 1 con evidencia real", "Área de mejora 2 con evidencia real"],
  "recommendations": ["Acción concreta 1 derivada de las mejoras", "Acción concreta 2 derivada de las mejoras"]
}
---JSON_END---`;
  }

  /**
   * Prompt de usuario: datos completos del docente presentados de forma
   * estructurada para que el modelo no tenga que inferir nada.
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

    const categoriesText = categoriesData.length > 0
      ? categoriesData
          .map(cat =>
            `  • ${cat.category}: ${cat.averageScore}/5.0 (${cat.totalResponses} respuestas)`
          )
          .join('\n')
      : '  • Sin datos por categoría';

    const commentsText = commentsSummary.total > 0
      ? `Total: ${commentsSummary.total} comentarios
  • Positivos: ${commentsSummary.positive} (${commentsSummary.positivePercent}%)
  • Neutrales: ${commentsSummary.neutral}  (${commentsSummary.neutralPercent}%)
  • Negativos: ${commentsSummary.negative} (${commentsSummary.negativePercent}%)
  Muestra positiva: ${commentsSummary.samplePositive.join(' | ') || 'ninguna'}
  Muestra negativa: ${commentsSummary.sampleNegative.join(' | ') || 'ninguna'}`
      : 'Sin comentarios en este período.';

    return `Analiza los datos del siguiente docente e interprétalos para generar el informe JSON. Recuerda: escribe conclusiones, no reflejes los datos literalmente.

DOCENTE: ${teacherName}
PERÍODO: ${periodo}
EVALUACIONES: ${completedEvaluations} completadas de ${totalEvaluations} asignadas (${completionRate}% completitud)
PROMEDIO GENERAL: ${averageScore}/5.0

PUNTUACIONES POR CATEGORÍA:
${categoriesText}

COMENTARIOS ANÓNIMOS:
${commentsText}`;
  }

  // ─────────────────────────────────────────
  // PREPARACIÓN DE DATOS
  // ─────────────────────────────────────────

  /**
   * Recopila y estructura todos los datos del docente necesarios para el prompt.
   */
  static async gatherTeacherData(teacherId, periodo, teacherName) {
    logger.info(`Recopilando datos del docente ${teacherId} para período ${periodo}`);

    const [responsesReport, categoriesReport, comments] = await Promise.all([
      TeacherReportService.getTeacherResponsesReport(teacherId, periodo),
      TeacherReportService.getCategoryStatistics(teacherId, periodo),
      TeacherReportService.getTeacherComments(teacherId, periodo),
    ]);

    return {
      teacherName,
      periodo,
      totalEvaluations:     responsesReport.totalEvaluations,
      completedEvaluations: responsesReport.completedEvaluations,
      completionRate:       responsesReport.completionRate,
      averageScore:         responsesReport.averageScore,
      categoriesData:       categoriesReport.categories,
      commentsSummary:      this._summarizeComments(comments),
      responsesCount:       responsesReport.questions.reduce(
        (sum, q) => sum + q.totalResponses, 0
      ),
    };
  }

  /**
   * Genera un resumen de comentarios para incluir en el prompt.
   */
  static _summarizeComments(comments) {
    const total = comments.length;

    if (total === 0) {
      return {
        total: 0,
        positive: 0, neutral: 0, negative: 0,
        positivePercent: 0, neutralPercent: 0, negativePercent: 0,
        samplePositive: [],
        sampleNegative: [],
      };
    }

    const positive = comments.filter(c => c.sentiment === 'positive').length;
    const negative = comments.filter(c => c.sentiment === 'negative').length;
    const neutral  = total - positive - negative;

    return {
      total,
      positive, neutral, negative,
      positivePercent: parseFloat(((positive / total) * 100).toFixed(1)),
      neutralPercent:  parseFloat(((neutral  / total) * 100).toFixed(1)),
      negativePercent: parseFloat(((negative / total) * 100).toFixed(1)),
      samplePositive: comments
        .filter(c => c.sentiment === 'positive')
        .slice(0, 2)
        .map(c => c.text.substring(0, 70)),
      sampleNegative: comments
        .filter(c => c.sentiment === 'negative')
        .slice(0, 2)
        .map(c => c.text.substring(0, 70)),
    };
  }

  // ─────────────────────────────────────────
  // PARSEO DE RESPUESTA
  // ─────────────────────────────────────────

  /**
   * Extrae y valida el JSON de la respuesta del modelo.
   *
   * Estrategias de extracción (en orden de prioridad):
   * 1. Marcadores ---JSON_START--- / ---JSON_END---
   * 2. Bloque markdown ```json ... ```
   * 3. Primer objeto { ... } encontrado en el texto
   */
  static parseModelResponse(rawText) {
    logger.info(`Raw response del modelo (${rawText.length} chars):\n${rawText.substring(0, 600)}`);

    const jsonString = this._extractJsonString(rawText);

    if (!jsonString) {
      throw new Error('El modelo no retornó un JSON reconocible. Intenta regenerar.');
    }

    const parsed = this._parseJsonString(jsonString);

    this._validateRequiredFields(parsed);

    const result = {
      responsesComment: this._normalizeToString(parsed.responsesComment),
      commentsComment:  this._normalizeToString(parsed.commentsComment),
      profile:          this._normalizeToString(parsed.profile),
      strengths:        this._normalizeToArray(parsed.strengths,       'strengths',       LIMITS.STRENGTHS_MAX),
      improvements:     this._normalizeToArray(parsed.improvements,    'improvements',    LIMITS.IMPROVEMENTS_MAX),
      recommendations:  this._normalizeToArray(parsed.recommendations, 'recommendations', LIMITS.RECOMMENDATIONS_MAX),
    };

    // Diagnóstico de los campos narrativos
    logger.info(`profile          (${result.profile.split(' ').length} palabras)`);
    logger.info(`responsesComment (${result.responsesComment.length} chars)`);
    logger.info(`commentsComment  (${result.commentsComment.length} chars)`);

    return result;
  }

  /**
   * Intenta extraer el string JSON de la respuesta raw del modelo.
   */
  static _extractJsonString(rawText) {
    // Estrategia 1: marcadores explícitos
    const markerMatch = rawText.match(/---JSON_START---\s*([\s\S]*?)\s*---JSON_END---/);
    if (markerMatch) {
      logger.info('JSON extraído con marcadores explícitos');
      return markerMatch[1].trim();
    }

    // Estrategia 2: bloque markdown
    const mdMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (mdMatch) {
      logger.info('JSON extraído de bloque markdown');
      return mdMatch[1].trim();
    }

    // Estrategia 3: primer objeto JSON del texto
    const start = rawText.indexOf('{');
    const end   = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      logger.info('JSON extraído por búsqueda de llaves');
      return rawText.substring(start, end + 1).trim();
    }

    return null;
  }

  /**
   * Parsea el string JSON con un intento de reparación básica.
   */
  static _parseJsonString(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (firstError) {
      try {
        const repaired = jsonString.replace(/'/g, '"');
        const parsed = JSON.parse(repaired);
        logger.warn('JSON reparado (comillas simples → dobles)');
        return parsed;
      } catch {
        logger.error(`JSON malformado:\n${jsonString.substring(0, 400)}`);
        throw new Error(`JSON malformado en respuesta del modelo: ${firstError.message}`);
      }
    }
  }

  /**
   * Valida que los campos obligatorios estén presentes en el objeto parseado.
   */
  static _validateRequiredFields(parsed) {
    const required = ['profile', 'strengths', 'improvements', 'recommendations'];
    for (const field of required) {
      if (parsed[field] === undefined || parsed[field] === null) {
        throw new Error(`Campo requerido faltante en respuesta del modelo: "${field}"`);
      }
    }
  }

  // ─────────────────────────────────────────
  // NORMALIZACIÓN Y TRUNCADO
  // ─────────────────────────────────────────

  /**
   * Convierte un valor a array de strings aplicando el límite de elementos.
   * Maneja el caso en que el modelo retorne un string con viñetas o saltos de línea.
   */
  static _normalizeToArray(value, fieldName, maxItems) {
    let items = [];

    if (Array.isArray(value)) {
      items = value.map(item => String(item).trim()).filter(item => item.length > 0);
    } else if (typeof value === 'string' && value.trim().length > 0) {
      logger.warn(`Campo "${fieldName}" llegó como string, convirtiendo a array`);
      items = value
        .split(/\n|(?:^|\n)\s*[-•*]\s*/m)
        .map(line => line.replace(/^[-•*\d.)\s]+/, '').trim())
        .filter(line => line.length > 3);
    }

    if (items.length > maxItems) {
      logger.warn(`Campo "${fieldName}" excede ${maxItems} elementos, truncando`);
      items = items.slice(0, maxItems);
    }

    return items;
  }

  /**
   * Convierte un valor a string limpio. Retorna '' si el valor no existe.
   */
  static _normalizeToString(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  // ─────────────────────────────────────────
  // MÉTODO PRINCIPAL
  // ─────────────────────────────────────────

  /**
   * Genera (o regenera) el análisis de IA para un docente.
   *
   * @param {number} teacherId   - ID del docente
   * @param {string} periodo     - Período académico (ej: '2025-1')
   * @param {string} teacherName - Nombre del docente (para el prompt)
   * @returns {Promise<Object>} Análisis guardado en DB
   */
  static async generateAnalysis(teacherId, periodo, teacherName) {
    logger.info(`Iniciando generación de análisis IA — Docente: ${teacherId}, Período: ${periodo}`);

    // 1. Recopilar y validar datos
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
    const userPrompt   = this.buildUserPrompt(teacherData);

    // 3. Llamar al modelo LLaMA
    logger.info('Enviando datos al modelo LLaMA...');
    const rawResponse = await LLMClient.generateText(systemPrompt, userPrompt);

    // 4. Parsear respuesta
    logger.info('Parseando respuesta del modelo...');
    const parsed = this.parseModelResponse(rawResponse);

    // 5. Guardar en base de datos
    logger.info('Guardando análisis en base de datos...');
    const savedAnalysis = await AIAnalysisModel.upsert({
      teacherId,
      periodo,
      profile:          parsed.profile,
      strengths:        parsed.strengths,
      improvements:     parsed.improvements,
      recommendations:  parsed.recommendations,
      responsesComment: parsed.responsesComment,
      commentsComment:  parsed.commentsComment,
      modelVersion:     AI_GENERATION_CONFIG.MODEL_NAME,
      evaluationsCount: teacherData.completedEvaluations,
      responsesCount:   teacherData.responsesCount,
      averageScore:     teacherData.averageScore,
    });

    logger.success(`Análisis generado y guardado exitosamente para docente ${teacherId}`);

    return savedAnalysis;
  }

  /**
   * Obtiene el análisis existente de un docente (sin regenerar).
   */
  static async getAnalysis(teacherId, periodo) {
    return await AIAnalysisModel.findByTeacherAndPeriod(teacherId, periodo);
  }

  /**
   * Health check del servicio LLM.
   */
  static async healthCheck() {
    return await LLMClient.healthCheck();
  }
}

export default TeacherAIAnalysisService;
