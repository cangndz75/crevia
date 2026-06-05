import {
  buildActiveTaskRouteUiModel,
  type CreviaActiveTaskRouteUiContext,
  type CreviaActiveTaskRouteUiModel,
} from '@/core/activeTaskRoutes';
import type { CarryOverMemoryModel } from '@/core/carryOver';
import {
  buildDistrictMemoryPresentationModel,
  buildDistrictMemoryRuntimeSnapshot,
  type CreviaDistrictMemorySnapshot,
} from '@/core/districtMemoryRuntime';
import {
  buildDistrictOperationHubLine,
  buildDistrictOperationsRuntimeSnapshot,
  type CreviaDistrictOperationRuntimeSnapshot,
} from '@/core/districtOperationsRuntime';
import {
  buildDistrictTrustPresentationModel,
  buildDistrictTrustRuntimeSnapshot,
  type CreviaDistrictTrustRuntimeSnapshot,
} from '@/core/districtTrustRuntime';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import {
  buildRankPermissionPreviewModel,
  containsForbiddenRankPermissionCopy,
  type RankPermissionPreviewModel,
} from '@/core/rankPermissions';
import type { CreviaDistrictOperationActionState } from '@/core/districtOperationActions/districtOperationActionTypes';
import {
  buildOperationEraHubLine,
  type BuildOperationEraRuntimePreviewInput,
} from '@/core/operationEra/operationEraRuntimePreviewPresentation';
import {
  buildStoryChainHintForHub,
  type BuildStoryChainRuntimeHintInput,
} from '@/core/storyChains/storyChainRuntimeHintPresentation';

export type CreviaHubOpenEndedFocusKind =
  | 'daily_focus'
  | 'next_unlock'
  | 'district_trust'
  | 'district_memory'
  | 'district_operation'
  | 'active_route'
  | 'carry_over'
  | 'resource_pressure'
  | 'crisis_watch'
  | 'advisor_focus'
  | 'story_chain'
  | 'operation_era';

export type CreviaHubOpenEndedTone = 'teal' | 'mint' | 'gold' | 'neutral' | 'warn';

export type CreviaHubOpenEndedFocusLine = {
  id: string;
  kind: CreviaHubOpenEndedFocusKind;
  label: string;
  text: string;
  tone: CreviaHubOpenEndedTone;
  iconKey: string;
  priority: number;
  source: string;
  isHintOnly: true;
  maxLines: 1 | 2;
};

export type CreviaHubNextUnlockSummary = {
  visible: boolean;
  title?: string;
  text?: string;
  chipLabel?: string;
  isDetailed: boolean;
};

export type CreviaHubDistrictRuntimeSummary = {
  visible: boolean;
  districtId?: string;
  districtName?: string;
  kind?: 'trust' | 'memory' | 'operation' | 'crisis';
  text?: string;
  source?: string;
};

export type CreviaHubOperationFocusSummary = {
  visible: boolean;
  text?: string;
  source?: string;
};

export type CreviaHubAdvisorFocusSummary = {
  visible: boolean;
  text?: string;
};

export type CreviaHubOpenEndedVisibility = {
  mode: 'hidden' | 'learning' | 'compact' | 'standard' | 'detailed';
  maxVisibleLines: number;
  showDailyFocus: boolean;
  showNextUnlock: boolean;
  showDistrictRuntime: boolean;
  showDistrictOperation: boolean;
  showActiveRoute: boolean;
  showCarryOverSynthesis: boolean;
  showAdvisorFocus: boolean;
  showStoryChainHint: boolean;
  showOperationEraPreview: boolean;
};

export type CreviaHubOpenEndedIntegrationModel = {
  visible: boolean;
  title: string;
  visibility: CreviaHubOpenEndedVisibility;
  focusLines: CreviaHubOpenEndedFocusLine[];
  nextUnlockSummary: CreviaHubNextUnlockSummary;
  districtRuntimeSummary: CreviaHubDistrictRuntimeSummary;
  operationFocusSummary: CreviaHubOperationFocusSummary;
  advisorFocusSummary: CreviaHubAdvisorFocusSummary;
  activeRouteSummary?: CreviaHubOperationFocusSummary;
  carryOverSuppressed: boolean;
  debugRows: string[];
  isHintOnly: true;
};

