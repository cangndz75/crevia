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
import type { EventCard } from '@/core/models/EventCard';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

export const EVENT_RESULT_SYSTEMS_ECHO_MAX_COPY_LENGTH = 96;
export const EVENT_RESULT_SYSTEMS_ECHO_MOBILE_COPY_LENGTH = 72;
export const EVENT_RESULT_SYSTEMS_ECHO_MAX_VISIBLE_LINES = 4;

export const EVENT_RESULT_SYSTEMS_ECHO_FORBIDDEN_TERMS: readonly string[] = [
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
  'kesin varış',
  'pathfinding',
  'başlat',
  'operasyonu aç',
] as const;

export const EVENT_RESULT_SYSTEMS_ECHO_OPERATION_CTA_TERMS: readonly string[] = [
  'başlat',
  'seç',
  'operasyonu aç',
  'operasyonu başlat',
] as const;

export type CreviaEventResultSystemsEchoLineKind =
  | 'variant'
  | 'active_route'
  | 'district_trust'
  | 'district_memory'
  | 'district_operation'
  | 'resource_pressure'
  | 'crisis_watch'
  | 'tomorrow_carry_over'
  | 'map_after_effect';

export type CreviaEventResultSystemsEchoTone = 'teal' | 'mint' | 'gold' | 'neutral' | 'warn';

export type CreviaEventResultSystemsEchoLine = {
  id: string;
  kind: CreviaEventResultSystemsEchoLineKind;
  label: string;
  text: string;
  tone: CreviaEventResultSystemsEchoTone;
  iconKey: string;
  priority: number;
  source: string;
  isHintOnly: true;
  maxLines: number;
};

export type CreviaEventResultSystemsEchoVariantEcho = {
  kind: string;
  text?: string;
  visible: boolean;
};

export type CreviaEventResultSystemsEchoDistrictTrustEcho = {
  band?: CreviaDistrictTrustBand;
  text?: string;
  visible: boolean;
};

export type CreviaEventResultSystemsEchoDistrictMemoryEcho = {
  memoryKind?: CreviaDistrictMemoryKind;
  text?: string;
  visible: boolean;
};

export type CreviaEventResultSystemsEchoOperationEcho = {
  text?: string;
  visible: boolean;
};

export type CreviaEventResultSystemsEchoRouteEcho = {
  phase?: string;
  text?: string;
  visible: boolean;
};

export type CreviaEventResultSystemsEchoTomorrowEcho = {
  text?: string;
  visible: boolean;
};

export type CreviaEventResultSystemsEchoVisibilityMode =
  | 'hidden'
  | 'minimal'
  | 'compact'
  | 'standard'
  | 'detailed';

export type CreviaEventResultSystemsVisibility = {
  mode: CreviaEventResultSystemsEchoVisibilityMode;
  maxVisibleLines: number;
  showVariant: boolean;
  showRoute: boolean;
  showTrust: boolean;
  showMemory: boolean;
  showOperation: boolean;
  showTomorrow: boolean;
};

export type CreviaEventResultSystemsEchoModel = {
  visible: boolean;
  visibility: CreviaEventResultSystemsVisibility;
  lines: CreviaEventResultSystemsEchoLine[];
  variantEcho: CreviaEventResultSystemsEchoVariantEcho;
  routeEcho: CreviaEventResultSystemsEchoRouteEcho;
  trustEcho: CreviaEventResultSystemsEchoDistrictTrustEcho;
  memoryEcho: CreviaEventResultSystemsEchoDistrictMemoryEcho;
  operationEcho: CreviaEventResultSystemsEchoOperationEcho;
  tomorrowEcho: CreviaEventResultSystemsEchoTomorrowEcho;
  isHintOnly: true;
};

