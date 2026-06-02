import { buildActiveTaskRouteForEvent } from '@/core/activeTaskRoutes/activeTaskRouteUiPresentation';
import type { CreviaActiveTaskRouteUiContext, CreviaActiveTaskRouteUiModel } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import {
  buildDistrictMemoryRuntimeSnapshot,
  getDistrictMemoryDistrictSnapshot,
} from '@/core/districtMemoryRuntime/districtMemoryRuntimeModel';
import {
  buildDistrictMemoryTomorrowPreviewLine,
  districtMemoryRuntimeCopyContainsForbiddenTerms,
  districtMemoryRuntimeCopyContainsPanicTerms,
} from '@/core/districtMemoryRuntime/districtMemoryRuntimePresentation';
import type { CreviaDistrictMemoryKind, CreviaDistrictMemorySignalContext } from '@/core/districtMemoryRuntime/districtMemoryRuntimeTypes';
import { getDistrictMemoryRuntimeKindDefinition } from '@/core/districtMemoryRuntime/districtMemoryRuntimeConstants';
import {
  buildDistrictOperationsRuntimeSnapshot,
  getDistrictOperationRuntimeDistrictSnapshot,
} from '@/core/districtOperationsRuntime/districtOperationsRuntimeModel';
import {
  buildDistrictOperationReportLine,
  buildDistrictOperationTomorrowPreviewLine,
  districtOperationsRuntimeCopyContainsForbiddenTerms,
  districtOperationsRuntimeCopyContainsPanicTerms,
} from '@/core/districtOperationsRuntime/districtOperationsRuntimePresentation';
import type { CreviaDistrictOperationRuntimeContext } from '@/core/districtOperationsRuntime/districtOperationsRuntimeTypes';
import {
  buildDistrictTrustRuntimeSnapshot,
  getDistrictTrustDistrictSnapshot,
} from '@/core/districtTrustRuntime/districtTrustRuntimeModel';
import {
  buildDistrictTrustTomorrowPreviewLine,
  districtTrustRuntimeCopyContainsForbiddenTerms,
  districtTrustRuntimeCopyContainsPanicTerms,
} from '@/core/districtTrustRuntime/districtTrustRuntimePresentation';
import type { CreviaDistrictTrustBand, CreviaDistrictTrustSignalContext } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import { getDistrictTrustRuntimeBandDefinition } from '@/core/districtTrustRuntime/districtTrustRuntimeConstants';
import {
  buildEventVariantContextFromEvent,
  resolveEventVariantForContext,
  shouldSuppressVariantEchoDuplicate,
} from '@/core/eventVariants/eventVariantResolver';
import { buildEventVariantSurfaceLine } from '@/core/eventVariants/eventVariantPresentation';
import type { CreviaEventVariantContext, CreviaResolvedEventVariant } from '@/core/eventVariants/eventVariantTypes';
import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { ReportTomorrowPreviewSummary } from '@/core/reports/reportTomorrowPreviewTypes';

export const REPORT_SYSTEMS_MAX_COPY_LENGTH = 96;
export const REPORT_SYSTEMS_MOBILE_COPY_LENGTH = 72;
export const REPORT_SYSTEMS_MAX_VISIBLE_LINES = 5;

export const REPORT_SYSTEMS_FORBIDDEN_TERMS: readonly string[] = [
  'oyun sonu',
  'sezon finali',
  '14 gün bitti',
  'premium',
  'satın al',
  'kilitli',
  'panik',
  'çöktü',
  'başarısız',
  'canlı gps',
  'gerçek zamanlı rota',
  'gerçek zamanlı takip',
  'kesin varış',
  'pathfinding',
  'başlat',
  'operasyonu aç',
  'hemen uygula',
] as const;

export const REPORT_SYSTEMS_OPERATION_CTA_TERMS: readonly string[] = [
  'başlat',
  'seç',
  'operasyonu aç',
  'operasyonu başlat',
  'hemen uygula',
] as const;

