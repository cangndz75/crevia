import { MAINTENANCE_ECONOMY_MAX_ACTIVE_PLANS } from './maintenanceEconomyConstants';
import type {
  MaintenanceEconomyPostureId,
  MaintenanceEconomyPressureLevel,
  MaintenanceEconomyToneId,
} from './maintenanceEconomyFeelTypes';
import type {
  MaintenanceBacklogRuntimeState,
  MaintenanceRuntimeItem,
} from './maintenanceBacklogRuntimeTypes';
import { selectActiveMaintenanceRuntimeItems } from './maintenanceBacklogRuntimeModel';

export type MaintenanceEconomyPressureSnapshot = {
  pressureScore: number;
  pressureLevel: MaintenanceEconomyPressureLevel;
  activeCount: number;
  criticalCount: number;
  carriedCount: number;
  queuedCount: number;
  inProgressCount: number;
  stabilizedCount: number;
  deferStreakDays: number;
  topDomain: MaintenanceRuntimeItem['domain'] | null;
};

const SEVERITY_WEIGHT = { attention: 12, strained: 28, critical: 44 } as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function levelFromScore(score: number): MaintenanceEconomyPressureLevel {
  if (score >= 72) return 'critical';
  if (score >= 48) return 'high';
  if (score >= 24) return 'moderate';
  return 'low';
}

export function buildMaintenanceEconomyPressureSnapshot(
  runtime: MaintenanceBacklogRuntimeState | null | undefined,
): MaintenanceEconomyPressureSnapshot {
  const items = selectActiveMaintenanceRuntimeItems(runtime ?? { items: [], attentionStreaks: {} });
  const criticalCount = items.filter((item) => item.severity === 'critical').length;
  const carriedCount = items.filter((item) => item.status === 'carried').length;
  const queuedCount = items.filter((item) => item.economyStatus === 'queued').length;
  const inProgressCount = items.filter((item) => item.economyStatus === 'in_progress').length;
  const stabilizedCount = items.filter((item) => item.economyStatus === 'stabilized').length;

  let deferStreakDays = 0;
  for (const item of items) {
    if (item.status === 'carried' || item.economyStatus === 'queued') {
      deferStreakDays = Math.max(deferStreakDays, item.carryOverDays);
    }
  }

  let score = 0;
  for (const item of items) {
    score += SEVERITY_WEIGHT[item.severity];
    if (item.status === 'carried') score += 8;
    if (item.economyStatus === 'queued') score += 10;
    if (item.economyStatus === 'in_progress') score += 6;
  }
  score += Math.min(16, deferStreakDays * 6);
  if (inProgressCount >= MAINTENANCE_ECONOMY_MAX_ACTIVE_PLANS) score += 12;

  const sorted = [...items].sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);
  const topDomain = sorted[0]?.domain ?? null;

  return {
    pressureScore: clampScore(score),
    pressureLevel: levelFromScore(clampScore(score)),
    activeCount: items.length,
    criticalCount,
    carriedCount,
    queuedCount,
    inProgressCount,
    stabilizedCount,
    deferStreakDays,
    topDomain,
  };
}

export function resolveMaintenanceEconomyToneId(
  snapshot: MaintenanceEconomyPressureSnapshot,
): MaintenanceEconomyToneId {
  if (snapshot.activeCount === 0 && snapshot.stabilizedCount > 0) {
    return 'timely_maintenance_relief';
  }
  if (snapshot.activeCount === 0) {
    return snapshot.stabilizedCount > 0 ? 'readiness_strengthened' : 'calm';
  }
  if (snapshot.inProgressCount >= MAINTENANCE_ECONOMY_MAX_ACTIVE_PLANS) {
    return 'plan_strains_capacity';
  }
  if (snapshot.queuedCount > 0 && snapshot.carriedCount >= 1) {
    return 'neglect_shadowed_ops';
  }
  if (snapshot.stabilizedCount > 0 && snapshot.activeCount <= 1) {
    return 'tomorrow_risk_reduced';
  }
  if (snapshot.carriedCount >= 2 || snapshot.deferStreakDays >= 2) {
    return 'neglect_shadowed_ops';
  }
  if (snapshot.inProgressCount > 0 && snapshot.pressureLevel !== 'low') {
    return 'short_term_cost';
  }
  if (snapshot.queuedCount > 0) {
    return 'resource_kept_risk_remains';
  }
  if (snapshot.pressureLevel === 'high' || snapshot.pressureLevel === 'critical') {
    return 'pressure_growing';
  }
  if (snapshot.stabilizedCount > 0) {
    return 'readiness_strengthened';
  }
  return 'balanced';
}