export type CreviaEventResultSystemsEchoInput = {
  snapshot?: DecisionResultSnapshot | null;
  event?: EventCard | null;
  districtId?: string;
  day?: number;
  resolvedVariant?: CreviaResolvedEventVariant;
  variantContext?: CreviaEventVariantContext;
  districtTrustContext?: CreviaDistrictTrustSignalContext;
  districtMemoryContext?: CreviaDistrictMemorySignalContext;
  districtOperationContext?: CreviaDistrictOperationRuntimeContext;
  activeTaskRouteContext?: CreviaActiveTaskRouteUiContext;
  activeTaskRouteUiModel?: CreviaActiveTaskRouteUiModel;
  operationSignals?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  rankKey?: string;
  unlockedPermissionIds?: string[];
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  existingEchoLines?: string[];
  carryOverSummary?: string;
  mapImpactSummary?: string;
};

const TRUST_RESULT_INTENT: Record<CreviaDistrictTrustBand, string> = {
  fragile: 'Güven hassas; sonuç mahallede dikkatle okunacak.',
  strained: 'Baskı görünür; sonuç mahallede temkinle izlenecek.',
  watch: 'Güven izleniyor; etki sınırlı kalabilir.',
  stable: 'Güven dengeli; karar rutin akışta okunuyor.',
  trusted: 'Güven destekliyor; sonuç mahallede olumlu karşılandı.',
  improving: 'İyileşen güven bu sonucu görünür kıldı.',
  recovering: 'Toparlanma penceresi sonucu yumuşattı.',
};

const MEMORY_RESULT_INTENT: Partial<Record<CreviaDistrictMemoryKind, string>> = {
  unresolved_carry_over: 'Önceki kararın izi bu sonuca yansıdı.',
  repeated_pressure: 'Tekrarlayan baskı sonucu yarın da taşınabilir.',
  recent_improvement: 'İyi karar mahallede görünür bir iz bıraktı.',
  recovery_window: 'Toparlanma penceresi sonucu destekledi.',
  trust_shift: 'Güven kayması sonucun algısını etkiledi.',
  resource_strain: 'Kaynak baskısı sonucu daha belirgin kıldı.',
  social_echo: 'Sosyal yankı sonucu mahallede konuşuluyor.',
  crisis_watch: 'Risk kontrol penceresi sonucu sınırladı.',
  operation_followup: 'Takip konusu yarın gündeme gelebilir.',
  quiet_stable: 'Sakin akış sonucu dengeli okundu.',
};

