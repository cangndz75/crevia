import type { CreviaActiveTaskRouteUiContext, CreviaActiveTaskRouteUiModel } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';
import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import {
  buildDistrictMemoryRuntimeSnapshot,
  type CreviaDistrictMemorySnapshot,
} from '@/core/districtMemoryRuntime';
import type { CreviaDistrictOperationAction, CreviaDistrictOperationActionState } from '@/core/districtOperationActions/districtOperationActionTypes';
import {
  buildDistrictOperationsRuntimeSnapshot,
  type CreviaDistrictOperationRuntimeSnapshot,
} from '@/core/districtOperationsRuntime';
import {
  buildDistrictTrustRuntimeSnapshot,
  type CreviaDistrictTrustRuntimeSnapshot,
} from '@/core/districtTrustRuntime';
import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { ReportTomorrowPreviewSummary } from '@/core/reports/reportTomorrowPreviewTypes';

import {
  STORY_CHAIN_COMPACT_COPY_MAX,
  STORY_CHAIN_MOBILE_COPY_MAX,
  isStoryChainDayOneBlocked,
} from './storyChainConstants';
import {
  buildStoryChainAdvisorLine,
  buildStoryChainHubLine,
  buildStoryChainMapLine,
  buildStoryChainReportLine,
  buildStoryChainResultLine,
  buildStoryChainTomorrowLine,
  storyChainCopyContainsForbiddenTerms,
  storyChainCopyContainsPanicTerms,
  validateStoryChainPresentationCopy,
} from './storyChainPresentation';
import { buildStoryChainContext, resolveStoryChainForDistrict } from './storyChainResolver';
import type {
  CreviaResolvedStoryChain,
  CreviaStoryChainContext,
  CreviaStoryChainKind,
  CreviaStoryChainRuntimeHintHealthStatus,
  CreviaStoryChainRuntimeHintLine,
  CreviaStoryChainRuntimeHintModel,
  CreviaStoryChainRuntimeHintSource,
  CreviaStoryChainRuntimeHintSurface,
  CreviaStoryChainRuntimeHintVisibility,
  CreviaStoryChainStepKind,
} from './storyChainTypes';

export type BuildStoryChainRuntimeHintInput = {
  gameDay?: number;
  day?: number;
  selectedDistrictId?: MapDistrictId | string;
  activeEvent?: EventCard | { neighborhoodId?: string; id?: string } | null;
  lastCompletedEvent?: EventCard | { neighborhoodId?: string } | null;
  dailyReport?: DailyReport | null;
  carryOverMemory?: CarryOverMemoryModel | null;
  reportTomorrowPreview?: ReportTomorrowPreviewSummary | null;
  districtTrustSnapshot?: CreviaDistrictTrustRuntimeSnapshot | null;
  districtMemorySnapshot?: CreviaDistrictMemorySnapshot | null;
  districtOperationActionState?: CreviaDistrictOperationActionState | null;
  districtOperationsSnapshot?: CreviaDistrictOperationRuntimeSnapshot | null;
  activeTaskRouteModel?: CreviaActiveTaskRouteUiModel | null;
  activeTaskRouteContext?: CreviaActiveTaskRouteUiContext;
  operationSignals?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  recentEventExposure?: CreviaStoryChainContext['recentEventExposure'];
  storyChainContext?: Partial<CreviaStoryChainContext>;
  rankKey?: string;
  unlockedPermissionIds?: string[];
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  isCarryOverCardVisible?: boolean;
  crisisOverlayVisible?: boolean;
  existingLines?: string[];
  carryOverLine?: string;
  tomorrowPreviewLine?: string;
  districtMemoryUnresolvedLine?: string;
  districtOperationActionSummary?: string;
  activeRouteLine?: string;
  isAdvisorInsightVisible?: boolean;
};

export type StoryChainHintSuppressionContext = {
  surface: CreviaStoryChainRuntimeHintSurface;
  hintText?: string;
  input: BuildStoryChainRuntimeHintInput;
  existingLines?: string[];
};

function resolveDay(input: BuildStoryChainRuntimeHintInput): number {
  return Math.max(1, Math.round(input.gameDay ?? input.day ?? 1));
}

