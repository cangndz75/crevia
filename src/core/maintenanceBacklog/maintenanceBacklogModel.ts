import type {
  ReadinessSignalPresentation,
  ReadinessStatus,
} from '@/core/operationReadiness/operationReadinessTypes';

import {
  MAINTENANCE_DOMAIN_DESCRIPTIONS,
  MAINTENANCE_DOMAIN_TITLES,
  MAINTENANCE_EMPTY_SUMMARY,
  MAINTENANCE_READY_SUMMARY,
  MAINTENANCE_SEVERITY_TO_TONE,
  MAINTENANCE_SNAPSHOT_TITLE,
  MAINTENANCE_STATUS_LABELS,
  maintenanceCountLabel,
} from './maintenanceBacklogConstants';
import type {
  MaintenanceBacklogContext,
  MaintenanceBacklogDomain,
  MaintenanceBacklogItem,
  MaintenanceBacklogSeverity,
  MaintenanceBacklogSnapshot,
  MaintenanceBacklogStatus,
} from './maintenanceBacklogTypes';

const MAX_VISIBLE_ITEMS = 3;

const READINESS_TO_MAINTENANCE_DOMAIN: Partial<
  Record<ReadinessSignalPresentation['domain'], MaintenanceBacklogDomain>
> = {
  personnel: 'personnel',
  vehicle: 'vehicle',
  equipment: 'equipment',
  facility: 'facility',
  route: 'route',
  budget: 'budget',
  operation: 'operation',
};

export function deriveMaintenanceSeverity(status: ReadinessStatus): MaintenanceBacklogSeverity | null {
  if (status === 'ready' || status === 'unknown') return null;
  if (status === 'blocked') return 'critical';
  if (status === 'strained') return 'strained';
  if (status === 'limited') return 'attention';
  return null;
}

export function deriveMaintenanceStatus(
  severity: MaintenanceBacklogSeverity,
): MaintenanceBacklogStatus {
  if (severity === 'critical') return 'blocked_preview';
  if (severity === 'strained') return 'queued_preview';
  if (severity === 'attention') return 'monitoring';
  return 'monitoring';
}

export function deriveMaintenancePriority(
  status: ReadinessStatus,
  domain: MaintenanceBacklogDomain,
  socialPressure: boolean,
  repeatedDomain: boolean,
): number {
  if (status === 'blocked') return 100;
  if (status === 'strained' && repeatedDomain) return 85;
  if (status === 'strained') return 75;
  if (status === 'limited' && socialPressure) return 60;
  if (status === 'limited') return 45;
  if (status === 'unknown') return 20;
  return 0;
}

function buildReasonChips(
  signal: ReadinessSignalPresentation,
  socialSignal?: ReadinessSignalPresentation,
): MaintenanceBacklogItem['reasonChips'] {
  const chips: MaintenanceBacklogItem['reasonChips'] = [];
  if (
    socialSignal &&
    (socialSignal.status === 'limited' ||
      socialSignal.status === 'strained' ||
      socialSignal.status === 'blocked')
  ) {
    chips.push({ label: 'Sosyal tepki yüksek', tone: 'warning' });
  }
  if (signal.status === 'strained' || signal.status === 'blocked') {
    chips.push({ label: 'Hazırlık sinyali', tone: 'warning' });
  }
  return chips;
}

function applyPlayerStyleDescription(
  domain: MaintenanceBacklogDomain,
  description: string,
  playerStyleId: MaintenanceBacklogContext['playerStyleId'],
): string {
  if (playerStyleId === 'fast_responder' && domain === 'personnel') {
    return 'Hızlı müdahaleler ekip temposunda takip sinyali bırakıyor.';
  }
  if (playerStyleId === 'resource_guardian' && domain === 'budget') {
    return 'Kaynak koruma çizgin iyi, ancak hazırlık sinyallerini fazla erteleme.';
  }
  if (playerStyleId === 'balanced_operator' && domain === 'operation') {
    return 'Hazırlık baskısını dengede tutuyorsun.';
  }
  return description;
}

function applyDistrictFlavor(
  domain: MaintenanceBacklogDomain,
  description: string,
  ctx: MaintenanceBacklogContext,
): string {
  if (domain === 'route' && ctx.districtRouteFlavor?.trim()) {
    return ctx.districtRouteFlavor.trim();
  }
  if (domain === 'personnel' && ctx.districtSocialFlavor?.trim() && description.includes('kapasite')) {
    return 'Hizmet görünürlüğü ekip hazırlığıyla doğrudan ilişkili.';
  }
  return description;
}

