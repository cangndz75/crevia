import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';

import { buildMaintenanceBacklogSnapshot } from './maintenanceBacklogModel';
import type {
  MaintenanceBacklogContext,
  MaintenanceBacklogItem,
  MaintenanceBacklogSnapshot,
  MaintenanceBacklogTone,
  MaintenanceHubSignal,
  MaintenanceSurfaceHint,
} from './maintenanceBacklogTypes';
import {
  MAINTENANCE_RUNTIME_DOMAIN_DESCRIPTIONS,
  MAINTENANCE_RUNTIME_DOMAIN_TITLES,
  MAINTENANCE_RUNTIME_MAX_VISIBLE,
  MAINTENANCE_RUNTIME_STATUS_LABELS,
} from './maintenanceBacklogRuntimeConstants';
import { selectActiveMaintenanceRuntimeItems } from './maintenanceBacklogRuntimeModel';
import type {
  MaintenanceBacklogRuntimeState,
  MaintenanceRuntimeItem,
  MaintenanceRuntimeSeverity,
} from './maintenanceBacklogRuntimeTypes';

export type MaintenanceBacklogRuntimePresentation = MaintenanceBacklogSnapshot & {
  hasRuntimeItems: boolean;
  runtimeItemCount: number;
  carriedItemCount: number;
};

function normalizeLine(value: string): string {
  return value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function isDuplicateLine(line: string, avoidLines: string[]): boolean {
  const normalized = normalizeLine(line);
  return avoidLines.some((avoid) => {
    const other = normalizeLine(avoid);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 18 && other.includes(normalized.slice(0, 18))) return true;
    if (other.length >= 18 && normalized.includes(other.slice(0, 18))) return true;
    return false;
  });
}

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function runtimeSeverityToTone(severity: MaintenanceRuntimeSeverity): MaintenanceBacklogTone {
  if (severity === 'critical') return 'critical';
  if (severity === 'strained') return 'warning';
  return 'mixed';
}

function runtimeSeverityToDerivedSeverity(
  severity: MaintenanceRuntimeSeverity,
): MaintenanceBacklogItem['severity'] {
  if (severity === 'critical') return 'critical';
  if (severity === 'strained') return 'strained';
  return 'attention';
}

function runtimeItemToPresentationItem(item: MaintenanceRuntimeItem): MaintenanceBacklogItem {
  const severity = runtimeSeverityToDerivedSeverity(item.severity);
  return {
    id: item.id,
    domain: item.domain,
    title: MAINTENANCE_RUNTIME_DOMAIN_TITLES[item.domain],
    description:
      item.status === 'carried' && item.carryOverDays >= 2
        ? `${MAINTENANCE_RUNTIME_DOMAIN_DESCRIPTIONS[item.domain]} Yarına taşındı.`
        : MAINTENANCE_RUNTIME_DOMAIN_DESCRIPTIONS[item.domain],
    severity,
    status:
      item.severity === 'critical'
        ? 'blocked_preview'
        : item.severity === 'strained'
          ? 'queued_preview'
          : 'monitoring',
    statusLabel: MAINTENANCE_RUNTIME_STATUS_LABELS[item.status],
    tone: runtimeSeverityToTone(item.severity),
    sourceReadinessId: item.sourceReadinessId,
    reasonChips: item.lastReasonLabels.map((label) => ({
      label,
      tone: 'warning' as const,
    })),
    nextHint:
      item.severity === 'critical'
        ? 'Sahaya çıkmadan önce kaynak durumunu netleştir.'
        : item.carryOverDays >= 1
          ? 'Yarına hazırlık için ekip yükünü dengele.'
          : undefined,
    priority:
      item.severity === 'critical' ? 100 : item.severity === 'strained' ? 75 : 45,
    dedupeKey: `runtime:${item.sourceDedupeKey}`,
  };
}