const TONE_COPY: Record<
  MaintenanceEconomyToneId,
  { title: string; summary: string }
> = {
  readiness_strengthened: {
    title: 'Hazırlık güçlendi',
    summary: 'Bugünkü bakım kararı yarın operasyonlara nefes aldırır.',
  },
  short_term_cost: {
    title: 'Kısa vadeli bedel',
    summary: 'Bakım planı bugün kapasiteyi daraltır; hazırlık toparlanır.',
  },
  tomorrow_risk_reduced: {
    title: 'Yarın riski azaldı',
    summary: 'Stabilize edilen sinyaller hızlı müdahale zincirini korur.',
  },
  pressure_growing: {
    title: 'Bakım baskısı büyüyor',
    summary: 'Bugün maliyet düşük görünüyor ama ertelenirse yarın saha süresi uzayabilir.',
  },
  resource_kept_risk_remains: {
    title: 'Kaynak korundu ama risk kaldı',
    summary: 'Bugünkü tempo korundu; hazırlık sinyali yarına taşındı.',
  },
  neglect_shadowed_ops: {
    title: 'İhmal operasyonu gölgeledi',
    summary: 'Ertelenen bakım bugünkü operasyon temposunu zorlaştırabilir.',
  },
  timely_maintenance_relief: {
    title: 'Zamanında bakım sonucu rahatlattı',
    summary: 'Hazırlık toparlandığı için bugünkü saha riski azaldı.',
  },
  plan_strains_capacity: {
    title: 'Bakım planı kapasiteyi zorladı',
    summary: 'Aktif bakım planları bugün ekip gücünü operasyonlarla paylaşıyor.',
  },
  balanced: {
    title: 'Hazırlık dengede',
    summary: 'Bakım kararları bugünkü operasyonlarla uyumlu görünüyor.',
  },
  calm: {
    title: 'Hazırlık sakin',
    summary: 'Kritik bakım baskısı düşük; operasyonlar rahat ilerleyebilir.',
  },
};

export function maintenanceEconomyToneCopy(toneId: MaintenanceEconomyToneId): {
  title: string;
  summary: string;
} {
  return TONE_COPY[toneId];
}

export function resolveMaintenanceEconomyPosture(
  snapshot: MaintenanceEconomyPressureSnapshot,
  toneId: MaintenanceEconomyToneId,
): { id: MaintenanceEconomyPostureId; label: string } {
  if (snapshot.criticalCount > 0) {
    return { id: 'act_now', label: 'Önce hazırlığı netleştir' };
  }
  if (toneId === 'plan_strains_capacity') {
    return { id: 'protect_capacity', label: 'Kapasiteyi koru' };
  }
  if (snapshot.queuedCount > 0 || snapshot.carriedCount >= 2) {
    return { id: 'defer_cautious', label: 'Ertelemeyi sınırla' };
  }
  if (snapshot.activeCount === 0) {
    return { id: 'steady', label: 'Dengeyi koru' };
  }
  if (snapshot.pressureLevel === 'moderate') {
    return { id: 'monitor', label: 'Bakımı kontrol et' };
  }
  return { id: 'act_now', label: 'Bakımı kontrol et' };
}