export function buildMaintenanceBacklogItems(
  ctx: MaintenanceBacklogContext,
): MaintenanceBacklogItem[] {
  const { readinessSnapshot } = ctx;
  const socialSignal = readinessSnapshot.signals.find((s) => s.domain === 'social');
  const socialPressure =
    socialSignal?.status === 'limited' ||
    socialSignal?.status === 'strained' ||
    socialSignal?.status === 'blocked';

  const domainCounts = new Map<MaintenanceBacklogDomain, number>();
  const items: MaintenanceBacklogItem[] = [];

  for (const signal of readinessSnapshot.signals) {
    if (signal.domain === 'social') continue;

    const domain = READINESS_TO_MAINTENANCE_DOMAIN[signal.domain];
    if (!domain) continue;

    const severity = deriveMaintenanceSeverity(signal.status);
    if (!severity) continue;

    const repeated = (domainCounts.get(domain) ?? 0) > 0;
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);

    const status = deriveMaintenanceStatus(severity);
    let description = MAINTENANCE_DOMAIN_DESCRIPTIONS[domain];
    description = applyPlayerStyleDescription(domain, description, ctx.playerStyleId);
    description = applyDistrictFlavor(domain, description, ctx);

    const priority = deriveMaintenancePriority(
      signal.status,
      domain,
      socialPressure,
      repeated,
    );

    items.push({
      id: `maintenance-${domain}`,
      domain,
      title: MAINTENANCE_DOMAIN_TITLES[domain],
      description,
      severity,
      status,
      statusLabel: MAINTENANCE_STATUS_LABELS[status],
      tone: MAINTENANCE_SEVERITY_TO_TONE[severity],
      sourceReadinessId: signal.id,
      reasonChips: buildReasonChips(signal, socialSignal),
      nextHint:
        severity === 'critical'
          ? 'Sahaya çıkmadan önce kaynak durumunu netleştir.'
          : severity === 'strained'
            ? 'Kısa ve net müdahale yarına kapasite bırakır.'
            : undefined,
      priority,
      dedupeKey: `maintenance:${domain}:${severity}`,
    });
  }

  return dedupeMaintenanceBacklogItems(items);
}

export function dedupeMaintenanceBacklogItems(
  items: MaintenanceBacklogItem[],
): MaintenanceBacklogItem[] {
  const seen = new Set<string>();
  const result: MaintenanceBacklogItem[] = [];

  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  for (const item of sorted) {
    if (seen.has(item.dedupeKey)) continue;
    seen.add(item.dedupeKey);
    result.push(item);
    if (result.length >= MAX_VISIBLE_ITEMS) break;
  }

  return result;
}

export function selectTopMaintenanceItems(
  items: MaintenanceBacklogItem[],
  limit = MAX_VISIBLE_ITEMS,
): MaintenanceBacklogItem[] {
  return [...items].sort((a, b) => b.priority - a.priority).slice(0, limit);
}

function buildSnapshotSummary(
  items: MaintenanceBacklogItem[],
  overallStatus: ReadinessStatus,
): string {
  if (items.length === 0) {
    if (overallStatus === 'ready') return MAINTENANCE_READY_SUMMARY;
    if (overallStatus === 'unknown') return MAINTENANCE_EMPTY_SUMMARY;
    return MAINTENANCE_READY_SUMMARY;
  }

  const top = items[0];
  if (top.severity === 'critical') {
    return `${top.title.toLowerCase()}. Hazırlık sinyali izlenmeli.`;
  }
  if (top.domain === 'personnel') {
    return 'Ekip temposu yarına baskı taşıyor. Hazırlık sinyali izlenmeli.';
  }
  if (top.domain === 'route' || top.domain === 'budget') {
    return 'Rota ve kaynak baskısı takip adayı olarak öne çıkıyor.';
  }
  return top.description;
}

export function buildMaintenanceBacklogSnapshot(
  ctx: MaintenanceBacklogContext,
): MaintenanceBacklogSnapshot {
  const items = buildMaintenanceBacklogItems(ctx);
  const visibleItems = selectTopMaintenanceItems(items);
  const hasCritical = visibleItems.some((item) => item.severity === 'critical');
  const topItem = visibleItems[0];
  const overallTone =
    hasCritical ? 'critical' : visibleItems.some((i) => i.severity === 'strained') ? 'warning' : visibleItems.length > 0 ? 'mixed' : 'positive';

  return {
    title: MAINTENANCE_SNAPSHOT_TITLE,
    summary: buildSnapshotSummary(visibleItems, ctx.readinessSnapshot.overallStatus),
    overallTone,
    items: visibleItems,
    topItem,
    countLabel: maintenanceCountLabel(visibleItems.length, hasCritical),
    hasCritical,
  };
}