function resolveDistrictId(input: BuildStoryChainRuntimeHintInput): MapDistrictId {
  const fromEvent =
    input.activeEvent?.neighborhoodId ?? input.lastCompletedEvent?.neighborhoodId;
  const raw =
    input.selectedDistrictId ??
    fromEvent ??
    input.districtTrustSnapshot?.focusDistrictId ??
    input.districtMemorySnapshot?.focusDistrictId ??
    input.districtOperationsSnapshot?.focusDistrictId ??
    'merkez';
  return normalizeMapDistrictId(raw) ?? 'merkez';
}

function districtName(id: MapDistrictId): string {
  return DISTRICT_IDENTITIES[id]?.name ?? id;
}

function clampCopy(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function safeHintCopy(text: string, max = STORY_CHAIN_COMPACT_COPY_MAX, fallback?: string): string {
  const clamped = clampCopy(text, max);
  if (
    storyChainCopyContainsForbiddenTerms(clamped) ||
    storyChainCopyContainsPanicTerms(clamped)
  ) {
    return clampCopy(
      fallback ?? 'Önceki kararın etkisi yarına kısa bir takip penceresi bırakıyor.',
      max,
    );
  }
  return clamped;
}

function normalizeSemanticKey(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 36);
}

function isSemanticDuplicate(a: string, b: string): boolean {
  const ka = normalizeSemanticKey(a);
  const kb = normalizeSemanticKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  if (ka.length >= 14 && kb.length >= 14) {
    const sliceA = ka.slice(0, 18);
    const sliceB = kb.slice(0, 18);
    return ka.includes(sliceB) || kb.includes(sliceA);
  }
  return false;
}

function isDuplicateAgainst(text: string, existing: string[]): boolean {
  return existing.some((line) => isSemanticDuplicate(text, line));
}

function hasCrisisContext(input: BuildStoryChainRuntimeHintInput): boolean {
  const blob = JSON.stringify(input.crisisState ?? '').toLocaleLowerCase('tr-TR');
  if (['active', 'watch', 'elevated', 'critical'].some((token) => blob.includes(token))) {
    return true;
  }
  const signals = input.operationSignals as { overall?: { status?: string } } | undefined;
  return signals?.overall?.status === 'critical';
}

function hasCarryOrMemorySignal(input: BuildStoryChainRuntimeHintInput): boolean {
  if (input.carryOverMemory?.visible) return true;
  if (input.carryOverLine?.trim()) return true;
  const memory = input.districtMemorySnapshot;
  if (!memory) return false;
  return memory.districts.some(
    (entry) => entry.primaryKind && entry.primaryKind !== 'quiet_stable',
  );
}

function selectedActionForDay(
  input: BuildStoryChainRuntimeHintInput,
): CreviaDistrictOperationAction | undefined {
  const day = resolveDay(input);
  return input.districtOperationActionState?.selectedByDay?.[day];
}

function buildResolverContext(input: BuildStoryChainRuntimeHintInput): CreviaStoryChainContext {
  const day = resolveDay(input);
  const districtId = resolveDistrictId(input);
  const trustSnapshot =
    input.districtTrustSnapshot ??
    buildDistrictTrustRuntimeSnapshot({
      day,
      focusDistrictId: districtId,
      operationSignals: input.operationSignals,
      crisisState: input.crisisState,
      resourceFatigue: input.resourceFatigue,
    });
  const memorySnapshot =
    input.districtMemorySnapshot ??
    buildDistrictMemoryRuntimeSnapshot({
      day,
      focusDistrictId: districtId,
      trustSnapshot,
      operationSignals: input.operationSignals,
      carryOverMemory: input.carryOverMemory,
      crisisState: input.crisisState,
    });

  return buildStoryChainContext({
    currentDay: day,
    selectedDistrictId: districtId,
    districtTrustSnapshot: trustSnapshot,
    districtMemorySnapshot: memorySnapshot,
    districtOperationsRecommendation: input.districtOperationsSnapshot,
    districtOperationActionState: input.districtOperationActionState,
    operationSignals: input.operationSignals,
    resourceFatigue: input.resourceFatigue,
    crisisState: input.crisisState,
    recentEventExposure: input.recentEventExposure,
    activeRouteHint: input.activeTaskRouteModel ?? input.activeTaskRouteContext,
    rankKey: input.rankKey,
    unlockedPermissionIds: input.unlockedPermissionIds,
    ...input.storyChainContext,
  });
}

