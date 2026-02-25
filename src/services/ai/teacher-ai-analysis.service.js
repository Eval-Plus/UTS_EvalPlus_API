/**
 * Servicio de Análisis de IA para Docentes
 * Genera perfiles completos usando LLaMA vía Hugging Face Router
 *
 * Flujo:
 * 1. Obtiene datos del docente (respuestas + comentarios) reutilizando TeacherReportService
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

export class TeacherAIAnalysisService {

  // ─────────────────────────────────────────
  // PROMPTS
  // ─────────────────────────────────────────

  /**
   * Prompt de sistema: define el rol y el formato de salida esperado.
   * Se usa un formato estricto con delimitadores para facilitar la extracción
   * incluso cuando el modelo añade texto extra antes o después del JSON.
   */
  static buildSystemPrompt() {
    return `Eres un experto en evaluación docente universitaria. Analiza los datos y genera un informe estructurado.

REGLAS CRÍTICAS:
1. Responde SOLO con el bloque JSON entre los marcadores ---JSON_START--- y ---JSON_END---.
2. No escribas NADA antes de ---JSON_START--- ni después de ---JSON_END---.
3. Todos los textos deben estar en español.
4. Usa comillas dobles para strings en el JSON.
5. Los campos "strengths", "improvements" y "recommendations" DEBEN ser arrays de strings.
6. "responsesComment" y "commentsComment" deben ser strings (párrafos cortos).

FORMATO EXACTO:
---JSON_START---
{
  "profile": "Párrafo descriptivo de 2-3 oraciones sobre el docente.",
  "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "improvements": ["Área de mejora 1", "Área de mejora 2"],
  "recommendations": ["Recomendación concreta 1", "Recomendación concreta 2", "Recomendación concreta 3"],
  "responsesComment": "Párrafo breve analizando las respuestas cuantitativas.",
  "commentsComment": "Párrafo breve analizando los comentarios cualitativos de los estudiantes."
}
---JSON_END---`;
  }

  /**
   * Prompt de usuario: incluye todos los datos del docente.
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
      .map(cat =>
        `  - ${cat.category}: promedio ${cat.averageScore}/5.0 (${cat.questionsCount} preguntas, ${cat.totalResponses} respuestas)`
      )
      .join('\n');

    const commentsText = commentsSummary.total > 0
      ? `Comentarios anónimos recibidos: ${commentsSummary.total}
  - Positivos: ${commentsSummary.positive} (${commentsSummary.positivePercent}%)
  - Neutrales: ${commentsSummary.neutral} (${commentsSummary.neutralPercent}%)
  - Negativos: ${commentsSummary.negative} (${commentsSummary.negativePercent}%)
  
  Muestra de comentarios positivos: ${commentsSummary.samplePositive.join(' | ') || 'Ninguno'}
  Muestra de comentarios negativos: ${commentsSummary.sampleNegative.join(' | ') || 'Ninguno'}`
      : 'No se recibieron comentarios en este período.';

    return `Analiza el siguiente docente y genera el informe en el formato especificado.

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

Responde usando el formato con ---JSON_START--- y ---JSON_END---.`;
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

    const commentsSummary = this.summarizeComments(comments);

    return {
      teacherName,
      periodo,
      totalEvaluations:     responsesReport.totalEvaluations,
      completedEvaluations: responsesReport.completedEvaluations,
      completionRate:       responsesReport.completionRate,
      averageScore:         responsesReport.averageScore,
      categoriesData:       categoriesReport.categories,
      commentsSummary,
      // Metadata para guardar en DB
      responsesCount: responsesReport.questions.reduce(
        (sum, q) => sum + q.totalResponses, 0
      ),
    };
  }

  /**
   * Genera un resumen de comentarios para el prompt.
   */
  static summarizeComments(comments) {
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
      positive, neutral, negative,
      positivePercent: parseFloat(((positive / total) * 100).toFixed(1)),
      neutralPercent:  parseFloat(((neutral  / total) * 100).toFixed(1)),
      negativePercent: parseFloat(((negative / total) * 100).toFixed(1)),
      samplePositive,
      sampleNegative,
    };
  }

  // ─────────────────────────────────────────
  // PARSEO DE RESPUESTA
  // ─────────────────────────────────────────

  /**
   * Extrae y valida el JSON de la respuesta del modelo.
   *
   * Estrategia de extracción (en orden de prioridad):
   * 1. Buscar entre los marcadores ---JSON_START--- / ---JSON_END---
   * 2. Buscar entre bloques de código markdown ```json ... ```
   * 3. Extraer el primer objeto JSON completo de la respuesta
   */
  static parseModelResponse(rawText) {
    let jsonString = null;

    // ── Estrategia 1: marcadores explícitos ──
    const markerMatch = rawText.match(
      /---JSON_START---\s*([\s\S]*?)\s*---JSON_END---/
    );
    if (markerMatch) {
      jsonString = markerMatch[1].trim();
      logger.info('JSON extraído con marcadores explícitos');
    }

    // ── Estrategia 2: bloque markdown ```json ──
    if (!jsonString) {
      const mdMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (mdMatch) {
        jsonString = mdMatch[1].trim();
        logger.info('JSON extraído de bloque markdown');
      }
    }

    // ── Estrategia 3: primer { ... } del texto ──
    if (!jsonString) {
      const start = rawText.indexOf('{');
      const end   = rawText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        jsonString = rawText.substring(start, end + 1).trim();
        logger.info('JSON extraído por búsqueda de llaves');
      }
    }

    if (!jsonString) {
      logger.error('Respuesta raw del modelo:', rawText.substring(0, 500));
      throw new Error('El modelo no retornó un JSON reconocible. Intenta regenerar.');
    }

    // ── Parseo ──
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      // Intento de reparación básica: reemplazar comillas simples por dobles
      try {
        const repaired = jsonString.replace(/'/g, '"');
        parsed = JSON.parse(repaired);
        logger.warn('JSON reparado (comillas simples → dobles)');
      } catch {
        logger.error('JSON malformado:', jsonString.substring(0, 300));
        throw new Error(`JSON malformado en respuesta del modelo: ${parseError.message}`);
      }
    }

    // ── Validación de campos requeridos ──
    const requiredFields = ['profile', 'strengths', 'improvements', 'recommendations'];
    for (const field of requiredFields) {
      if (parsed[field] === undefined || parsed[field] === null) {
        throw new Error(`Campo requerido faltante en respuesta del modelo: "${field}"`);
      }
    }

    // ── Normalización de arrays ──
    // El modelo a veces retorna strings con saltos en lugar de arrays
    const arrayFields = ['strengths', 'improvements', 'recommendations'];
    for (const field of arrayFields) {
      parsed[field] = this._normalizeToArray(parsed[field], field);
      if (parsed[field].length === 0) {
        throw new Error(`El campo "${field}" resultó vacío tras normalizar. Intenta regenerar.`);
      }
    }

    // ── Normalización de strings ──
    const stringFields = ['profile', 'responsesComment', 'commentsComment'];
    for (const field of stringFields) {
      parsed[field] = this._normalizeToString(parsed[field]);
    }

    return {
      profile:          parsed.profile,
      strengths:        parsed.strengths,
      improvements:     parsed.improvements,
      recommendations:  parsed.recommendations,
      responsesComment: parsed.responsesComment,
      commentsComment:  parsed.commentsComment,
    };
  }

  /**
   * Convierte un valor a array de strings no vacío.
   * Maneja los casos donde el modelo retorna un string con viñetas o saltos de línea.
   */
  static _normalizeToArray(value, fieldName) {
    if (Array.isArray(value)) {
      return value
        .map(item => String(item).trim())
        .filter(item => item.length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      logger.warn(`Campo "${fieldName}" es string, convirtiendo a array`);
      // Separar por saltos de línea, guiones o puntos al inicio de línea
      return value
        .split(/\n|(?:^|\n)\s*[-•*]\s*/m)
        .map(line => line.replace(/^[-•*\d.)\s]+/, '').trim())
        .filter(line => line.length > 3);
    }

    return [];
  }

  /**
   * Convierte un valor a string limpio. Retorna '' si no existe.
   */
  static _normalizeToString(value) {
    if (typeof value === 'string') return value.trim();
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  // ─────────────────────────────────────────
  // MÉTODO PRINCIPAL
  // ─────────────────────────────────────────

  /**
   * Genera (o regenera) el análisis de IA para un docente.
   *
   * @param {number} teacherId  - ID del docente
   * @param {string} periodo    - Período académico (ej: '2025-1')
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
    const userPrompt   = this.buildUserPrompt(teacherData);

    // 3. Llamar al modelo LLaMA
    logger.info('Enviando datos al modelo LLaMA...');
    const rawResponse = await LLMClient.generateText(systemPrompt, userPrompt);

    // 4. Parsear respuesta de forma robusta
    logger.info('Parseando respuesta del modelo...');
    const parsedAnalysis = this.parseModelResponse(rawResponse);

    // 5. Guardar en base de datos (upsert)
    logger.info('Guardando análisis en base de datos...');
    const savedAnalysis = await AIAnalysisModel.upsert({
      teacherId,
      periodo,
      profile:          parsedAnalysis.profile,
      strengths:        parsedAnalysis.strengths,
      improvements:     parsedAnalysis.improvements,
      recommendations:  parsedAnalysis.recommendations,
      responsesComment: parsedAnalysis.responsesComment,
      commentsComment:  parsedAnalysis.commentsComment,
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