function buildRuntimeSummary(items: MaintenanceRuntimeItem[]): string {
  if (items.length === 0) return 'Hazırlık sinyalleri dengede; takip gerektiren aday yok.';
  const carried = items.filter((item) => item.status === 'carried');
  if (carried.some((item) => item.domain === 'personnel')) {
    return 'Ekip temposu yarına baskı taşıyor. Hazırlık sinyali izlenmeli.';
  }
  if (carried.length >= 2) {
    return 'Ekip temposu ve rota baskısı yarına taşındı.';
  }
  const top = items[0];
  if (top.status === 'carried') {
    return `${MAINTENANCE_RUNTIME_DOMAIN_TITLES[top.domain].toLowerCase()}. Yarına taşındı.`;
  }
  return MAINTENANCE_RUNTIME_DOMAIN_DESCRIPTIONS[top.domain];
}

function runtimeCountLabel(count: number, hasCritical: boolean): string {
  if (count <= 0) return 'Sinyal yok';
  if (hasCritical && count === 1) return '1 kritik hazırlık';
  if (count === 1) return '1 takip adayı';
  return `${count} takip adayı`;
}

export function buildMaintenanceBacklogRuntimePresentation(
  runtimeState: MaintenanceBacklogRuntimeState | null | undefined,
  derivedContext: MaintenanceBacklogContext,
  options?: { maxVisible?: number },
): MaintenanceBacklogRuntimePresentation {
  const derived = buildMaintenanceBacklogSnapshot(derivedContext);
  const maxVisible = options?.maxVisible ?? MAINTENANCE_RUNTIME_MAX_VISIBLE;
  const activeRuntime = selectActiveMaintenanceRuntimeItems(runtimeState ?? { items: [], attentionStreaks: {} });
  const runtimePresentationItems = activeRuntime.map(runtimeItemToPresentationItem);

  const runtimeDedupeKeys = new Set(
    activeRuntime.map((item) => item.sourceDedupeKey),
  );
  const runtimeDomains = new Set(activeRuntime.map((item) => item.domain));

  const supplementalDerived = derived.items.filter(
    (item) =>
      !runtimeDedupeKeys.has(item.dedupeKey) &&
      !runtimeDomains.has(item.domain) &&
      item.severity !== 'watch',
  );

  const mergedItems = [...runtimePresentationItems, ...supplementalDerived]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxVisible);

  const hasCritical = mergedItems.some(
    (item) => item.severity === 'critical' || item.tone === 'critical',
  );
  const carriedCount = activeRuntime.filter((item) => item.status === 'carried').length;

  const summary =
    activeRuntime.length > 0
      ? buildRuntimeSummary(activeRuntime)
      : derived.summary;

  const overallTone: MaintenanceBacklogTone = hasCritical
    ? 'critical'
    : mergedItems.some((i) => i.tone === 'warning')
      ? 'warning'
      : mergedItems.length > 0
        ? 'mixed'
        : derived.overallTone;

  return {
    title: 'Hazırlık Takibi',
    summary,
    overallTone,
    items: mergedItems,
    topItem: mergedItems[0],
    countLabel: runtimeCountLabel(mergedItems.length, hasCritical),
    hasCritical,
    hasRuntimeItems: activeRuntime.length > 0,
    runtimeItemCount: activeRuntime.length,
    carriedItemCount: carriedCount,
  };
}

export function buildMaintenanceRuntimeDispatchHint(
  presentation: MaintenanceBacklogRuntimePresentation,
  avoidLines: string[] = [],
): MaintenanceSurfaceHint | null {
  if (presentation.runtimeItemCount > 0) {
    const text = clamp(
      presentation.runtimeItemCount === 1
        ? 'Bakım kuyruğunda 1 takip adayı var.'
        : `Bakım kuyruğunda ${presentation.runtimeItemCount} takip adayı var.`,
      120,
    );
    if (isDuplicateLine(text, avoidLines)) return null;
    return {
      text,
      tone: presentation.overallTone,
      countLabel: presentation.countLabel,
    };
  }
  return null;
}