function resolveChain(input: BuildStoryChainRuntimeHintInput): CreviaResolvedStoryChain | null {
  try {
    const districtId = resolveDistrictId(input);
    const context = buildResolverContext(input);
    return resolveStoryChainForDistrict(districtId, context);
  } catch {
    return null;
  }
}

function copyMaxForVisibility(visibility: CreviaStoryChainRuntimeHintVisibility): number {
  if (visibility === 'subtle' || visibility === 'compact') return STORY_CHAIN_COMPACT_COPY_MAX;
  return STORY_CHAIN_MOBILE_COPY_MAX;
}

function crisisAdjustedCopy(text: string, input: BuildStoryChainRuntimeHintInput, max: number): string {
  if (!hasCrisisContext(input)) return safeHintCopy(text, max);
  const crisisSafe = text
    .replace(/panik/gi, 'takip')
    .replace(/alarm/gi, 'izleme')
    .replace(/kriz patladı/gi, 'takip penceresi açıldı');
  if (!crisisSafe.toLocaleLowerCase('tr-TR').includes('takip penceresi')) {
    return safeHintCopy(`${crisisSafe} Takip penceresi sakin tutulmalı.`, max);
  }
  return safeHintCopy(crisisSafe, max);
}

function buildSurfaceCopy(
  surface: CreviaStoryChainRuntimeHintSurface,
  input: BuildStoryChainRuntimeHintInput,
  visibility: CreviaStoryChainRuntimeHintVisibility,
): { text: string; source: CreviaStoryChainRuntimeHintSource; chainKind?: CreviaStoryChainKind; stepKind?: CreviaStoryChainStepKind } {
  const districtId = resolveDistrictId(input);
  const context = buildResolverContext(input);
  const max = copyMaxForVisibility(visibility);
  const selectedAction = selectedActionForDay(input);
  const chain = resolveChain(input);

  if (selectedAction?.status === 'selected') {
    const label = selectedAction.shortLabel ?? selectedAction.label;
    return {
      text: crisisAdjustedCopy(
        `${districtName(districtId)}: ${label} için saha takip izi yarına taşınabilir.`,
        input,
        max,
      ),
      source: 'district_operation_action',
      chainKind: 'operation_followup_chain',
      stepKind: 'follow_up',
    };
  }

  const builders: Record<CreviaStoryChainRuntimeHintSurface, () => string> = {
    hub: () => buildStoryChainHubLine(districtId, context),
    map: () => buildStoryChainMapLine(districtId, context),
    result: () => buildStoryChainResultLine(districtId, context),
    report: () => buildStoryChainReportLine(districtId, context),
    advisor: () => buildStoryChainAdvisorLine(districtId, context),
    tomorrow: () => buildStoryChainTomorrowLine(districtId, context),
  };

  let text = crisisAdjustedCopy(builders[surface](), input, max);

  if (hasCrisisContext(input) && surface !== 'advisor') {
    text = safeHintCopy(text, max, 'Mahallede kısa saha izi için takip penceresi açık.');
  }

  if (input.activeRouteLine && surface === 'map' && chain?.kind === 'route_pressure_chain') {
    text = safeHintCopy(
      `${districtName(districtId)} rotasında önceki kararın etkisi izleniyor.`,
      max,
    );
  }

  return {
    text,
    source: chain ? 'story_chain_resolver' : 'fallback',
    chainKind: chain?.kind,
    stepKind: chain?.steps[chain.currentStepIndex]?.stepKind,
  };
}

export function buildStoryChainRuntimeHintVisibility(
  input: BuildStoryChainRuntimeHintInput = {},
): CreviaStoryChainRuntimeHintVisibility {
  const day = resolveDay(input);
  if (isStoryChainDayOneBlocked(day)) return 'hidden';

  if (day <= 3) {
    return hasCarryOrMemorySignal(input) ? 'subtle' : 'hidden';
  }

  if (day <= 7) return 'compact';

  const isPostPilot =
    input.isPostPilot === true ||
    input.isPilotCompleted === true ||
    day >= POST_PILOT_FIRST_OPERATION_DAY;

  return isPostPilot ? 'detailed' : 'standard';
}

