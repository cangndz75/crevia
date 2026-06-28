import type {
  MaintenanceBacklogDomain,
  MaintenanceBacklogSeverity,
  MaintenanceBacklogStatus,
} from './maintenanceBacklogTypes';

export const MAINTENANCE_DOMAIN_TITLES: Record<MaintenanceBacklogDomain, string> = {
  personnel: 'Ekip Temposu Yoruluyor',
  vehicle: 'Araç Hazırlığı İzlenmeli',
  equipment: 'Saha Ekipmanı Kontrol İstiyor',
  facility: 'Saha Altyapısı Baskı Altında',
  route: 'Rota Baskısı Birikiyor',
  budget: 'Kaynak Baskısı Artıyor',
  operation: 'Operasyonel Tempo Yüksek',
};

export const MAINTENANCE_DOMAIN_DESCRIPTIONS: Record<MaintenanceBacklogDomain, string> = {
  personnel: 'Üst üste saha yükü yarın kapasiteyi sınırlayabilir.',
  vehicle: 'Rota ve araç baskısı müdahale süresini etkileyebilir.',
  equipment: 'Ekipman yıpranması operasyon temposunu düşürebilir.',
  facility: 'Tesis/altyapı kapasitesi müdahale etkisini sınırlayabilir.',
  route: 'Gecikme riski sosyal tepkiyi büyütebilir.',
  budget: 'Plan maliyeti sonraki operasyonlarda alanı daraltabilir.',
  operation: 'Bugünkü müdahaleler yarına hazırlık baskısı taşıyabilir.',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceBacklogStatus, string> = {
  monitoring: 'İzlenmeli',
  recommended: 'Takip önerilir',
  queued_preview: 'Bakım adayı',
  blocked_preview: 'Kritik hazırlık',
};

export const MAINTENANCE_SEVERITY_TO_TONE: Record<
  MaintenanceBacklogSeverity,
  'positive' | 'mixed' | 'warning' | 'critical' | 'neutral'
> = {
  watch: 'neutral',
  attention: 'mixed',
  strained: 'warning',
  critical: 'critical',
};

export const MAINTENANCE_READY_SUMMARY = 'Hazırlık sinyalleri dengede; takip gerektiren aday yok.';
export const MAINTENANCE_EMPTY_SUMMARY = 'Hazırlık sinyalleri sınırlı; operasyonel izler izleniyor.';
export const MAINTENANCE_SNAPSHOT_TITLE = 'Hazırlık Takibi';

export function maintenanceCountLabel(count: number, hasCritical: boolean): string {
  if (count <= 0) return 'Sinyal yok';
  if (hasCritical && count === 1) return '1 kritik hazırlık';
  if (hasCritical) return `${count} hazırlık sinyali`;
  if (count === 1) return '1 takip adayı';
  return `${count} takip adayı`;
}