export type BuildHubOpenEndedIntegrationInput = {
  gameState?: GameState | null;
  day?: number;
  authorityState?: unknown;
  rankKey?: string;
  unlockedPermissionIds?: string[];
  currentTitle?: string;
  xp?: number;
  operationSignals?: OperationSignalsState | null;
  carryOverMemory?: CarryOverMemoryModel | null;
  isCarryOverCardVisible?: boolean;
  latestReportSystemsModel?: { visible?: boolean; lines?: Array<{ text?: string; kind?: string }> } | null;
  districtTrustSnapshot?: CreviaDistrictTrustRuntimeSnapshot | null;
  districtMemorySnapshot?: CreviaDistrictMemorySnapshot | null;
  districtOperationsSnapshot?: CreviaDistrictOperationRuntimeSnapshot | null;
  activeTaskRouteUiModel?: CreviaActiveTaskRouteUiModel | null;
  activeTaskRouteContext?: CreviaActiveTaskRouteUiContext;
  advisorState?: unknown;
  isAdvisorCardVisible?: boolean;
  crisisState?: unknown;
  operationalResources?: unknown;
  districtOperationActionState?: CreviaDistrictOperationActionState | null;
  storyChainHintInput?: BuildStoryChainRuntimeHintInput;
  operationEraPreviewInput?: BuildOperationEraRuntimePreviewInput;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
};