export function buildStoryChainHintSuppressionReason(
  context: StoryChainHintSuppressionContext,
): string | undefined {
  const { surface, hintText, input, existingLines = [] } = context;
  const day = resolveDay(input);
  const visibility = buildStoryChainRuntimeHintVisibility(input);

  if (visibility === 'hidden') return 'day_one_or_early_hidden';
  if (day <= 3 && !hasCarryOrMemorySignal(input)) return 'early_day_insufficient_signals';

  if (input.isCarryOverCardVisible && surface === 'hub') return 'carry_over_card_visible';

  const allExisting = [
    ...existingLines,
    ...(input.existingLines ?? []),
    input.carryOverLine ?? '',
    input.carryOverMemory?.summary ?? '',
    input.tomorrowPreviewLine ?? '',
    input.reportTomorrowPreview?.preview?.summary ?? '',
    input.districtMemoryUnresolvedLine ?? '',
    input.districtOperationActionSummary ?? '',
    input.activeRouteLine ?? '',
    ...(input.dailyReport?.carryOverSummaryLines ?? []),
    ...(input.dailyReport?.summaryLines ?? []),
  ].filter(Boolean);

  if (!hintText?.trim()) return 'empty_hint_copy';

  if (isDuplicateAgainst(hintText, allExisting)) return 'existing_line_semantic_duplicate';

  if (surface === 'hub' && input.isCarryOverCardVisible) return 'carry_over_card_visible';
  if (
    input.carryOverLine &&
    isSemanticDuplicate(hintText, input.carryOverLine)
  ) {
    return 'carry_over_line_duplicate';
  }
  if (
    input.tomorrowPreviewLine &&
    isSemanticDuplicate(hintText, input.tomorrowPreviewLine)
  ) {
    return 'tomorrow_preview_duplicate';
  }
  if (
    input.districtMemoryUnresolvedLine &&
    isSemanticDuplicate(hintText, input.districtMemoryUnresolvedLine)
  ) {
    return 'district_memory_unresolved_duplicate';
  }
  if (
    input.districtOperationActionSummary &&
    isSemanticDuplicate(hintText, input.districtOperationActionSummary)
  ) {
    return 'district_operation_action_duplicate';
  }
  if (input.activeRouteLine && isSemanticDuplicate(hintText, input.activeRouteLine)) {
    return 'active_route_duplicate';
  }
  if (surface === 'advisor' && input.isAdvisorInsightVisible) {
    return 'advisor_insight_duplicate';
  }

  return undefined;
}

export function shouldSuppressStoryChainHintForSurface(
  context: StoryChainHintSuppressionContext,
): boolean {
  return buildStoryChainHintSuppressionReason(context) !== undefined;
}

export function mergeStoryChainHintWithExistingLines(
  hintText: string,
  existingLines: string[] = [],
): { text: string; merged: boolean; suppressed: boolean } {
  if (!hintText.trim()) return { text: '', merged: false, suppressed: true };
  if (isDuplicateAgainst(hintText, existingLines)) {
    return { text: '', merged: false, suppressed: true };
  }
  return { text: hintText, merged: true, suppressed: false };
}

function surfaceTone(
  chainKind?: CreviaStoryChainKind,
  crisis?: boolean,
): CreviaStoryChainRuntimeHintLine['tone'] {
  if (crisis) return 'warn';
  if (chainKind === 'social_trust_chain' || chainKind === 'visible_service_chain') return 'teal';
  if (chainKind === 'district_recovery_chain' || chainKind === 'container_recovery_chain') return 'mint';
  if (chainKind === 'route_pressure_chain' || chainKind === 'resource_fatigue_chain') return 'gold';
  return 'neutral';
}

