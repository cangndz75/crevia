export const MAINTENANCE_RUNTIME_MAX_ACTIVE = 5;
export const MAINTENANCE_RUNTIME_MAX_TOTAL = 8;
export const MAINTENANCE_RUNTIME_MAX_VISIBLE = 3;
export const MAINTENANCE_RUNTIME_RESOLVED_RETENTION_DAYS = 1;
export const MAINTENANCE_RUNTIME_ATTENTION_PROMOTE_STREAK = 2;
export const MAINTENANCE_RUNTIME_ESCALATE_ATTENTION_DAYS = 2;
export const MAINTENANCE_RUNTIME_ESCALATE_STRAINED_DAYS = 3;

export const MAINTENANCE_RUNTIME_DOMAIN_TITLES: Record<
  import('./maintenanceBacklogRuntimeTypes').MaintenanceRuntimeDomain,
  string
> = {
  personnel: 'Ekip Temposu Yoruluyor',
  vehicle: 'Araç Hazırlığı İzlenmeli',
  equipment: 'Saha Ekipmanı Kontrol İstiyor',
  facility: 'Saha Altyapısı Baskı Altında',
  route: 'Rota Baskısı Birikiyor',
  budget: 'Kaynak Baskısı Artıyor',
  operation: 'Operasyonel Tempo Yüksek',
};

export const MAINTENANCE_RUNTIME_DOMAIN_DESCRIPTIONS: Record<
  import('./maintenanceBacklogRuntimeTypes').MaintenanceRuntimeDomain,
  string
> = {
  personnel: 'Üst üste saha yükü yarın kapasiteyi sınırlayabilir.',
  vehicle: 'Rota ve araç baskısı müdahale süresini etkileyebilir.',
  equipment: 'Ekipman yıpranması operasyon temposunu düşürebilir.',
  facility: 'Tesis/altyapı kapasitesi müdahale etkisini sınırlayabilir.',
  route: 'Gecikme riski sosyal tepkiyi büyütebilir.',
  budget: 'Plan maliyeti sonraki operasyonlarda alanı daraltabilir.',
  operation: 'Bugünkü müdahaleler yarına hazırlık baskısı taşıyabilir.',
};

export const MAINTENANCE_RUNTIME_STATUS_LABELS: Record<
  import('./maintenanceBacklogRuntimeTypes').MaintenanceRuntimeStatus,
  string
> = {
  open: 'Takip adayı',
  watching: 'İzlenmeli',
  carried: 'Yarına taşındı',
  resolved: 'Toparlandı',
};