export function buildMaintenanceRuntimeFieldHint(
  presentation: MaintenanceBacklogRuntimePresentation,
  avoidLines: string[] = [],
): MaintenanceSurfaceHint | null {
  const carried = presentation.items.find((item) => item.nextHint?.includes('Yarına'));
  const top = carried ?? presentation.topItem;
  if (!top) return null;

  const text = clamp(
    presentation.carriedItemCount > 0
      ? `Taşınan hazırlık baskısı: ${top.title.replace(/ Yoruluyor| İzlenmeli| Birikiyor| Artıyor| Yüksek/g, '')}`
      : top.description,
    110,
  );
  if (isDuplicateLine(text, avoidLines)) return null;
  return { text, tone: top.tone };
}

export function buildMaintenanceRuntimeResultHint(
  presentation: MaintenanceBacklogRuntimePresentation,
  avoidLines: string[] = [],
): string | null {
  if (presentation.items.length === 0) return null;
  const text = clamp(
    'Bu karar bakım kuyruğuna yeni takip sinyali bırakabilir.',
    120,
  );
  if (isDuplicateLine(text, avoidLines)) return null;
  return text;
}

export function buildMaintenanceRuntimeReportLine(
  presentation: MaintenanceBacklogRuntimePresentation,
  avoidLines: string[] = [],
): string | null {
  if (!presentation.hasRuntimeItems) return null;
  const carried = presentation.carriedItemCount > 0;
  let line = presentation.summary;
  if (carried && presentation.topItem?.domain === 'personnel') {
    line = 'Ekip temposu ikinci güne taşındı. Yarın kaynak baskısını azaltmak önemli.';
  }
  const clamped = clamp(line, 160);
  if (isDuplicateLine(clamped, avoidLines)) return null;
  return clamped;
}

export function buildMaintenanceRuntimeHubSignal(
  presentation: MaintenanceBacklogRuntimePresentation,
  avoidLines: string[] = [],
): MaintenanceHubSignal | null {
  if (!presentation.hasRuntimeItems && presentation.items.length === 0) return null;

  const title = presentation.hasRuntimeItems ? 'Hazırlık Takibi' : presentation.topItem?.title ?? 'Hazırlık Takibi';
  const subtitle = clamp(presentation.summary, 90);
  if (isDuplicateLine(title, avoidLines) || isDuplicateLine(subtitle, avoidLines)) {
    return null;
  }

  return {
    title,
    subtitle,
    tone: presentation.overallTone,
    dedupeKey: presentation.topItem?.dedupeKey ?? 'runtime:hub',
  };
}

export function buildEceMaintenanceRuntimeHint(
  presentation: MaintenanceBacklogRuntimePresentation,
  playerStyleId?: PlayerStyleId | null,
  avoidLines: string[] = [],
): string | null {
  let hint: string;
  if (!presentation.hasRuntimeItems) {
    hint = 'Hazırlık baskısı düşük. Bu dengeyi korumak yarın alan açar.';
  } else if (presentation.hasCritical) {
    hint = 'Kritik hazırlık sinyali var. Yeni operasyondan önce kaynak durumunu netleştir.';
  } else if (presentation.runtimeItemCount <= 2) {
    hint = 'Bazı hazırlık sinyalleri yarına taşınıyor. Ekip yükünü dengele.';
  } else {
    hint = presentation.summary;
  }

  if (playerStyleId === 'fast_responder' && presentation.hasRuntimeItems) {
    hint = 'Hızlı müdahaleler işe yarıyor, ama bakım kuyruğu ekip temposunu göstermeye başladı.';
  } else if (playerStyleId === 'resource_guardian' && presentation.hasRuntimeItems) {
    hint = 'Kaynakları koruyorsun. Yine de hazırlık sinyallerini fazla erteleme.';
  }

  const clamped = clamp(hint, 120);
  if (isDuplicateLine(clamped, avoidLines)) return null;
  return clamped;
}