function surfaceLabel(surface: CreviaStoryChainRuntimeHintSurface): string {
  if (surface === 'hub') return 'Zincir Odağı';
  if (surface === 'map') return 'Saha İzi';
  if (surface === 'result') return 'Zincir Sonucu';
  if (surface === 'report') return 'Yarına İz';
  if (surface === 'advisor') return 'Ece Notu';
  return 'Takip Penceresi';
}

function surfaceIcon(surface: CreviaStoryChainRuntimeHintSurface): string {
  if (surface === 'map') return 'trail-sign-outline';
  if (surface === 'result') return 'git-network-outline';
  if (surface === 'report' || surface === 'tomorrow') return 'arrow-forward-circle-outline';
  if (surface === 'advisor') return 'chatbubble-ellipses-outline';
  return 'link-outline';
}

function surfacePriority(surface: CreviaStoryChainRuntimeHintSurface): number {
  if (surface === 'hub') return 62;
  if (surface === 'map') return 58;
  if (surface === 'result') return 48;
  if (surface === 'report' || surface === 'tomorrow') return 46;
  return 40;
}

function buildHintLineForSurface(
  surface: CreviaStoryChainRuntimeHintSurface,
  input: BuildStoryChainRuntimeHintInput,
  existingLines: string[] = [],
): CreviaStoryChainRuntimeHintLine | null {
  const visibility = buildStoryChainRuntimeHintVisibility(input);
  if (visibility === 'hidden') return null;

  const copy = buildSurfaceCopy(surface, input, visibility);
  const suppressionReason = buildStoryChainHintSuppressionReason({
    surface,
    hintText: copy.text,
    input,
    existingLines,
  });
  if (suppressionReason) return null;

  const merged = mergeStoryChainHintWithExistingLines(copy.text, existingLines);
  if (merged.suppressed || !merged.text) return null;

  const districtId = resolveDistrictId(input);
  const crisis = hasCrisisContext(input) || input.crisisOverlayVisible === true;
  const maxLines: 1 | 2 = visibility === 'subtle' || surface === 'map' || crisis ? 1 : 2;

  return {
    id: `story-chain-hint-${surface}`,
    surface,
    text: merged.text,
    label: surfaceLabel(surface),
    chainKind: copy.chainKind,
    stepKind: copy.stepKind,
    districtId,
    visibility,
    source: copy.source,
    priority: surfacePriority(surface),
    iconKey: surfaceIcon(surface),
    tone: surfaceTone(copy.chainKind, crisis),
    isHintOnly: true,
    maxLines,
  };
}

export function buildStoryChainHintForHub(
  input: BuildStoryChainRuntimeHintInput = {},
  existingLines: string[] = [],
): CreviaStoryChainRuntimeHintLine | null {
  return buildHintLineForSurface('hub', input, existingLines);
}

export function buildStoryChainHintForMap(
  input: BuildStoryChainRuntimeHintInput = {},
  existingLines: string[] = [],
): CreviaStoryChainRuntimeHintLine | null {
  if (input.crisisOverlayVisible) {
    const compactInput = { ...input, crisisOverlayVisible: true };
    return buildHintLineForSurface('map', compactInput, existingLines);
  }
  return buildHintLineForSurface('map', input, existingLines);
}

export function buildStoryChainHintForResult(
  input: BuildStoryChainRuntimeHintInput = {},
  existingLines: string[] = [],
): CreviaStoryChainRuntimeHintLine | null {
  return buildHintLineForSurface('result', input, existingLines);
}

export function buildStoryChainHintForReport(
  input: BuildStoryChainRuntimeHintInput = {},
  existingLines: string[] = [],
): CreviaStoryChainRuntimeHintLine | null {
  return buildHintLineForSurface('report', input, existingLines);
}

export function buildStoryChainHintForAdvisor(
  input: BuildStoryChainRuntimeHintInput = {},
  existingLines: string[] = [],
): CreviaStoryChainRuntimeHintLine | null {
  return buildHintLineForSurface('advisor', input, existingLines);
}

export function buildStoryChainHintForTomorrow(
  input: BuildStoryChainRuntimeHintInput = {},
  existingLines: string[] = [],
): CreviaStoryChainRuntimeHintLine | null {
  return buildHintLineForSurface('tomorrow', input, existingLines);
}