function clampCopy(text: string, max = EVENT_RESULT_SYSTEMS_ECHO_MOBILE_COPY_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function normalizeEcho(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function eventResultSystemsEchoCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = normalizeEcho(text);
  return (
    EVENT_RESULT_SYSTEMS_ECHO_FORBIDDEN_TERMS.some((term) => normalized.includes(term)) ||
    districtTrustRuntimeCopyContainsForbiddenTerms(text) ||
    districtMemoryRuntimeCopyContainsForbiddenTerms(text) ||
    districtOperationsRuntimeCopyContainsForbiddenTerms(text)
  );
}

export function eventResultSystemsEchoCopyContainsPanicTerms(text: string): boolean {
  const normalized = normalizeEcho(text);
  return (
    ['panik', 'çöktü', 'başarısız', 'felaket'].some((term) => normalized.includes(term)) ||
    districtTrustRuntimeCopyContainsPanicTerms(text) ||
    districtMemoryRuntimeCopyContainsPanicTerms(text) ||
    districtOperationsRuntimeCopyContainsPanicTerms(text)
  );
}

export function eventResultSystemsEchoOperationLooksLikeCta(text: string): boolean {
  const normalized = normalizeEcho(text);
  return EVENT_RESULT_SYSTEMS_ECHO_OPERATION_CTA_TERMS.some((term) => normalized.includes(term));
}

function safeCopy(text: string, fallback: string, max = EVENT_RESULT_SYSTEMS_ECHO_MOBILE_COPY_LENGTH): string {
  const clamped = clampCopy(text, max);
  if (
    eventResultSystemsEchoCopyContainsForbiddenTerms(clamped) ||
    eventResultSystemsEchoCopyContainsPanicTerms(clamped)
  ) {
    return clampCopy(fallback, max);
  }
  return clamped;
}

function districtName(id: MapDistrictId | string): string {
  const normalized = normalizeMapDistrictId(id) ?? 'merkez';
  return DISTRICT_IDENTITIES[normalized]?.name ?? normalized;
}

function resolveDistrictId(input: CreviaEventResultSystemsEchoInput): MapDistrictId | undefined {
  const raw =
    input.districtId ??
    input.snapshot?.neighborhoodId ??
    input.event?.neighborhoodId ??
    input.event?.districtIds?.[0];
  return normalizeMapDistrictId(raw ?? undefined) ?? undefined;
}

function buildSignalContext(input: CreviaEventResultSystemsEchoInput, districtId: MapDistrictId) {
  const day = input.day ?? input.snapshot?.day ?? 1;
  return {
    day,
    focusDistrictId: districtId,
    operationSignals: input.operationSignals,
    resourceFatigue: input.resourceFatigue,
    crisisState: input.crisisState,
    rankKey: input.rankKey,
    unlockedPermissionIds: input.unlockedPermissionIds,
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

export function buildEventResultSystemsVisibility(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsVisibility {
  const day = input.day ?? input.snapshot?.day ?? 1;
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

  if (day <= 1) {
    return {
      mode: 'minimal',
      maxVisibleLines: 0,
      showVariant: false,
      showRoute: false,
      showTrust: false,
      showMemory: false,
      showOperation: false,
      showTomorrow: false,
    };
  }

  if (day <= 3) {
    return {
      mode: 'compact',
      maxVisibleLines: 2,
      showVariant: true,
      showRoute: day >= 2,
      showTrust: true,
      showMemory: day >= 3,
      showOperation: false,
      showTomorrow: true,
    };
  }

  if (isPostPilot && highRank) {
    return {
      mode: 'detailed',
      maxVisibleLines: EVENT_RESULT_SYSTEMS_ECHO_MAX_VISIBLE_LINES,
      showVariant: true,
      showRoute: true,
      showTrust: true,
      showMemory: true,
      showOperation: true,
      showTomorrow: true,
    };
  }

  return {
    mode: 'standard',
    maxVisibleLines: EVENT_RESULT_SYSTEMS_ECHO_MAX_VISIBLE_LINES,
    showVariant: true,
    showRoute: true,
    showTrust: true,
    showMemory: true,
    showOperation: isPostPilot,
    showTomorrow: true,
  };
}

export function buildEventResultVariantEcho(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsEchoVariantEcho {
  const day = input.day ?? input.snapshot?.day ?? 1;
  if (day <= 1) return { kind: 'normal', visible: false };

  const variantContext: CreviaEventVariantContext = {
    ...buildEventVariantContextFromEvent(input.event, {
      day,
      districtId: resolveDistrictId(input),
      eventDomain: input.snapshot?.eventType,
      ...input.variantContext,
    }),
    ...input.variantContext,
  };

  const resolved = input.resolvedVariant ?? resolveEventVariantForContext(variantContext);
  const text = buildEventVariantSurfaceLine(resolved, 'result');
  if (!text || resolved.kind === 'normal') {
    return { kind: resolved.kind, visible: false };
  }
  if (resolved.kind === 'operation_era' && resolved.isPrimaryEventVariant) {
    return { kind: resolved.kind, visible: false };
  }

  return {
    kind: resolved.kind,
    text: safeCopy(text, 'Operasyon sonucu günlük ritme eklendi.'),
    visible: true,
  };
}

export function buildEventResultActiveRouteEcho(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsEchoRouteEcho {
  const day = input.day ?? input.snapshot?.day ?? 1;
  if (day <= 1 || !input.event) return { visible: false };

  const routeModel =
    input.activeTaskRouteUiModel ??
    buildActiveTaskRouteForEvent({
      day,
      activeEvent: input.event,
      operationSignals: input.operationSignals as OperationSignalsState | null | undefined,
      operationalResources: input.resourceFatigue,
      crisisState: input.crisisState,
      isResultPhase: true,
      eventPhase: 'result',
      rankKey: input.rankKey,
      unlockedPermissionIds: input.unlockedPermissionIds,
      ...input.activeTaskRouteContext,
    });

  if (!routeModel.visible) return { visible: false, phase: routeModel.phase };

  let text = routeModel.reportLine;
  if (routeModel.phase === 'completed' || routeModel.phase === 'resolving') {
    text = safeCopy(
      'Ekip sahadaki son kontrolü rapora taşıdı.',
      routeModel.reportLine,
    );
  } else if (routeModel.resourceWarningLine) {
    text = safeCopy(
      routeModel.resourceWarningLine.includes('yarın')
        ? routeModel.resourceWarningLine
        : `${routeModel.resourceWarningLine} Takip yarına devredildi.`,
      'Rota baskısı azaldı, takip yarına devredildi.',
    );
  } else if (routeModel.phase === 'delayed' || routeModel.phase === 'risk_watch') {
    text = safeCopy('Rota baskısı azaldı, takip yarına devredildi.', routeModel.reportLine);
  }

  return {
    phase: routeModel.phase,
    text: safeCopy(text, 'Saha yönü sonuç raporuna bağlandı.'),
    visible: Boolean(text),
  };
}

export function buildEventResultDistrictTrustEcho(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsEchoDistrictTrustEcho {
  const districtId = resolveDistrictId(input);
  if (!districtId || (input.day ?? input.snapshot?.day ?? 1) <= 1) {
    return { visible: false };
  }

  const context = buildSignalContext(input, districtId);
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const district = getDistrictTrustDistrictSnapshot(snapshot, districtId);
  if (!district) return { visible: false };

  const def = getDistrictTrustRuntimeBandDefinition(district.band);
  const intent = TRUST_RESULT_INTENT[district.band] ?? def.reportCopyIntent;
  const text = safeCopy(`${district.districtName}: ${intent}`, `${district.districtName}: güven sinyali aktif.`);

  return {
    band: district.band,
    text,
    visible: true,
  };
}

export function buildEventResultDistrictMemoryEcho(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsEchoDistrictMemoryEcho {
  const districtId = resolveDistrictId(input);
  const day = input.day ?? input.snapshot?.day ?? 1;
  if (!districtId || day <= 2) return { visible: false };

  const context = buildSignalContext(input, districtId);
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  const district = getDistrictMemoryDistrictSnapshot(snapshot, districtId);
  if (!district) return { visible: false };

  const def = getDistrictMemoryRuntimeKindDefinition(district.primaryKind);
  const intent =
    MEMORY_RESULT_INTENT[district.primaryKind] ??
    district.primaryTrace?.reportHint ??
    def.reportCopyIntent;
  const text = safeCopy(`${district.districtName}: ${intent}`, `${district.districtName}: mahalle izi sakin.`);

  return {
    memoryKind: district.primaryKind,
    text,
    visible: true,
  };
}

export function buildEventResultDistrictOperationEcho(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsEchoOperationEcho {
  const districtId = resolveDistrictId(input);
  const day = input.day ?? input.snapshot?.day ?? 1;
  if (!districtId || day <= 3) return { visible: false };

  const context = buildSignalContext(input, districtId);
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  const district = getDistrictOperationRuntimeDistrictSnapshot(snapshot, districtId);
  if (!district?.primary) return { visible: false };

  const name = district.districtName;
  const label = district.primary.shortLabel ?? 'operasyon';
  const text = safeCopy(
    `Yarın dikkat: ${name} ${label.toLocaleLowerCase('tr-TR')} ihtiyacı görünür olabilir.`,
    `Sıradaki operasyon ihtiyacı ${name} çevresinde izleniyor.`,
  );

  if (eventResultSystemsEchoOperationLooksLikeCta(text)) {
    return { visible: false };
  }

  return { text, visible: true };
}

export function buildEventResultTomorrowCarryOverEcho(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsEchoTomorrowEcho {
  const day = input.day ?? input.snapshot?.day ?? 1;
  if (day <= 1) return { visible: false };

  const districtId = resolveDistrictId(input);
  const existing = input.existingEchoLines ?? [];
  const candidates: string[] = [];

  if (input.carryOverSummary?.trim()) {
    const summary = input.carryOverSummary.trim();
    if (!isDuplicate(summary, existing)) {
      candidates.push(summary);
    }
  }

  if (districtId) {
    const context = buildSignalContext(input, districtId);
    candidates.push(buildDistrictMemoryTomorrowPreviewLine(districtId, context));
    candidates.push(buildDistrictTrustTomorrowPreviewLine(districtId, context));
    if ((input.day ?? day) >= 4) {
      candidates.push(buildDistrictOperationTomorrowPreviewLine(districtId, context));
    }
  }

  const districtLabel = districtId ? districtName(districtId) : 'Mahalle';
  if (input.snapshot?.resultTone === 'positive') {
    candidates.push(`Bu karar ${districtLabel}'te toparlanma penceresi açtı.`);
  }

  for (const raw of candidates) {
    const text = safeCopy(raw, 'Yarın rota baskısı daha görünür olabilir.');
    if (!isDuplicate(text, existing)) {
      return { text, visible: true };
    }
  }

  return { visible: false };
}

function toLine(
  echo:
    | CreviaEventResultSystemsEchoVariantEcho
    | CreviaEventResultSystemsEchoRouteEcho
    | CreviaEventResultSystemsEchoDistrictTrustEcho
    | CreviaEventResultSystemsEchoDistrictMemoryEcho
    | CreviaEventResultSystemsEchoOperationEcho
    | CreviaEventResultSystemsEchoTomorrowEcho,
  kind: CreviaEventResultSystemsEchoLineKind,
  label: string,
  iconKey: string,
  tone: CreviaEventResultSystemsEchoTone,
  priority: number,
  source: string,
): CreviaEventResultSystemsEchoLine | null {
  if (!('text' in echo) || !echo.visible || !echo.text?.trim()) return null;
  return {
    id: `result-echo-${kind}`,
    kind,
    label,
    text: clampCopy(echo.text, EVENT_RESULT_SYSTEMS_ECHO_MAX_COPY_LENGTH),
    tone,
    iconKey,
    priority,
    source,
    isHintOnly: true,
    maxLines: 2,
  };
}

function pickDistrictSocialLine(
  trust: CreviaEventResultSystemsEchoDistrictTrustEcho,
  memory: CreviaEventResultSystemsEchoDistrictMemoryEcho,
  maxLines: number,
  existing: string[],
): CreviaEventResultSystemsEchoLine[] {
  const trustLine = toLine(trust, 'district_trust', 'Mahalle Güveni', 'shield-checkmark-outline', 'teal', 70, 'district_trust');
  const memoryLine = toLine(memory, 'district_memory', 'Mahalle Hafızası', 'layers-outline', 'mint', 65, 'district_memory');

  const lines: CreviaEventResultSystemsEchoLine[] = [];
  if (trustLine && !isDuplicate(trustLine.text, existing)) lines.push(trustLine);
  if (memoryLine && !isDuplicate(memoryLine.text, existing)) lines.push(memoryLine);

  if (lines.length <= 1 || maxLines >= 3) return lines.slice(0, 2);

  lines.sort((a, b) => b.priority - a.priority);
  return lines.slice(0, 1);
}

export function buildEventResultSystemsDebugRows(
  input: CreviaEventResultSystemsEchoInput = {},
): string[] {
  const model = buildEventResultSystemsEchoModel(input);
  return [
    `visible: ${model.visible}`,
    `mode: ${model.visibility.mode}`,
    `maxLines: ${model.visibility.maxVisibleLines}`,
    `lineCount: ${model.lines.length}`,
    `variant: ${model.variantEcho.kind} ${model.variantEcho.visible}`,
    `route: ${model.routeEcho.phase ?? 'n/a'} ${model.routeEcho.visible}`,
    `trust: ${model.trustEcho.band ?? 'n/a'} ${model.trustEcho.visible}`,
    `memory: ${model.memoryEcho.memoryKind ?? 'n/a'} ${model.memoryEcho.visible}`,
    `operation: ${model.operationEcho.visible}`,
    `tomorrow: ${model.tomorrowEcho.visible}`,
    ...model.lines.map((line) => `${line.kind}: ${line.text.slice(0, 48)}`),
  ];
}

export function buildEventResultSystemsEchoModel(
  input: CreviaEventResultSystemsEchoInput = {},
): CreviaEventResultSystemsEchoModel {
  const visibility = buildEventResultSystemsVisibility(input);
  const existing = [
    ...(input.existingEchoLines ?? []),
    input.carryOverSummary ?? '',
    input.mapImpactSummary ?? '',
    input.snapshot?.summaryText ?? '',
    input.snapshot?.summaryTitle ?? '',
  ].filter(Boolean);

  const variantEcho = buildEventResultVariantEcho(input);
  const routeEcho = buildEventResultActiveRouteEcho(input);
  const trustEcho = buildEventResultDistrictTrustEcho(input);
  const memoryEcho = buildEventResultDistrictMemoryEcho(input);
  const operationEcho = buildEventResultDistrictOperationEcho(input);
  const tomorrowEcho = buildEventResultTomorrowCarryOverEcho({
    ...input,
    existingEchoLines: existing,
  });

  const emptyModel: CreviaEventResultSystemsEchoModel = {
    visible: false,
    visibility,
    lines: [],
    variantEcho,
    routeEcho,
    trustEcho,
    memoryEcho,
    operationEcho,
    tomorrowEcho,
    isHintOnly: true,
  };

  if (!input.snapshot && !input.event) return emptyModel;
  if (visibility.mode === 'hidden' || visibility.maxVisibleLines <= 0) return emptyModel;

  const candidates: CreviaEventResultSystemsEchoLine[] = [];

  if (visibility.showVariant) {
    const variantLine = toLine(variantEcho, 'variant', 'Operasyon Tonu', 'sparkles-outline', 'gold', 90, 'event_variant');
    if (variantLine && !shouldSuppressVariantEchoDuplicate(variantLine.text, existing.join(' '))) {
      if (!isDuplicate(variantLine.text, existing)) candidates.push(variantLine);
    }
  }

  if (visibility.showRoute) {
    const routeLine = toLine(routeEcho, 'active_route', 'Aktif Rota', 'navigate-outline', 'mint', 85, 'active_task_route');
    if (routeLine && !isDuplicate(routeLine.text, existing)) candidates.push(routeLine);
  }

  if (visibility.showTrust || visibility.showMemory) {
    const socialLines = pickDistrictSocialLine(
      visibility.showTrust ? trustEcho : { visible: false },
      visibility.showMemory ? memoryEcho : { visible: false },
      visibility.maxVisibleLines,
      [...existing, ...candidates.map((l) => l.text)],
    );
    candidates.push(...socialLines);
  }

  if (visibility.showOperation) {
    const opLine = toLine(
      operationEcho,
      'district_operation',
      'Yarın Dikkat',
      'clipboard-outline',
      'neutral',
      55,
      'district_operations',
    );
    if (opLine && !isDuplicate(opLine.text, existing)) candidates.push(opLine);
  }

  if (visibility.showTomorrow) {
    const tomorrowLine = toLine(
      tomorrowEcho,
      'tomorrow_carry_over',
      'Yarına İz',
      'arrow-forward-circle-outline',
      'teal',
      50,
      'carry_over',
    );
    if (tomorrowLine && !isDuplicate(tomorrowLine.text, existing)) candidates.push(tomorrowLine);
  }

  candidates.sort((a, b) => b.priority - a.priority);

  const lines: CreviaEventResultSystemsEchoLine[] = [];
  const usedKinds = new Set<CreviaEventResultSystemsEchoLineKind>();
  for (const line of candidates) {
    if (lines.length >= visibility.maxVisibleLines) break;
    if (line.kind === 'active_route' && usedKinds.has('active_route')) continue;
    if (line.kind === 'district_trust' && usedKinds.has('district_trust')) continue;
    if (line.kind === 'district_memory' && usedKinds.has('district_memory')) continue;
    if (line.kind === 'tomorrow_carry_over' && usedKinds.has('tomorrow_carry_over')) continue;
    if (line.kind === 'district_operation' && usedKinds.has('district_operation')) continue;
    lines.push(line);
    usedKinds.add(line.kind);
  }

  lines.sort((a, b) => b.priority - a.priority);

  return {
    visible: lines.length > 0,
    visibility,
    lines,
    variantEcho,
    routeEcho,
    trustEcho,
    memoryEcho,
    operationEcho,
    tomorrowEcho,
    isHintOnly: true,
  };
}
