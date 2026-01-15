/**
 * Índice de Servicios de Administración
 * Facilita las importaciones en otros módulos
 */

// Servicio principal (Fachada)
export { AdminService } from './admin.service.js';

// Servicios de Sincronización
export { StudentSyncService } from './admin/sync/student-sync.service.js';
export { TeacherSyncService } from './admin/sync/teacher-sync.service.js';
export { EvaluationSyncService } from './admin/sync/evaluation-sync.service.js';
export { SyncBaseService, CURRENT_PERIOD, SYNC_LIMITS } from './admin/sync/sync-base.service.js';

// Servicios de Analytics
export { TeacherAnalyticsService } from './admin/analytics/teacher-analytics.service.js';

// Servicios de Reportes
export { DashboardService } from './admin/reports/dashboard.service.js';

export default {
  AdminService,
  StudentSyncService,
  TeacherSyncService,
  EvaluationSyncService,
  SyncBaseService,
  TeacherAnalyticsService,
  DashboardService
};