export type CreviaReportSystemsLineKind =
  | 'variant'
  | 'active_route'
  | 'district_trust'
  | 'district_memory'
  | 'district_operation'
  | 'resource_fatigue'
  | 'map_after_effect'
  | 'tomorrow_carry_over'
  | 'crisis_watch'
  | 'operation_signal';

export type CreviaReportSystemsLineTone = 'teal' | 'mint' | 'gold' | 'neutral' | 'warn';

export type CreviaReportSystemsLine = {
  id: string;
  kind: CreviaReportSystemsLineKind;
  label: string;
  text: string;
  tone: CreviaReportSystemsLineTone;
  iconKey: string;
  priority: number;
  source: string;
  maxLines: number;
  isHintOnly: true;
};

export type CreviaReportVariantSummary = {
  kind: string;
  text?: string;
  visible: boolean;
};

export type CreviaReportRouteSummary = {
  phase?: string;
  text?: string;
  visible: boolean;
};

export type CreviaReportDistrictTrustSummary = {
  band?: CreviaDistrictTrustBand;
  text?: string;
  visible: boolean;
};

export type CreviaReportDistrictMemorySummary = {
  memoryKind?: CreviaDistrictMemoryKind;
  text?: string;
  visible: boolean;
};

export type CreviaReportDistrictOperationSummary = {
  text?: string;
  visible: boolean;
};

export type CreviaReportTomorrowSummary = {
  text?: string;
  visible: boolean;
};

export type CreviaReportSystemsVisibilityMode =
  | 'hidden'
  | 'learning'
  | 'compact'
  | 'standard'
  | 'detailed';

export type CreviaReportSystemsVisibility = {
  mode: CreviaReportSystemsVisibilityMode;
  maxVisibleLines: number;
  showVariant: boolean;
  showRoute: boolean;
  showTrust: boolean;
  showMemory: boolean;
  showOperation: boolean;
  showTomorrow: boolean;
  showResourceFatigue: boolean;
  showMapAfterEffect: boolean;
};

export type CreviaReportSystemsIntegrationModel = {
  visible: boolean;
  title: string;
  visibility: CreviaReportSystemsVisibility;
  lines: CreviaReportSystemsLine[];
  variantSummary: CreviaReportVariantSummary;
  routeSummary: CreviaReportRouteSummary;
  trustSummary: CreviaReportDistrictTrustSummary;
  memorySummary: CreviaReportDistrictMemorySummary;
  operationSummary: CreviaReportDistrictOperationSummary;
  tomorrowSummary: CreviaReportTomorrowSummary;
  isHintOnly: true;
};

export type CreviaReportSystemsIntegrationInput = {
  dailyReport?: DailyReport | null;
  day?: number;
  focusDistrictId?: string;
  lastEvent?: EventCard | null;
  variantContext?: CreviaEventVariantContext;
  resolvedVariant?: CreviaResolvedEventVariant;
  districtTrustContext?: CreviaDistrictTrustSignalContext;
  districtMemoryContext?: CreviaDistrictMemorySignalContext;
  districtOperationContext?: CreviaDistrictOperationRuntimeContext;
  activeTaskRouteContext?: CreviaActiveTaskRouteUiContext;
  activeTaskRouteUiModel?: CreviaActiveTaskRouteUiModel;
  operationSignals?: OperationSignalsState | null;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  carryOverMemory?: CarryOverMemoryModel | null;
  reportTomorrowPreview?: ReportTomorrowPreviewSummary | null;
  mapAfterEffectSummary?: string;
  rankKey?: string;
  unlockedPermissionIds?: string[];
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  existingEchoLines?: string[];
  suppressResourceFatigue?: boolean;
  resourceFatiguePanelLine?: string;
};

