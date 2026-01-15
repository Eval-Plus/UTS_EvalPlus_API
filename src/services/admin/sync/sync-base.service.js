/**
 * Servicio Base de Sincronización
 * Contiene lógica común para todas las sincronizaciones
 */

import { createLogger } from '../../../utils/logger.js';
import prisma from '../../../config/prisma.js';

const logger = createLogger('SyncBaseService');

export const CURRENT_PERIOD = '2025-1';

export const SYNC_LIMITS = {
  MAX_SUBJECTS_PER_STUDENT: 7,
  MAX_SUBJECTS_PER_TEACHER: 7
};

export class SyncBaseService {
  /**
   * Guarda log de sincronización en la BD
   */
  static async saveSyncLog(adminId, tipo, periodo, resultado) {
    try {
      await prisma.syncLog.create({
        data: {
          adminId,
          tipo,
          periodo,
          resultado
        }
      });
      logger.debug(`Log guardado: ${tipo} - ${periodo}`);
    } catch (error) {
      logger.error('Error guardando log', error);
    }
  }

  /**
   * Obtiene historial de sincronizaciones
   */
  static async getSyncLogs(filters = {}) {
    const { tipo, periodo, adminId, limit = 50 } = filters;

    const where = {};
    if (tipo) where.tipo = tipo;
    if (periodo) where.periodo = periodo;
    if (adminId) where.adminId = parseInt(adminId);

    return await prisma.syncLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Obtiene el último log por tipo
   */
  static async getLastSyncLog(tipo, periodo = CURRENT_PERIOD) {
    return await prisma.syncLog.findFirst({
      where: { tipo, periodo },
      include: {
        admin: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Crea estructura de resultado inicial
   */
  static createResultStructure() {
    return {
      total: 0,
      procesados: 0,
      exitosos: 0,
      errores: 0,
      yaInscritos: 0,
      detalles: [],
      erroresDetalle: []
    };
  }

  /**
   * Calcula duración y formatea resultado final
   */
  static formatSyncResult(resultado, startTime) {
    const duracion = Date.now() - startTime;
    return {
      ...resultado,
      duracion: `${(duracion / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString()
    };
  }
}

export default SyncBaseService;
