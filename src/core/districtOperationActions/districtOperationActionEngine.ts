import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import { buildDistrictOperationsRuntimeSnapshot } from '@/core/districtOperationsRuntime/districtOperationsRuntimeModel';
import type { CreviaDistrictOperationRuntimeRecommendation } from '@/core/districtOperationsRuntime/districtOperationsRuntimeTypes';
import { buildOperationSignal, clampSignalScore } from '@/core/operations/operationSignalState';
import type { OperationDomainSignal, OperationSignalsState } from '@/core/operations/operationSignalTypes';

import {
  DISTRICT_OPERATION_ACTION_CTA_LABELS,
  DISTRICT_OPERATION_ACTION_MAX_COPY,
  DISTRICT_OPERATION_ACTION_MIN_SELECTABLE_DAY,
  DISTRICT_OPERATION_ACTION_PREVIEW_START_DAY,
} from './districtOperationActionConstants';
import type {
  CreviaDistrictOperationAction,
  CreviaDistrictOperationActionContext,
  CreviaDistrictOperationActionDailySummary,
  CreviaDistrictOperationActionEffect,
  CreviaDistrictOperationActionHealthStatus,
  CreviaDistrictOperationActionState,
  CreviaDistrictOperationActionStatus,
} from './districtOperationActionTypes';

function cleanCopy(text: string, max = DISTRICT_OPERATION_ACTION_MAX_COPY): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function dayOf(context: CreviaDistrictOperationActionContext): number {
  return Math.max(1, Math.round(context.day ?? 1));
}

function rankBand(rankKey?: string): CreviaDistrictOperationAction['rankBand'] {
  const rank = rankKey ?? '';
  if (rank.includes('director') || rank.includes('chief')) return 'senior';
  if (rank.includes('manager') || rank.includes('coordinator')) return 'standard';
  return 'early';
}

function statusFor(
  day: number,
  actionId: string,
  operationKey: string,
  state: Pick<CreviaDistrictOperationActionState, 'selectedByDay' | 'recentDistrictOperationKeys'>,
): CreviaDistrictOperationActionStatus {
  if (day <= 1) return 'blocked';
  if (day < DISTRICT_OPERATION_ACTION_MIN_SELECTABLE_DAY) return 'preview_only';
  if (state.selectedByDay[day]?.id) return state.selectedByDay[day]!.id === actionId ? 'selected' : 'blocked';
  if (state.recentDistrictOperationKeys.slice(-2).includes(operationKey)) return 'blocked';
  return 'available';
}

function effectFor(rec: CreviaDistrictOperationRuntimeRecommendation): CreviaDistrictOperationActionEffect {
  const domains = new Set(rec.relatedDomains);
  const deltas: CreviaDistrictOperationActionEffect['operationSignalDeltas'] = {};
  if (domains.has('vehicle_route')) deltas.vehicles = -3;
  if (domains.has('container')) deltas.containers = -3;
  if (domains.has('personnel')) deltas.personnel = 2;
  if (domains.has('social') || domains.has('district_balance')) deltas.districts = -3;
  if (Object.keys(deltas).length === 0) deltas.districts = -2;

  const tradeoff = domains.has('personnel') || rec.kind.includes('timing')
    ? 'Ekip planlama baskısı küçük artar.'
    : domains.has('vehicle_route')
      ? 'Araç yorgunluğu kısa süre izlenmeli.'
      : 'Saha takibi kısa tutulmalı.';

  return {
    operationSignalDeltas: deltas,
    trustDelta: domains.has('social') || domains.has('district_balance') ? 2 : 1,
    memoryTrace: domains.has('vehicle_route') ? 'resource_relief' : domains.has('social') ? 'recovery' : 'follow_up',
    resourceTradeoff: tradeoff,
    summaryLine: cleanCopy(`${rec.shortLabel}: mahalle odağı küçük etkiyle seçildi.`),
    tomorrowLine: cleanCopy(rec.tomorrowLine, 86),
    advisorLine: cleanCopy(rec.advisorLine, 86),
  };
}

function buildActionId(day: number, districtId: string, operationKind: string): string {
  return `doa_${day}_${districtId}_${operationKind}`;
}

function healthFor(status: CreviaDistrictOperationActionStatus, crisisState: unknown): CreviaDistrictOperationActionHealthStatus {
  if (status === 'blocked') return 'blocked';
  if (status === 'preview_only') return 'preview';
  const blob = JSON.stringify(crisisState ?? '').toLocaleLowerCase('tr-TR');
  return blob.includes('critical') || blob.includes('crisis') ? 'limited' : 'healthy';
}

export function createInitialDistrictOperationActionState(): CreviaDistrictOperationActionState {
  return { selectedByDay: {}, appliedActionIds: [], recentDistrictOperationKeys: [] };
}