const TRUST_REPORT_INTENT: Record<CreviaDistrictTrustBand, string> = {
  fragile: 'Güven hassas; gün sonu raporu temkinli okunuyor.',
  strained: 'Baskı görünür; mahalle temkinle izleniyor.',
  watch: 'Güven sinyali gün sonuna yansıdı.',
  stable: 'Güven dengeli; rapor rutin akışta okunuyor.',
  trusted: 'Güven destekliyor; gün olumlu kapandı.',
  improving: 'İyileşen güven bugünkü raporu görünür kıldı.',
  recovering: 'Toparlanma penceresi gün sonuna yansıdı.',
};

const MEMORY_REPORT_INTENT: Partial<Record<CreviaDistrictMemoryKind, string>> = {
  unresolved_carry_over: 'Önceki kararın izi bugünkü raporda görünür.',
  repeated_pressure: 'Tekrarlayan baskı yarın için not düştü.',
  recent_improvement: 'İyi karar mahallede görünür bir iz bıraktı.',
  recovery_window: 'Toparlanma penceresi raporu destekledi.',
  trust_shift: 'Güven kayması gün sonu tonunu etkiledi.',
  resource_strain: 'Kaynak baskısı raporda daha belirgin.',
  social_echo: 'Sosyal yankı gün sonuna yansıdı.',
  crisis_watch: 'Risk kontrol penceresi günü sınırladı.',
  operation_followup: 'Takip konusu yarın gündeme gelebilir.',
  quiet_stable: 'Sakin akış gün sonunu dengeli kapattı.',
};

const DAY1_LEARNING_LINE =
  'İlk gün raporu operasyon ritmini tanıtıyor; yarın daha net izler görünür.';