const MAX_LINES = 3;
const HUB_COPY_MAX = 96;
const HUB_COPY_SHORT = 72;
const FORBIDDEN_TERMS = [
  ['pre', 'mium'].join(''),
  ['satın', ' al'].join(''),
  ['ki', 'litli'].join(''),
  'paywall',
  ['oyun', ' sonu'].join(''),
  ['sezon', ' finali'].join(''),
  ['14 gün', ' bitti'].join(''),
  ['pa', 'nik'].join(''),
  ['çök', 'tü'].join(''),
  ['başarı', 'sız'].join(''),
  'başlat',
  'seç',
  'operasyonu aç',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function resolveDay(input: BuildHubOpenEndedIntegrationInput): number {
  return Math.max(1, Math.round(input.day ?? input.gameState?.city?.day ?? 1));
}

function resolveFocusDistrictId(input: BuildHubOpenEndedIntegrationInput): string {
  return (
    input.operationSignals?.priorityDistrictId ??
    input.districtTrustSnapshot?.focusDistrictId ??
    input.districtMemorySnapshot?.focusDistrictId ??
    input.districtOperationsSnapshot?.focusDistrictId ??
    'merkez'
  );
}

function normalizeCopy(text: string, max = HUB_COPY_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const safe = containsForbiddenHubOpenEndedCopy(normalized)
    ? 'Operasyon odağı sakin bir takip notuna dönüştü.'
    : normalized;
  if (safe.length <= max) return safe;
  return `${safe.slice(0, max - 1).trimEnd()}…`;
}

function toLine(
  line: Omit<CreviaHubOpenEndedFocusLine, 'text' | 'isHintOnly' | 'maxLines'> & {
    text: string;
    maxLines?: 1 | 2;
  },
): CreviaHubOpenEndedFocusLine | null {
  const text = normalizeCopy(line.text, line.maxLines === 1 ? HUB_COPY_SHORT : HUB_COPY_MAX);
  if (!text) return null;
  return {
    ...line,
    text,
    isHintOnly: true,
    maxLines: line.maxLines ?? 2,
  };
}

function dedupeLines(lines: CreviaHubOpenEndedFocusLine[]): CreviaHubOpenEndedFocusLine[] {
  const out: CreviaHubOpenEndedFocusLine[] = [];
  const seenKinds = new Set<CreviaHubOpenEndedFocusKind>();
  const seenText = new Set<string>();

  for (const line of lines.sort((a, b) => b.priority - a.priority)) {
    const key = line.text.toLocaleLowerCase('tr-TR').slice(0, 28);
    if (seenKinds.has(line.kind) || seenText.has(key)) continue;
    out.push(line);
    seenKinds.add(line.kind);
    seenText.add(key);
    if (out.length >= MAX_LINES) break;
  }

  return out;
}

function hasCrisisContext(input: BuildHubOpenEndedIntegrationInput): boolean {
  if (input.operationSignals?.overall.status === 'critical') return true;
  const blob = JSON.stringify(input.crisisState ?? '').toLocaleLowerCase('tr-TR');
  return ['active', 'watch', 'elevated', 'critical'].some((token) => blob.includes(token));
}

function isHighRank(input: BuildHubOpenEndedIntegrationInput, model?: RankPermissionPreviewModel): boolean {
  const rankKey = input.rankKey ?? model?.currentRank.rankKey ?? '';
  const authorityTrust = isRecord(input.authorityState)
    ? readNumber(input.authorityState.authorityTrust)
    : undefined;
  return (
    rankKey.includes('director') ||
    rankKey.includes('chief') ||
    rankKey.includes('manager') ||
    (authorityTrust ?? 0) >= 70
  );
}

export function buildHubOpenEndedVisibility(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubOpenEndedVisibility {
  const day = resolveDay(input);
  const highRank = isHighRank(input);
  const crisisPriority = hasCrisisContext(input);

  if (day <= 1) {
    return {
      mode: 'hidden',
      maxVisibleLines: 0,
      showDailyFocus: false,
      showNextUnlock: false,
      showDistrictRuntime: false,
      showDistrictOperation: false,
      showActiveRoute: false,
      showCarryOverSynthesis: false,
      showAdvisorFocus: false,
      showStoryChainHint: false,
      showOperationEraPreview: false,
    };
  }

  if (day <= 3) {
    return {
      mode: 'compact',
      maxVisibleLines: crisisPriority ? 2 : 1,
      showDailyFocus: true,
      showNextUnlock: false,
      showDistrictRuntime: false,
      showDistrictOperation: false,
      showActiveRoute: true,
      showCarryOverSynthesis: false,
      showAdvisorFocus: false,
      showStoryChainHint: Boolean(input.carryOverMemory?.visible),
      showOperationEraPreview: false,
    };
  }

  if (day <= 7) {
    return {
      mode: 'standard',
      maxVisibleLines: 2,
      showDailyFocus: true,
      showNextUnlock: highRank,
      showDistrictRuntime: true,
      showDistrictOperation: false,
      showActiveRoute: true,
      showCarryOverSynthesis: !input.isCarryOverCardVisible,
      showAdvisorFocus: false,
      showStoryChainHint: true,
      showOperationEraPreview: false,
    };
  }

  return {
    mode: highRank ? 'detailed' : 'standard',
    maxVisibleLines: MAX_LINES,
    showDailyFocus: true,
    showNextUnlock: true,
    showDistrictRuntime: true,
    showDistrictOperation: true,
    showActiveRoute: true,
    showCarryOverSynthesis: !input.isCarryOverCardVisible,
    showAdvisorFocus: !input.isAdvisorCardVisible && highRank,
    showStoryChainHint: true,
    showOperationEraPreview: true,
  };
}

export function buildHubNextUnlockSummary(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubNextUnlockSummary {
  const preview = buildRankPermissionPreviewModel({
    authorityState: input.authorityState,
    xp: input.xp,
    currentTitle: input.currentTitle,
    compact: true,
  });
  const item = preview.compactItems[0] ?? preview.futurePermissions[0];
  if (!item || containsForbiddenRankPermissionCopy(`${item.title} ${item.description}`)) {
    return { visible: false, isDetailed: false };
  }

  const detailed = isHighRank(input, preview);
  const target = preview.nextRank?.title ?? preview.currentRank.title;
  const text = detailed
    ? `${item.title}: harita, Ece ve mahalle görünümü ${target} hedefiyle netleşir.`
    : `${item.title} sıradaki kariyer hedefi olarak görünüyor.`;

  return {
    visible: true,
    title: 'Sıradaki Yetki',
    text: normalizeCopy(text, detailed ? HUB_COPY_MAX : HUB_COPY_SHORT),
    chipLabel: item.title,
    isDetailed: detailed,
  };
}

export function buildHubDailyOperationFocus(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubOperationFocusSummary {
  const focus = input.operationSignals?.dailyFocus ?? 'balanced';
  const overall = input.operationSignals?.overall;
  if (hasCrisisContext(input)) {
    return {
      visible: true,
      text: 'Kritik sinyal sakin takipte; kaynak temposu dengeli tutulmalı.',
      source: 'crisis',
    };
  }

  const labels: Record<string, string> = {
    balanced: 'Bugün odak dengeli saha akışı ve kısa takip.',
    personnel: 'Bugün ekip temposu ve görev dağılımı öne çıkıyor.',
    vehicles: 'Bugün araç yükü ve rota temposu yakından izleniyor.',
    containers: 'Bugün konteyner hattı ve doluluk baskısı izleniyor.',
    districts: 'Bugün mahalle dengesi ve güven izi öncelikli.',
  };

  return {
    visible: true,
    text: overall?.status === 'strained'
      ? 'Operasyon baskısı yüksek; bugünkü odak kaynak dengesini korumak.'
      : labels[focus] ?? labels.balanced,
    source: 'operation_signals',
  };
}

export function buildHubDistrictRuntimeSummary(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubDistrictRuntimeSummary {
  const day = resolveDay(input);
  if (day < 4 && !hasCrisisContext(input)) return { visible: false };

  const districtId = resolveFocusDistrictId(input);
  const context = {
    day,
    focusDistrictId: districtId,
    operationSignals: input.operationSignals,
    carryOverMemory: input.carryOverMemory,
    crisisState: input.crisisState,
    resourceFatigue: input.operationalResources,
    rankKey: input.rankKey,
    unlockedPermissionIds: input.unlockedPermissionIds,
    trustSnapshot: input.districtTrustSnapshot ?? undefined,
    memorySnapshot: input.districtMemorySnapshot ?? undefined,
  };

  const trustSnapshot =
    input.districtTrustSnapshot ?? buildDistrictTrustRuntimeSnapshot(context);
  const trust = trustSnapshot.districts.find((d) => d.districtId === districtId) ?? trustSnapshot.districts[0];
  const memorySnapshot =
    input.districtMemorySnapshot ?? buildDistrictMemoryRuntimeSnapshot({ ...context, trustSnapshot });
  const memory = memorySnapshot.districts.find((d) => d.districtId === districtId) ?? memorySnapshot.districts[0];

  if (hasCrisisContext(input)) {
    return {
      visible: true,
      districtId: trust?.districtId,
      districtName: trust?.districtName,
      kind: 'crisis',
      text: `${trust?.districtName ?? 'Mahalle'} sakin takipte; risk dili yerine kaynak dengesi izleniyor.`,
      source: 'crisis',
    };
  }

  if (trust && (trust.band === 'fragile' || trust.band === 'strained')) {
    const model = buildDistrictTrustPresentationModel(trust.districtId, context);
    return {
      visible: true,
      districtId: model.districtId,
      districtName: model.districtName,
      kind: 'trust',
      text: model.reportLine ?? `${model.districtName} güven izi izleniyor.`,
      source: 'district_trust',
    };
  }

  if (
    memory &&
    ['unresolved_carry_over', 'repeated_pressure', 'crisis_watch', 'resource_strain'].includes(
      memory.primaryKind,
    )
  ) {
    const model = buildDistrictMemoryPresentationModel(memory.districtId, {
      ...context,
      trustSnapshot,
    });
    return {
      visible: true,
      districtId: model.districtId,
      districtName: model.districtName,
      kind: 'memory',
      text: model.reportLine ?? `${model.districtName} mahalle izi izleniyor.`,
      source: 'district_memory',
    };
  }

  if (memory && (memory.primaryKind === 'recent_improvement' || memory.primaryKind === 'recovery_window')) {
    return {
      visible: true,
      districtId: memory.districtId,
      districtName: memory.districtName,
      kind: 'memory',
      text: `${memory.districtName}: toparlanma izi bugünkü odağa bağlanıyor.`,
      source: 'district_memory',
    };
  }

  return { visible: false };
}

export function buildHubDistrictOperationSummary(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubDistrictRuntimeSummary {
  const day = resolveDay(input);
  if (day < 8) return { visible: false };

  const districtId = resolveFocusDistrictId(input);
  const context = {
    day,
    focusDistrictId: districtId,
    operationSignals: input.operationSignals,
    resourceFatigue: input.operationalResources,
    crisisState: input.crisisState,
    rankKey: input.rankKey,
    unlockedPermissionIds: input.unlockedPermissionIds,
    trustSnapshot: input.districtTrustSnapshot ?? undefined,
    memorySnapshot: input.districtMemorySnapshot ?? undefined,
  };
  const snapshot =
    input.districtOperationsSnapshot ?? buildDistrictOperationsRuntimeSnapshot(context);
  const district = snapshot.districts.find((d) => d.districtId === districtId) ?? snapshot.districts[0];
  if (!district?.primary) return { visible: false };

  const text = buildDistrictOperationHubLine(district.districtId, context);
  return {
    visible: true,
    districtId: district.districtId,
    districtName: district.districtName,
    kind: 'operation',
    text,
    source: 'district_operations',
  };
}

export function buildHubActiveRouteSummary(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubOperationFocusSummary {
  const day = resolveDay(input);
  if (day <= 1) return { visible: false };

  const model =
    input.activeTaskRouteUiModel ??
    (input.activeTaskRouteContext
      ? buildActiveTaskRouteUiModel({
          ...input.activeTaskRouteContext,
          day,
          operationSignals: input.operationSignals ?? input.activeTaskRouteContext.operationSignals,
          crisisState: input.crisisState ?? input.activeTaskRouteContext.crisisState,
        })
      : null);

  if (!model?.visible) return { visible: false };

  const target = model.targetDistrictLabel ?? 'hedef mahalle';
  return {
    visible: true,
    text: `Rota aktif: ${target} takipte, ekip sahaya hazırlanıyor.`,
    source: 'active_task_route',
  };
}

export function buildHubCarryOverFocusSummary(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubOperationFocusSummary {
  if (!input.carryOverMemory?.visible || input.isCarryOverCardVisible) {
    return { visible: false };
  }
  return {
    visible: true,
    text: `Dünden kalan iz bugünkü odağı etkiliyor: ${input.carryOverMemory.primaryTag}.`,
    source: 'carry_over',
  };
}

export function buildHubAdvisorFocusLine(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubAdvisorFocusSummary {
  if (input.isAdvisorCardVisible) return { visible: false };
  const level = isRecord(input.advisorState) ? readNumber(input.advisorState.level) ?? 1 : 1;
  if (level < 2) return { visible: false };
  return {
    visible: true,
    text: 'Ece bugünkü odakta mahalle izi ve kaynak temposunu birlikte okuyor.',
  };
}

export function buildHubOpenEndedIntegrationModel(
  input: BuildHubOpenEndedIntegrationInput = {},
): CreviaHubOpenEndedIntegrationModel {
  const visibility = buildHubOpenEndedVisibility(input);
  const nextUnlockSummary = buildHubNextUnlockSummary(input);
  const districtRuntimeSummary = buildHubDistrictRuntimeSummary(input);
  const districtOperationSummary = buildHubDistrictOperationSummary(input);
  const operationFocusSummary = buildHubDailyOperationFocus(input);
  const activeRouteSummary = buildHubActiveRouteSummary(input);
  const carryOverSummary = buildHubCarryOverFocusSummary(input);
  const advisorFocusSummary = buildHubAdvisorFocusLine(input);
  const candidates: CreviaHubOpenEndedFocusLine[] = [];

  if (visibility.showDailyFocus && operationFocusSummary.visible && operationFocusSummary.text) {
    candidates.push(
      toLine({
        id: 'hub-open-ended-daily-focus',
        kind: hasCrisisContext(input) ? 'crisis_watch' : 'daily_focus',
        label: hasCrisisContext(input) ? 'Kritik Takip' : 'Bugünün Odağı',
        text: operationFocusSummary.text,
        tone: hasCrisisContext(input) ? 'warn' : 'teal',
        iconKey: hasCrisisContext(input) ? 'pulse-outline' : 'locate-outline',
        priority: hasCrisisContext(input) ? 98 : 86,
        source: operationFocusSummary.source ?? 'operation_signals',
        maxLines: 2,
      })!,
    );
  }

  if (visibility.showActiveRoute && activeRouteSummary.visible && activeRouteSummary.text) {
    candidates.push(
      toLine({
        id: 'hub-open-ended-active-route',
        kind: 'active_route',
        label: 'Aktif Rota',
        text: activeRouteSummary.text,
        tone: 'mint',
        iconKey: 'navigate-outline',
        priority: 84,
        source: activeRouteSummary.source ?? 'active_task_route',
      })!,
    );
  }

  if (visibility.showDistrictRuntime && districtRuntimeSummary.visible && districtRuntimeSummary.text) {
    candidates.push(
      toLine({
        id: `hub-open-ended-${districtRuntimeSummary.kind ?? 'district'}`,
        kind:
          districtRuntimeSummary.kind === 'trust'
            ? 'district_trust'
            : districtRuntimeSummary.kind === 'memory'
              ? 'district_memory'
              : districtRuntimeSummary.kind === 'crisis'
                ? 'crisis_watch'
                : 'district_operation',
        label: districtRuntimeSummary.kind === 'trust' ? 'Mahalle Güveni' : 'Mahalle İzi',
        text: districtRuntimeSummary.text,
        tone: districtRuntimeSummary.kind === 'crisis' ? 'warn' : 'gold',
        iconKey: districtRuntimeSummary.kind === 'trust' ? 'shield-checkmark-outline' : 'layers-outline',
        priority: districtRuntimeSummary.kind === 'crisis' ? 96 : 78,
        source: districtRuntimeSummary.source ?? 'district_runtime',
      })!,
    );
  }

  if (visibility.showDistrictOperation && districtOperationSummary.visible && districtOperationSummary.text) {
    candidates.push(
      toLine({
        id: 'hub-open-ended-district-operation',
        kind: 'district_operation',
        label: 'Mahalle Operasyonu',
        text: districtOperationSummary.text,
        tone: 'neutral',
        iconKey: 'clipboard-outline',
        priority: 72,
        source: districtOperationSummary.source ?? 'district_operations',
      })!,
    );
  }

  if (visibility.showCarryOverSynthesis && carryOverSummary.visible && carryOverSummary.text) {
    candidates.push(
      toLine({
        id: 'hub-open-ended-carry-over',
        kind: 'carry_over',
        label: 'Dünden Gelen İz',
        text: carryOverSummary.text,
        tone: 'mint',
        iconKey: 'time-outline',
        priority: 66,
        source: 'carry_over',
        maxLines: 1,
      })!,
    );
  }

  if (visibility.showNextUnlock && nextUnlockSummary.visible && nextUnlockSummary.text) {
    candidates.push(
      toLine({
        id: 'hub-open-ended-next-unlock',
        kind: 'next_unlock',
        label: 'Sıradaki Hedef',
        text: nextUnlockSummary.text,
        tone: 'teal',
        iconKey: 'sparkles-outline',
        priority: 58,
        source: 'rank_permissions',
      })!,
    );
  }

  if (visibility.showAdvisorFocus && advisorFocusSummary.visible && advisorFocusSummary.text) {
    candidates.push(
      toLine({
        id: 'hub-open-ended-advisor',
        kind: 'advisor_focus',
        label: 'Ece Notu',
        text: advisorFocusSummary.text,
        tone: 'neutral',
        iconKey: 'chatbubble-ellipses-outline',
        priority: 44,
        source: 'advisor',
      })!,
    );
  }

  if (visibility.showOperationEraPreview) {
    const eraExisting = [
      ...candidates.map((line) => line.text),
      nextUnlockSummary.text ?? '',
      districtOperationSummary.text ?? '',
    ].filter(Boolean);
    const eraLine = buildOperationEraHubLine(
      {
        gameDay: resolveDay(input),
        focusDistrictId: resolveFocusDistrictId(input),
        operationSignals: input.operationSignals ?? undefined,
        districtTrustSnapshot: input.districtTrustSnapshot ?? undefined,
        districtMemorySnapshot: input.districtMemorySnapshot ?? undefined,
        districtOperationActionState: input.districtOperationActionState ?? undefined,
        resourceFatigue: input.operationalResources,
        crisisState: input.crisisState,
        activeTaskRouteModel: input.activeTaskRouteUiModel ?? undefined,
        rankKey: input.rankKey ?? input.currentTitle,
        unlockedPermissionIds: input.unlockedPermissionIds ?? [],
        isPostPilot: input.isPostPilot,
        isPilotCompleted: input.isPilotCompleted,
        isFullMode: input.isPostPilot === true || resolveDay(input) >= 8,
        nextUnlockLine: nextUnlockSummary.text,
        districtOperationLine: districtOperationSummary.text,
        ...input.operationEraPreviewInput,
      },
      eraExisting,
    );
    if (eraLine?.text) {
      candidates.push(
        toLine({
          id: 'hub-open-ended-operation-era',
          kind: 'operation_era',
          label: eraLine.label,
          text: eraLine.text,
          tone: eraLine.tone === 'watch' ? 'warn' : eraLine.tone === 'gold' ? 'gold' : 'teal',
          iconKey: eraLine.iconKey,
          priority: eraLine.priority,
          source: eraLine.source,
          maxLines: eraLine.maxLines,
        })!,
      );
    }
  }

  if (visibility.showStoryChainHint) {
    const existingTexts = [
      ...candidates.map((line) => line.text),
      carryOverSummary.text ?? '',
      activeRouteSummary.text ?? '',
      districtRuntimeSummary.text ?? '',
      districtOperationSummary.text ?? '',
      input.carryOverMemory?.summary ?? '',
    ].filter(Boolean);
    const storyChainHint = buildStoryChainHintForHub(
      {
        gameDay: resolveDay(input),
        selectedDistrictId: resolveFocusDistrictId(input),
        carryOverMemory: input.carryOverMemory ?? undefined,
        districtTrustSnapshot: input.districtTrustSnapshot ?? undefined,
        districtMemorySnapshot: input.districtMemorySnapshot ?? undefined,
        districtOperationsSnapshot: input.districtOperationsSnapshot ?? undefined,
        districtOperationActionState: input.districtOperationActionState ?? undefined,
        operationSignals: input.operationSignals ?? undefined,
        resourceFatigue: input.operationalResources,
        crisisState: input.crisisState,
        activeTaskRouteModel: input.activeTaskRouteUiModel ?? undefined,
        activeTaskRouteContext: input.activeTaskRouteContext,
        isCarryOverCardVisible: input.isCarryOverCardVisible,
        carryOverLine: carryOverSummary.text,
        activeRouteLine: activeRouteSummary.text,
        districtMemoryUnresolvedLine: districtRuntimeSummary.kind === 'memory' ? districtRuntimeSummary.text : undefined,
        districtOperationActionSummary: districtOperationSummary.text,
        ...input.storyChainHintInput,
      },
      existingTexts,
    );
    if (storyChainHint?.text) {
      candidates.push(
        toLine({
          id: 'hub-open-ended-story-chain',
          kind: 'story_chain',
          label: storyChainHint.label,
          text: storyChainHint.text,
          tone: storyChainHint.tone === 'warn' ? 'warn' : storyChainHint.tone === 'gold' ? 'gold' : 'teal',
          iconKey: storyChainHint.iconKey,
          priority: storyChainHint.priority,
          source: storyChainHint.source,
          maxLines: storyChainHint.maxLines,
        })!,
      );
    }
  }

  const focusLines = dedupeLines(candidates).slice(0, visibility.maxVisibleLines);
  const model: CreviaHubOpenEndedIntegrationModel = {
    visible: visibility.mode !== 'hidden' && focusLines.length > 0,
    title: 'Bugünün Operasyon Odağı',
    visibility,
    focusLines,
    nextUnlockSummary,
    districtRuntimeSummary: districtRuntimeSummary.visible
      ? districtRuntimeSummary
      : districtOperationSummary,
    operationFocusSummary,
    advisorFocusSummary,
    activeRouteSummary,
    carryOverSuppressed: input.isCarryOverCardVisible === true,
    debugRows: [],
    isHintOnly: true,
  };
  return { ...model, debugRows: buildHubOpenEndedDebugRows(model) };
}

export function buildHubOpenEndedDebugRows(
  modelOrInput: CreviaHubOpenEndedIntegrationModel | BuildHubOpenEndedIntegrationInput = {},
): string[] {
  const model =
    'focusLines' in modelOrInput
      ? modelOrInput
      : buildHubOpenEndedIntegrationModel(modelOrInput);
  return [
    `visible: ${model.visible}`,
    `mode: ${model.visibility.mode}`,
    `maxLines: ${model.visibility.maxVisibleLines}`,
    `lineCount: ${model.focusLines.length}`,
    `nextUnlock: ${model.nextUnlockSummary.visible}`,
    `district: ${model.districtRuntimeSummary.kind ?? 'none'} ${model.districtRuntimeSummary.visible}`,
    `carryOverSuppressed: ${model.carryOverSuppressed}`,
    ...model.focusLines.map((line) => `${line.kind}: ${line.text.slice(0, 48)}`),
  ];
}

export function containsForbiddenHubOpenEndedCopy(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

export function validateHubOpenEndedIntegrationModel(
  model: CreviaHubOpenEndedIntegrationModel,
): boolean {
  if (model.focusLines.length > MAX_LINES) return false;
  if (model.focusLines.length > model.visibility.maxVisibleLines) return false;
  for (const line of model.focusLines) {
    if (line.text.length > HUB_COPY_MAX + 1) return false;
    if (containsForbiddenHubOpenEndedCopy(line.text)) return false;
  }
  const nextText = model.nextUnlockSummary.text ?? '';
  if (nextText && containsForbiddenHubOpenEndedCopy(nextText)) return false;
  return true;
}