export function buildDistrictOperationActionForRecommendation(
  recommendation: CreviaDistrictOperationRuntimeRecommendation,
  context: CreviaDistrictOperationActionContext = {},
): CreviaDistrictOperationAction {
  const day = dayOf(context);
  const districtId = recommendation.districtId;
  const key = `${districtId}:${recommendation.kind}`;
  const selectedByDay = context.selectedByDay ?? {};
  const recentDistrictOperationKeys = context.recentDistrictOperationKeys ?? [];
  const id = buildActionId(day, districtId, recommendation.kind);
  const status = statusFor(day, id, key, { selectedByDay, recentDistrictOperationKeys });
  const healthStatus = healthFor(status, context.crisisState);
  const selectable = status === 'available';

  return {
    id,
    day,
    districtId,
    districtName: DISTRICT_IDENTITIES[districtId]?.name ?? districtId,
    operationKind: recommendation.kind,
    label: recommendation.label,
    shortLabel: recommendation.shortLabel,
    status,
    healthStatus,
    isSelectableNow: selectable,
    isPostPilot: day >= 8,
    rankBand: rankBand(context.rankKey),
    ctaLabel: DISTRICT_OPERATION_ACTION_CTA_LABELS[status],
    reasonLine: cleanCopy(recommendation.shortReason, 86),
    effectPreviewLine: cleanCopy(`${recommendation.shortLabel}: küçük etki, ölçülü trade-off.`),
    effect: effectFor(recommendation),
  };
}

export function buildDistrictOperationActionCandidates(
  context: CreviaDistrictOperationActionContext = {},
): CreviaDistrictOperationAction[] {
  const day = dayOf(context);
  if (day < DISTRICT_OPERATION_ACTION_PREVIEW_START_DAY) return [];
  const focusDistrictId =
    normalizeMapDistrictId(context.focusDistrictId ?? undefined) ?? undefined;
  const snapshot = buildDistrictOperationsRuntimeSnapshot({
    day,
    focusDistrictId,
    operationSignals: context.operationSignals,
    resourceFatigue: context.resourceFatigue,
    crisisState: context.crisisState,
    rankKey: context.rankKey,
    unlockedPermissionIds: context.unlockedPermissionIds,
    recentOperationKinds: context.recentDistrictOperationKeys?.map((key) => key.split(':')[1] ?? key),
  });
  const source = focusDistrictId
    ? snapshot.districts.filter((district) => district.districtId === focusDistrictId)
    : snapshot.districts;
  return source
    .flatMap((district) => district.primary ? [district.primary] : [])
    .map((rec) => buildDistrictOperationActionForRecommendation(rec, context))
    .slice(0, 3);
}

export function getAvailableDistrictOperationActionsForDay(
  context: CreviaDistrictOperationActionContext = {},
): CreviaDistrictOperationAction[] {
  return buildDistrictOperationActionCandidates(context).filter((action) =>
    action.status === 'available' || action.status === 'preview_only' || action.status === 'selected'
  );
}

export function selectDistrictOperationAction(
  state: CreviaDistrictOperationActionState,
  action: CreviaDistrictOperationAction,
): CreviaDistrictOperationActionState {
  if (!action.isSelectableNow && state.selectedByDay[action.day]?.id !== action.id) return state;
  const existing = state.selectedByDay[action.day];
  if (existing?.id === action.id) return state;
  if (existing) return state;
  const applied = { ...action, status: 'applied' as const, ctaLabel: DISTRICT_OPERATION_ACTION_CTA_LABELS.applied };
  const key = `${action.districtId}:${action.operationKind}`;
  return {
    selectedByDay: { ...state.selectedByDay, [action.day]: applied },
    appliedActionIds: state.appliedActionIds.includes(action.id)
      ? state.appliedActionIds
      : [...state.appliedActionIds, action.id],
    recentDistrictOperationKeys: [...state.recentDistrictOperationKeys.filter((k) => k !== key), key].slice(-6),
  };
}

function patchSignal(signal: OperationDomainSignal, delta: number | undefined, day: number): OperationDomainSignal {
  if (!delta) return signal;
  const nextScore = clampSignalScore(signal.score + delta);
  return buildOperationSignal(signal.domain, nextScore, signal.score, day, signal.title, signal.summary, [
    ...signal.sourceTags,
    'district_operation_action',
  ]);
}

export function applyDistrictOperationActionEffects(
  signals: OperationSignalsState,
  action: CreviaDistrictOperationAction,
): OperationSignalsState {
  const deltas = action.effect.operationSignalDeltas;
  const personnel = patchSignal(signals.personnel, deltas.personnel, action.day);
  const vehicles = patchSignal(signals.vehicles, deltas.vehicles, action.day);
  const containers = patchSignal(signals.containers, deltas.containers, action.day);
  const districts = patchSignal(signals.districts, deltas.districts, action.day);
  const overallScore = Math.round((personnel.score + vehicles.score + containers.score + districts.score) / 4);
  const overall = buildOperationSignal('overall', overallScore, signals.overall.score, action.day, signals.overall.title, signals.overall.summary, [
    ...signals.overall.sourceTags,
    'district_operation_action',
  ]);
  return {
    ...signals,
    personnel,
    vehicles,
    containers,
    districts,
    overall,
    priorityDistrictId: action.districtId,
    dailyFocus: 'districts',
    lastRefreshedDay: action.day,
  };
}

export function buildDistrictOperationActionDailySummary(
  state: CreviaDistrictOperationActionState,
  day: number,
): CreviaDistrictOperationActionDailySummary {
  const selectedAction = state.selectedByDay[day];
  return {
    day,
    selectedAction,
    reportLines: selectedAction ? [selectedAction.effect.summaryLine] : [],
    tomorrowLines: selectedAction ? [selectedAction.effect.tomorrowLine] : [],
    advisorLines: selectedAction ? [selectedAction.effect.advisorLine] : [],
  };
}