function clampCopy(text: string, max = REPORT_SYSTEMS_MOBILE_COPY_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function normalizeEcho(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function reportSystemsCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = normalizeEcho(text);
  return (
    REPORT_SYSTEMS_FORBIDDEN_TERMS.some((term) => normalized.includes(term)) ||
    districtTrustRuntimeCopyContainsForbiddenTerms(text) ||
    districtMemoryRuntimeCopyContainsForbiddenTerms(text) ||
    districtOperationsRuntimeCopyContainsForbiddenTerms(text)
  );
}

export function reportSystemsCopyContainsPanicTerms(text: string): boolean {
  const normalized = normalizeEcho(text);
  return (
    ['panik', 'çöktü', 'başarısız', 'felaket'].some((term) => normalized.includes(term)) ||
    districtTrustRuntimeCopyContainsPanicTerms(text) ||
    districtMemoryRuntimeCopyContainsPanicTerms(text) ||
    districtOperationsRuntimeCopyContainsPanicTerms(text)
  );
}

export function reportSystemsOperationLooksLikeCta(text: string): boolean {
  const normalized = normalizeEcho(text);
  return REPORT_SYSTEMS_OPERATION_CTA_TERMS.some((term) => normalized.includes(term));
}

function safeCopy(text: string, fallback: string, max = REPORT_SYSTEMS_MOBILE_COPY_LENGTH): string {
  const clamped = clampCopy(text, max);
  if (reportSystemsCopyContainsForbiddenTerms(clamped) || reportSystemsCopyContainsPanicTerms(clamped)) {
    return clampCopy(fallback, max);
  }
  return clamped;
}

function districtName(id: MapDistrictId | string): string {
  const normalized = normalizeMapDistrictId(id) ?? 'merkez';
  return DISTRICT_IDENTITIES[normalized]?.name ?? normalized;
}

function resolveDistrictId(input: CreviaReportSystemsIntegrationInput): MapDistrictId | undefined {
  const raw =
    input.focusDistrictId ??
    input.lastEvent?.neighborhoodId ??
    input.lastEvent?.districtIds?.[0];
  return normalizeMapDistrictId(raw ?? undefined) ?? undefined;
}

function buildSignalContext(input: CreviaReportSystemsIntegrationInput, districtId: MapDistrictId) {
  const day = input.day ?? input.dailyReport?.day ?? 1;
  return {
    day,
    focusDistrictId: districtId,
    operationSignals: input.operationSignals,
    resourceFatigue: input.resourceFatigue,
    crisisState: input.crisisState,
    rankKey: input.rankKey,
    unlockedPermissionIds: input.unlockedPermissionIds,
    carryOverMemory: input.carryOverMemory,
    ...input.districtTrustContext,
    ...input.districtMemoryContext,
    ...input.districtOperationContext,
  };
}

function isDuplicate(text: string, existing: string[]): boolean {
  const normalized = normalizeEcho(text);
  if (!normalized) return true;
  return existing.some((line) => {
    const other = normalizeEcho(line);
    if (!other) return false;
    if (other === normalized) return true;
    if (other.includes(normalized) || normalized.includes(other)) return true;
    const prefix = normalized.slice(0, Math.min(24, normalized.length));
    return prefix.length >= 12 && other.includes(prefix);
  });
}

function hasCrisisPriority(input: CreviaReportSystemsIntegrationInput): boolean {
  const blob = JSON.stringify(input.crisisState ?? '').toLocaleLowerCase('tr-TR');
  return ['active', 'watch', 'elevated', 'critical'].some((token) => blob.includes(token));
}

export function buildReportSystemsVisibility(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportSystemsVisibility {
  const day = input.day ?? input.dailyReport?.day ?? 1;
  const isPostPilot =
    input.isPostPilot === true ||
    day >= POST_PILOT_FIRST_OPERATION_DAY ||
    input.isPilotCompleted === true;
  const rankKey = input.rankKey ?? '';
  const permissions = input.unlockedPermissionIds ?? [];
  const highRank =
    rankKey.includes('director') ||
    rankKey.includes('chief') ||
    permissions.includes('district_specific_operations_preview');
  const crisisPriority = hasCrisisPriority(input);

  if (!input.dailyReport) {
    return {
      mode: 'hidden',
      maxVisibleLines: 0,
      showVariant: false,
      showRoute: false,
      showTrust: false,
      showMemory: false,
      showOperation: false,
      showTomorrow: false,
      showResourceFatigue: false,
      showMapAfterEffect: false,
    };
  }

  if (day <= 1) {
    return {
      mode: 'learning',
      maxVisibleLines: 1,
      showVariant: true,
      showRoute: false,
      showTrust: false,
      showMemory: false,
      showOperation: false,
      showTomorrow: false,
      showResourceFatigue: false,
      showMapAfterEffect: false,
    };
  }

  if (day <= 3) {
    return {
      mode: 'compact',
      maxVisibleLines: 2,
      showVariant: true,
      showRoute: day >= 2,
      showTrust: day >= 2,
      showMemory: false,
      showOperation: false,
      showTomorrow: day >= 3,
      showResourceFatigue: !input.suppressResourceFatigue && crisisPriority,
      showMapAfterEffect: false,
    };
  }

  if (day <= 7) {
    return {
      mode: 'standard',
      maxVisibleLines: 4,
      showVariant: true,
      showRoute: true,
      showTrust: true,
      showMemory: true,
      showOperation: false,
      showTomorrow: true,
      showResourceFatigue: !input.suppressResourceFatigue,
      showMapAfterEffect: true,
    };
  }

  if (isPostPilot && highRank) {
    return {
      mode: 'detailed',
      maxVisibleLines: REPORT_SYSTEMS_MAX_VISIBLE_LINES,
      showVariant: true,
      showRoute: true,
      showTrust: true,
      showMemory: true,
      showOperation: true,
      showTomorrow: true,
      showResourceFatigue: !input.suppressResourceFatigue,
      showMapAfterEffect: true,
    };
  }

  return {
    mode: 'standard',
    maxVisibleLines: REPORT_SYSTEMS_MAX_VISIBLE_LINES,
    showVariant: true,
    showRoute: true,
    showTrust: true,
    showMemory: true,
    showOperation: isPostPilot,
    showTomorrow: true,
    showResourceFatigue: !input.suppressResourceFatigue,
    showMapAfterEffect: true,
  };
}

export function buildReportVariantSummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportVariantSummary {
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (!input.dailyReport) return { kind: 'normal', visible: false };

  if (day <= 1) {
    return {
      kind: 'normal',
      text: safeCopy(DAY1_LEARNING_LINE, DAY1_LEARNING_LINE),
      visible: true,
    };
  }

  const variantContext: CreviaEventVariantContext = {
    ...buildEventVariantContextFromEvent(input.lastEvent, {
      day,
      districtId: resolveDistrictId(input),
      eventDomain: input.lastEvent?.category,
      ...input.variantContext,
    }),
    ...input.variantContext,
  };

  const resolved = input.resolvedVariant ?? resolveEventVariantForContext(variantContext);
  const text = buildEventVariantSurfaceLine(resolved, 'report');
  if (!text || resolved.kind === 'normal') {
    const fallback = input.dailyReport.summaryLines?.[0];
    if (fallback?.trim()) {
      return { kind: resolved.kind, text: safeCopy(fallback, 'Operasyon günü planlandığı gibi ilerledi.'), visible: true };
    }
    return { kind: resolved.kind, visible: false };
  }
  if (resolved.kind === 'operation_era' && resolved.isPrimaryEventVariant) {
    return { kind: resolved.kind, visible: false };
  }

  return {
    kind: resolved.kind,
    text: safeCopy(text, 'Operasyon günü planlandığı gibi ilerledi.'),
    visible: true,
  };
}

export function buildReportActiveRouteSummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportRouteSummary {
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (day <= 1 || !input.lastEvent) return { visible: false };

  const routeModel =
    input.activeTaskRouteUiModel ??
    buildActiveTaskRouteForEvent({
      day,
      activeEvent: input.lastEvent,
      operationSignals: input.operationSignals,
      operationalResources: input.resourceFatigue,
      crisisState: input.crisisState,
      eventPhase: 'result',
      rankKey: input.rankKey,
      unlockedPermissionIds: input.unlockedPermissionIds,
      ...input.activeTaskRouteContext,
    });

  if (!routeModel.visible) return { visible: false, phase: routeModel.phase };

  const text = safeCopy(
    routeModel.reportLine || routeModel.statusLine,
    'Saha yönü gün sonu raporuna bağlandı.',
  );

  return {
    phase: routeModel.phase,
    text,
    visible: Boolean(text),
  };
}

export function buildReportDistrictTrustSummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportDistrictTrustSummary {
  const districtId = resolveDistrictId(input);
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (!districtId || day <= 1 || !input.dailyReport) return { visible: false };

  const context = buildSignalContext(input, districtId);
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const district = getDistrictTrustDistrictSnapshot(snapshot, districtId);
  if (!district) return { visible: false };

  const def = getDistrictTrustRuntimeBandDefinition(district.band);
  const intent = TRUST_REPORT_INTENT[district.band] ?? def.reportCopyIntent;
  const text = safeCopy(`${district.districtName}: ${intent}`, `${district.districtName}: güven sinyali aktif.`);

  return { band: district.band, text, visible: true };
}

export function buildReportDistrictMemorySummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportDistrictMemorySummary {
  const districtId = resolveDistrictId(input);
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (!districtId || day <= 2 || !input.dailyReport) return { visible: false };

  const context = buildSignalContext(input, districtId);
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  const district = getDistrictMemoryDistrictSnapshot(snapshot, districtId);
  if (!district) return { visible: false };

  const def = getDistrictMemoryRuntimeKindDefinition(district.primaryKind);
  const intent =
    MEMORY_REPORT_INTENT[district.primaryKind] ??
    district.primaryTrace?.reportHint ??
    def.reportCopyIntent;
  const text = safeCopy(`${district.districtName}: ${intent}`, `${district.districtName}: mahalle izi sakin.`);

  return { memoryKind: district.primaryKind, text, visible: true };
}

export function buildReportDistrictOperationSummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportDistrictOperationSummary {
  const districtId = resolveDistrictId(input);
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (!districtId || day <= 3 || !input.dailyReport) return { visible: false };

  const context = buildSignalContext(input, districtId);
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  const district = getDistrictOperationRuntimeDistrictSnapshot(snapshot, districtId);
  if (!district?.primary) return { visible: false };

  const reportLine = buildDistrictOperationReportLine(districtId, context);
  const text = safeCopy(
    reportLine.includes('Başlat') || reportSystemsOperationLooksLikeCta(reportLine)
      ? `Sıradaki odak: ${district.districtName} mahalle operasyon ihtiyacı izleniyor.`
      : reportLine,
    `Mahalle operasyon ihtiyacı ${district.districtName} çevresinde not edildi.`,
  );

  if (reportSystemsOperationLooksLikeCta(text)) return { visible: false };

  return { text, visible: true };
}

export function buildReportTomorrowCarryOverSummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportTomorrowSummary {
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (day <= 1 || !input.dailyReport) return { visible: false };

  const existing = input.existingEchoLines ?? [];
  const candidates: string[] = [];

  const previewSummary = input.reportTomorrowPreview?.preview?.summary?.trim();
  if (previewSummary && !isDuplicate(previewSummary, existing)) {
    candidates.push(previewSummary);
  }

  const carrySummary = input.carryOverMemory?.summary?.trim();
  if (carrySummary && !isDuplicate(carrySummary, existing)) {
    candidates.push(carrySummary);
  }

  const districtId = resolveDistrictId(input);
  if (districtId) {
    const context = buildSignalContext(input, districtId);
    candidates.push(buildDistrictMemoryTomorrowPreviewLine(districtId, context));
    candidates.push(buildDistrictTrustTomorrowPreviewLine(districtId, context));
    if (day >= 4) {
      candidates.push(buildDistrictOperationTomorrowPreviewLine(districtId, context));
    }
  }

  for (const raw of candidates) {
    const text = safeCopy(raw, 'Yarın operasyon öncelikleri daha net görünebilir.');
    if (!isDuplicate(text, existing)) {
      return { text, visible: true };
    }
  }

  return { visible: false };
}

export function buildReportResourceFatigueSummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportTomorrowSummary {
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (day <= 1 || !input.dailyReport || input.suppressResourceFatigue) {
    return { visible: false };
  }

  const existing = input.existingEchoLines ?? [];
  const panelLine = input.resourceFatiguePanelLine?.trim();
  if (panelLine && isDuplicate(panelLine, existing)) {
    return { visible: false };
  }

  const blob = JSON.stringify(input.resourceFatigue ?? input.operationSignals ?? '').toLocaleLowerCase('tr-TR');
  let text = '';
  if (blob.includes('vehicle') || blob.includes('route')) {
    text = 'Araç baskısı yarına kısa takip bırakıyor.';
  } else if (blob.includes('container')) {
    text = 'Konteyner ağı bugün daha dengeli kapandı.';
  } else if (blob.includes('personnel') || blob.includes('morale')) {
    text = 'Ekip yorgunluğu düşük tutuldu.';
  } else if (panelLine) {
    text = panelLine;
  }

  if (!text) return { visible: false };
  const safe = safeCopy(text, 'Kaynak dengesi gün sonuna yansıdı.');
  if (isDuplicate(safe, existing)) return { visible: false };
  return { text: safe, visible: true };
}

export function buildReportMapAfterEffectSummary(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportTomorrowSummary {
  const day = input.day ?? input.dailyReport?.day ?? 1;
  if (day <= 1 || !input.dailyReport) return { visible: false };

  const summary = input.mapAfterEffectSummary?.trim();
  if (!summary) return { visible: false };

  const existing = input.existingEchoLines ?? [];
  const text = safeCopy(summary, 'Harita etkisi gün sonuna yansıdı.');
  if (isDuplicate(text, existing)) return { visible: false };
  return { text, visible: true };
}

function toLine(
  summary: { visible: boolean; text?: string },
  kind: CreviaReportSystemsLineKind,
  label: string,
  iconKey: string,
  tone: CreviaReportSystemsLineTone,
  priority: number,
  source: string,
): CreviaReportSystemsLine | null {
  if (!summary.visible || !summary.text?.trim()) return null;
  return {
    id: `report-systems-${kind}`,
    kind,
    label,
    text: clampCopy(summary.text, REPORT_SYSTEMS_MAX_COPY_LENGTH),
    tone,
    iconKey,
    priority,
    source,
    maxLines: 2,
    isHintOnly: true,
  };
}

function pickDistrictSocialLines(
  trust: CreviaReportDistrictTrustSummary,
  memory: CreviaReportDistrictMemorySummary,
  maxSocialSlots: number,
  existing: string[],
): CreviaReportSystemsLine[] {
  const trustLine = toLine(trust, 'district_trust', 'Mahalle Güveni', 'shield-checkmark-outline', 'teal', 72, 'district_trust');
  const memoryLine = toLine(memory, 'district_memory', 'Mahalle Hafızası', 'layers-outline', 'mint', 68, 'district_memory');

  const lines: CreviaReportSystemsLine[] = [];
  if (trustLine && !isDuplicate(trustLine.text, existing)) lines.push(trustLine);
  if (memoryLine && !isDuplicate(memoryLine.text, existing)) lines.push(memoryLine);

  if (lines.length <= maxSocialSlots) return lines;
  lines.sort((a, b) => b.priority - a.priority);
  return lines.slice(0, maxSocialSlots);
}

export function buildReportSystemsDebugRows(
  input: CreviaReportSystemsIntegrationInput = {},
): string[] {
  const model = buildReportSystemsIntegrationModel(input);
  return [
    `visible: ${model.visible}`,
    `mode: ${model.visibility.mode}`,
    `maxLines: ${model.visibility.maxVisibleLines}`,
    `lineCount: ${model.lines.length}`,
    `variant: ${model.variantSummary.kind} ${model.variantSummary.visible}`,
    `route: ${model.routeSummary.phase ?? 'n/a'} ${model.routeSummary.visible}`,
    `trust: ${model.trustSummary.band ?? 'n/a'} ${model.trustSummary.visible}`,
    `memory: ${model.memorySummary.memoryKind ?? 'n/a'} ${model.memorySummary.visible}`,
    `operation: ${model.operationSummary.visible}`,
    `tomorrow: ${model.tomorrowSummary.visible}`,
    ...model.lines.map((line) => `${line.kind}: ${line.text.slice(0, 48)}`),
  ];
}

export function buildReportSystemsIntegrationModel(
  input: CreviaReportSystemsIntegrationInput = {},
): CreviaReportSystemsIntegrationModel {
  const visibility = buildReportSystemsVisibility(input);
  const existing = [
    ...(input.existingEchoLines ?? []),
    ...(input.dailyReport?.summaryLines ?? []),
    ...(input.dailyReport?.carryOverSummaryLines ?? []),
    input.carryOverMemory?.summary ?? '',
    input.reportTomorrowPreview?.preview?.summary ?? '',
    input.resourceFatiguePanelLine ?? '',
    input.mapAfterEffectSummary ?? '',
  ].filter(Boolean);

  const emptyModel: CreviaReportSystemsIntegrationModel = {
    visible: false,
    title: 'Bugünün Sistem İzleri',
    visibility,
    lines: [],
    variantSummary: { kind: 'normal', visible: false },
    routeSummary: { visible: false },
    trustSummary: { visible: false },
    memorySummary: { visible: false },
    operationSummary: { visible: false },
    tomorrowSummary: { visible: false },
    isHintOnly: true,
  };

  if (!input.dailyReport || visibility.maxVisibleLines <= 0) return emptyModel;

  const variantSummary = buildReportVariantSummary(input);
  const routeSummary = buildReportActiveRouteSummary(input);
  const trustSummary = buildReportDistrictTrustSummary(input);
  const memorySummary = buildReportDistrictMemorySummary(input);
  const operationSummary = buildReportDistrictOperationSummary(input);
  const tomorrowSummary = buildReportTomorrowCarryOverSummary({ ...input, existingEchoLines: existing });
  const resourceSummary = buildReportResourceFatigueSummary({ ...input, existingEchoLines: existing });
  const mapSummary = buildReportMapAfterEffectSummary({ ...input, existingEchoLines: existing });

  const crisisBoost = hasCrisisPriority(input) ? 8 : 0;
  const candidates: CreviaReportSystemsLine[] = [];

  if (visibility.showVariant) {
    const variantLine = toLine(variantSummary, 'variant', 'Operasyon Tonu', 'sparkles-outline', 'gold', 90, 'event_variant');
    if (variantLine && !shouldSuppressVariantEchoDuplicate(variantLine.text, existing.join(' '))) {
      if (!isDuplicate(variantLine.text, existing)) candidates.push(variantLine);
    }
  }

  if (visibility.showRoute) {
    const routeLine = toLine(routeSummary, 'active_route', 'Saha Akışı', 'navigate-outline', 'mint', 84, 'active_task_route');
    if (routeLine && !isDuplicate(routeLine.text, existing)) candidates.push(routeLine);
  }

  const socialSlots = visibility.maxVisibleLines >= 4 ? 2 : 1;
  if (visibility.showTrust || visibility.showMemory) {
    candidates.push(
      ...pickDistrictSocialLines(
        visibility.showTrust ? trustSummary : { visible: false },
        visibility.showMemory ? memorySummary : { visible: false },
        socialSlots,
        [...existing, ...candidates.map((l) => l.text)],
      ),
    );
  }

  if (visibility.showOperation) {
    const opLine = toLine(operationSummary, 'district_operation', 'Sıradaki Odak', 'clipboard-outline', 'neutral', 58, 'district_operations');
    if (opLine && !isDuplicate(opLine.text, existing)) candidates.push(opLine);
  }

  if (visibility.showResourceFatigue) {
    const fatigueLine = toLine(resourceSummary, 'resource_fatigue', 'Kaynak Dengesi', 'battery-half-outline', 'warn', 56 + crisisBoost, 'resource_fatigue');
    if (fatigueLine && !isDuplicate(fatigueLine.text, existing)) candidates.push(fatigueLine);
  }

  if (visibility.showMapAfterEffect) {
    const mapLine = toLine(mapSummary, 'map_after_effect', 'Harita Etkisi', 'map-outline', 'teal', 54, 'map_presence');
    if (mapLine && !isDuplicate(mapLine.text, existing)) candidates.push(mapLine);
  }

  if (visibility.showTomorrow) {
    const tomorrowLine = toLine(tomorrowSummary, 'tomorrow_carry_over', 'Yarına İz', 'arrow-forward-circle-outline', 'teal', 52, 'carry_over');
    if (tomorrowLine && !isDuplicate(tomorrowLine.text, existing)) candidates.push(tomorrowLine);
  }

  candidates.sort((a, b) => b.priority - a.priority);

  const lines: CreviaReportSystemsLine[] = [];
  const usedKinds = new Set<CreviaReportSystemsLineKind>();
  for (const line of candidates) {
    if (lines.length >= visibility.maxVisibleLines) break;
    if (usedKinds.has(line.kind)) continue;
    lines.push(line);
    usedKinds.add(line.kind);
  }

  lines.sort((a, b) => b.priority - a.priority);

  return {
    visible: lines.length > 0,
    title: 'Bugünün Sistem İzleri',
    visibility,
    lines,
    variantSummary,
    routeSummary,
    trustSummary,
    memorySummary,
    operationSummary,
    tomorrowSummary,
    isHintOnly: true,
  };
}