function deriveHealthStatus(
  visibility: CreviaStoryChainRuntimeHintVisibility,
  chain: CreviaResolvedStoryChain | null,
  suppressed: boolean,
): CreviaStoryChainRuntimeHintHealthStatus {
  if (suppressed) return 'suppressed';
  if (visibility === 'hidden') return 'blocked';
  if (!chain) return 'fallback';
  if (chain.healthStatus === 'blocked') return 'blocked';
  if (chain.healthStatus === 'fallback') return 'fallback';
  if (chain.healthStatus === 'limited') return 'limited';
  if (chain.healthStatus === 'watch') return 'watch';
  return 'healthy';
}

export function buildStoryChainRuntimeHintModel(
  input: BuildStoryChainRuntimeHintInput = {},
): CreviaStoryChainRuntimeHintModel {
  const visibility = buildStoryChainRuntimeHintVisibility(input);
  const existing = [...(input.existingLines ?? [])];
  const chain = resolveChain(input);

  const hubLine = buildStoryChainHintForHub(input, existing);
  if (hubLine) existing.push(hubLine.text);

  const mapLine = buildStoryChainHintForMap(input, existing);
  if (mapLine) existing.push(mapLine.text);

  const resultLine = buildStoryChainHintForResult(input, existing);
  if (resultLine) existing.push(resultLine.text);

  const reportLine = buildStoryChainHintForReport(input, existing);
  if (reportLine) existing.push(reportLine.text);

  const advisorLine = buildStoryChainHintForAdvisor(input, existing);
  const tomorrowLine = buildStoryChainHintForTomorrow(input, existing);

  const visibleSurfaces = [hubLine, mapLine, resultLine, reportLine, advisorLine, tomorrowLine].filter(
    Boolean,
  ) as CreviaStoryChainRuntimeHintLine[];

  const suppressionReasons: string[] = [];
  for (const surface of ['hub', 'map', 'result', 'report', 'advisor', 'tomorrow'] as const) {
    const copy = buildSurfaceCopy(surface, input, visibility);
    const reason = buildStoryChainHintSuppressionReason({
      surface,
      hintText: copy.text,
      input,
      existingLines: input.existingLines ?? [],
    });
    if (reason) suppressionReasons.push(`${surface}:${reason}`);
  }

  const model: CreviaStoryChainRuntimeHintModel = {
    visible: visibleSurfaces.length > 0 && visibility !== 'hidden',
    visibility,
    healthStatus: deriveHealthStatus(visibility, chain, visibleSurfaces.length === 0),
    chainKind: chain?.kind,
    stepKind: chain?.steps[chain.currentStepIndex]?.stepKind,
    districtId: resolveDistrictId(input),
    hubLine: hubLine ?? undefined,
    mapLine: mapLine ?? undefined,
    resultLine: resultLine ?? undefined,
    reportLine: reportLine ?? undefined,
    advisorLine: advisorLine ?? undefined,
    tomorrowLine: tomorrowLine ?? undefined,
    isRuntimeLinked: false,
    suppressionReasons,
    debugRows: [],
  };

  return { ...model, debugRows: buildStoryChainRuntimeHintDebugRows(model, input) };
}

export function buildStoryChainRuntimeHintDebugRows(
  model: CreviaStoryChainRuntimeHintModel,
  input: BuildStoryChainRuntimeHintInput = {},
): string[] {
  const day = resolveDay(input);
  const chain = resolveChain(input);
  return [
    `day: ${day}`,
    `visible: ${model.visible}`,
    `visibility: ${model.visibility}`,
    `health: ${model.healthStatus}`,
    `district: ${model.districtId ?? 'n/a'}`,
    `chainKind: ${model.chainKind ?? chain?.kind ?? 'n/a'}`,
    `stepKind: ${model.stepKind ?? 'n/a'}`,
    `hub: ${model.hubLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `map: ${model.mapLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `result: ${model.resultLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `report: ${model.reportLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `suppressed: ${model.suppressionReasons.length}`,
  ];
}

export function validateStoryChainRuntimeHintCopy(text: string, max = STORY_CHAIN_MOBILE_COPY_MAX): boolean {
  const result = validateStoryChainPresentationCopy(text, max);
  return result.ok;
}
