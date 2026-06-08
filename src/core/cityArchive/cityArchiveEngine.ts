import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  CITY_ARCHIVE_DAY1_MAX_APPEND,
  CITY_ARCHIVE_ENTRY_KIND_LABELS,
  CITY_ARCHIVE_MAX_DAILY_APPEND,
  CITY_ARCHIVE_PRESERVED_KINDS,
} from './cityArchiveConstants';
import { createInitialCityArchiveState, cityArchiveCopyContainsForbidden } from './cityArchiveState';
import type {
  CityArchiveAppendOptions,
  CityArchiveDayCloseInput,
  CityArchiveDistrictSummary,
  CityArchiveEntry,
  CityArchiveEntryKind,
  CityArchiveEntrySourceKind,
  CityArchivePriority,
  CityArchiveV1State,
} from './cityArchiveTypes';

let entryCounter = 0;

function nextEntryId(prefix: string): string {
  entryCounter += 1;
  return `ca-${prefix}-${entryCounter}`;
}

function cleanLine(text: string, limit = 96): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

export function makeCityArchiveDuplicateKey(
  entry: Pick<
    CityArchiveEntry,
    'day' | 'kind' | 'districtId' | 'eventId' | 'decisionId' | 'sourceKind'
  >,
): string {
  return [
    entry.day,
    entry.kind,
    entry.districtId ?? 'city',
    entry.eventId ?? '',
    entry.decisionId ?? '',
    entry.sourceKind,
  ].join('|');
}

function resolveDistrictId(raw?: string | null): MapDistrictId | undefined {
  if (!raw) return undefined;
  return normalizeMapDistrictId(raw) ?? undefined;
}

function draftEntry(params: {
  day: number;
  kind: CityArchiveEntryKind;
  sourceKind: CityArchiveEntrySourceKind;
  title?: string;
  shortLine: string;
  districtId?: MapDistrictId;
  eventId?: string;
  decisionId?: string;
  priority?: CityArchivePriority;
  reportLine?: string;
  eceLine?: string;
  socialLine?: string;
  mapLine?: string;
  isPlayerVisible?: boolean;
}): CityArchiveEntry | null {
  const shortLine = cleanLine(params.shortLine);
  if (!shortLine || cityArchiveCopyContainsForbidden(shortLine)) return null;
  const duplicateKey = makeCityArchiveDuplicateKey({
    day: params.day,
    kind: params.kind,
    districtId: params.districtId,
    eventId: params.eventId,
    decisionId: params.decisionId,
    sourceKind: params.sourceKind,
  });
  return {
    id: nextEntryId(params.kind),
    day: params.day,
    kind: params.kind,
    districtId: params.districtId,
    eventId: params.eventId,
    decisionId: params.decisionId,
    sourceKind: params.sourceKind,
    title: params.title ?? CITY_ARCHIVE_ENTRY_KIND_LABELS[params.kind],
    shortLine,
    reportLine: params.reportLine ? cleanLine(params.reportLine) : undefined,
    eceLine: params.eceLine ? cleanLine(params.eceLine) : undefined,
    socialLine: params.socialLine ? cleanLine(params.socialLine) : undefined,
    mapLine: params.mapLine ? cleanLine(params.mapLine) : undefined,
    isPlayerVisible: params.isPlayerVisible !== false,
    priority: params.priority ?? 'medium',
    duplicateKey,
    createdFrom: params.sourceKind,
    createdAtDay: params.day,
  };
}

export function shouldArchiveEntry(
  state: CityArchiveV1State,
  entry: CityArchiveEntry,
): boolean {
  if (!entry.shortLine?.trim()) return false;
  if (cityArchiveCopyContainsForbidden(entry.shortLine)) return false;
  const existingKeys = new Set(state.entries.map((e) => e.duplicateKey));
  if (existingKeys.has(entry.duplicateKey)) return false;
  if (entry.kind === 'main_operation_started') {
    return !state.entries.some((e) => e.kind === 'main_operation_started');
  }
  const sameDayKind = state.entries.some(
    (e) =>
      e.day === entry.day &&
      e.kind === entry.kind &&
      e.districtId === entry.districtId &&
      (entry.eventId ? e.eventId === entry.eventId : true),
  );
  return !sameDayKind;
}

export function buildCityArchiveEntriesForDay(
  input: CityArchiveDayCloseInput,
): CityArchiveEntry[] {
  const day = input.day;
  const maxAppend =
    day <= 1 ? CITY_ARCHIVE_DAY1_MAX_APPEND : CITY_ARCHIVE_MAX_DAILY_APPEND;
  const drafts: CityArchiveEntry[] = [];
  const districtId = resolveDistrictId(input.districtId ?? undefined);

  const push = (entry: CityArchiveEntry | null) => {
    if (!entry) return;
    if (drafts.some((d) => d.duplicateKey === entry.duplicateKey)) return;
    drafts.push(entry);
  };

  if (input.lastDailyReport) {
    const summary =
      input.lastDailyReport.summary ??
      input.lastDailyReport.headline ??
      `Gün ${day} raporu kayda geçti.`;
    push(
      draftEntry({
        day,
        kind: 'report_milestone',
        sourceKind: 'manualFallback',
        shortLine: cleanLine(summary),
        priority: 'milestone',
        reportLine: cleanLine(summary),
        isPlayerVisible: day > 1,
      }),
    );
  }

  const dayDecision = [...(input.dayDecisions ?? [])]
    .filter((d) => d.day === day)
    .pop();
  if (dayDecision) {
    push(
      draftEntry({
        day,
        kind: 'decision_record',
        sourceKind: 'decisionImpact',
        shortLine:
          dayDecision.summary ??
          `Gün ${day}: operasyon kararı kayda geçti.`,
        districtId: resolveDistrictId(dayDecision.neighborhoodId),
        eventId: dayDecision.eventId,
        decisionId: dayDecision.decisionId ?? dayDecision.id,
        priority: day <= 1 ? 'low' : 'medium',
      }),
    );
  }

  if (input.districtReportLine && districtId) {
    push(
      draftEntry({
        day,
        kind: 'district_shift',
        sourceKind: 'districtReportCard',
        shortLine: input.districtReportLine,
        districtId,
        priority: 'medium',
      }),
    );
  }

  if (input.rewardComebackLine) {
    const kind: CityArchiveEntryKind =
      input.rewardComebackKind === 'comeback_completed'
        ? 'comeback_completed'
        : input.rewardComebackKind === 'comeback_available'
          ? 'comeback_available'
          : 'trust_recovery';
    push(
      draftEntry({
        day,
        kind,
        sourceKind: 'rewardComeback',
        shortLine: input.rewardComebackLine,
        districtId,
        priority: 'high',
      }),
    );
  }

  if (input.advisorPredictionLine && day >= 4) {
    push(
      draftEntry({
        day,
        kind: 'ece_prediction_confirmed',
        sourceKind: 'advisorRelationship',
        shortLine: input.advisorPredictionLine,
        eceLine: input.advisorPredictionLine,
        districtId,
        priority: 'medium',
      }),
    );
  }

  if (
    day === POST_PILOT_FIRST_OPERATION_DAY &&
    (input.isPostPilot || input.isPilotCompleted) &&
    input.mainOperationFeelLine
  ) {
    push(
      draftEntry({
        day,
        kind: 'main_operation_started',
        sourceKind: 'manualFallback',
        shortLine: input.mainOperationFeelLine,
        districtId,
        priority: 'milestone',
        isPlayerVisible: true,
      }),
    );
  }

  if (input.carryOverLine && day >= 2) {
    push(
      draftEntry({
        day,
        kind: 'resource_pressure',
        sourceKind: 'operationSignals',
        shortLine: input.carryOverLine,
        districtId,
        priority: 'low',
      }),
    );
  }

  if (input.operationSignalLine && day >= 3) {
    push(
      draftEntry({
        day,
        kind: 'resource_pressure',
        sourceKind: 'operationSignals',
        shortLine: input.operationSignalLine,
        districtId,
        priority: 'low',
      }),
    );
  }

  if (drafts.length === 0 && day >= 4) {
    push(
      draftEntry({
        day,
        kind: 'report_milestone',
        sourceKind: 'manualFallback',
        shortLine: `Gün ${day}: şehir arşivi başladı.`,
        priority: 'low',
        isPlayerVisible: false,
      }),
    );
  }

  return drafts.slice(0, maxAppend);
}

export function updateCityArchiveSummaries(
  state: CityArchiveV1State,
  entries: CityArchiveEntry[],
): CityArchiveV1State {
  if (entries.length === 0) return state;
  const districtSummaries = { ...state.districtSummaries };
  const rewardComebackSummary = { ...state.rewardComebackSummary };
  const eceRelationshipSummary = { ...state.eceRelationshipSummary };

  for (const entry of entries) {
    if (entry.districtId) {
      const existing: CityArchiveDistrictSummary = districtSummaries[entry.districtId] ?? {
        districtId: entry.districtId,
        lastUpdatedDay: entry.day,
        recentEntryIds: [],
        trustTrend: 'flat',
        socialTone: 'stable',
        resourceTone: 'stable',
      };
      districtSummaries[entry.districtId] = {
        ...existing,
        lastUpdatedDay: entry.day,
        recentEntryIds: [entry.id, ...existing.recentEntryIds].slice(0, 5),
        lastPositiveMoment:
          entry.kind === 'trust_recovery' || entry.kind === 'comeback_completed'
            ? entry.shortLine
            : existing.lastPositiveMoment,
        lastWarningMoment:
          entry.kind === 'resource_pressure' || entry.kind === 'crisis_prevented'
            ? entry.shortLine
            : existing.lastWarningMoment,
      };
    }

    if (
      entry.kind === 'trust_recovery' ||
      entry.kind === 'comeback_completed' ||
      entry.kind === 'route_balanced'
    ) {
      rewardComebackSummary.recentPositiveEntryIds = [
        entry.id,
        ...rewardComebackSummary.recentPositiveEntryIds,
      ].slice(0, 8);
      rewardComebackSummary.lastUpdatedDay = entry.day;
    }
    if (entry.kind === 'comeback_completed') {
      rewardComebackSummary.recentComebackEntryIds = [
        entry.id,
        ...rewardComebackSummary.recentComebackEntryIds,
      ].slice(0, 5);
      rewardComebackSummary.lastCompletedComebackDay = entry.day;
    }
    if (entry.kind === 'ece_prediction_confirmed') {
      eceRelationshipSummary.lastPredictionEntryId = entry.id;
      eceRelationshipSummary.lastPredictionState = 'confirmed';
      eceRelationshipSummary.lastUpdatedDay = entry.day;
    }
  }

  return {
    ...state,
    districtSummaries,
    rewardComebackSummary,
    eceRelationshipSummary,
  };
}

export function pruneCityArchiveState(state: CityArchiveV1State): CityArchiveV1State {
  const maxEntries = state.pruningState.maxEntries;
  const maxPerDistrict = state.pruningState.maxEntriesPerDistrict;
  let entries = [...state.entries];

  const byDistrict = new Map<string, CityArchiveEntry[]>();
  for (const entry of entries) {
    const key = entry.districtId ?? '_city';
    const list = byDistrict.get(key) ?? [];
    list.push(entry);
    byDistrict.set(key, list);
  }

  const kept: CityArchiveEntry[] = [];
  for (const [, list] of byDistrict) {
    const sorted = [...list].sort((a, b) => b.day - a.day || b.createdAtDay - a.createdAtDay);
    const districtKept: CityArchiveEntry[] = [];
    for (const entry of sorted) {
      if (CITY_ARCHIVE_PRESERVED_KINDS.has(entry.kind)) {
        districtKept.push(entry);
        continue;
      }
      if (districtKept.length < maxPerDistrict) {
        districtKept.push(entry);
      }
    }
    kept.push(...districtKept);
  }

  entries = kept.sort((a, b) => b.day - a.day || b.createdAtDay - a.createdAtDay);

  if (entries.length > maxEntries) {
    const preserved = entries.filter((e) => CITY_ARCHIVE_PRESERVED_KINDS.has(e.kind));
    const rest = entries.filter((e) => !CITY_ARCHIVE_PRESERVED_KINDS.has(e.kind));
    const lowPriority = rest.filter((e) => e.priority === 'low');
    const other = rest.filter((e) => e.priority !== 'low');
    const budget = maxEntries - preserved.length;
    entries = [...preserved, ...other, ...lowPriority].slice(0, maxEntries);
    if (entries.length > maxEntries) {
      entries = [...preserved, ...other].slice(0, budget).concat(preserved);
    }
  }

  const compactedCount = state.entries.length - entries.length;
  return {
    ...state,
    entries,
    pruningState: {
      ...state.pruningState,
      compactedEntryCount: state.pruningState.compactedEntryCount + Math.max(0, compactedCount),
      compactedBeforeDay:
        compactedCount > 0
          ? Math.min(...entries.map((e) => e.day))
          : state.pruningState.compactedBeforeDay,
    },
  };
}

export function appendCityArchiveEntries(
  state: CityArchiveV1State,
  entries: CityArchiveEntry[],
  options: CityArchiveAppendOptions,
): CityArchiveV1State {
  if (entries.length === 0) return state;
  const day = options.day;
  if (state.updatedAtDay === day && options.skipDuplicate !== false) {
    const batchKeys = new Set(entries.map((e) => e.duplicateKey));
    const alreadyWritten = state.entries.some(
      (e) => e.day === day && batchKeys.has(e.duplicateKey),
    );
    if (alreadyWritten && entries.every((e) => !shouldArchiveEntry(state, e))) {
      return state;
    }
  }

  const toAdd: CityArchiveEntry[] = [];
  for (const entry of entries) {
    if (shouldArchiveEntry(state, entry)) {
      toAdd.push(entry);
    }
  }
  if (toAdd.length === 0) return state;

  let next: CityArchiveV1State = {
    ...state,
    entries: [...state.entries, ...toAdd],
    updatedAtDay: day,
  };
  next = updateCityArchiveSummaries(next, toAdd);
  next = pruneCityArchiveState(next);
  return next;
}

export function ensureCityArchiveState(
  state: CityArchiveV1State | null | undefined,
  currentDay: number,
): CityArchiveV1State {
  if (!state) return createInitialCityArchiveState(currentDay);
  return state;
}
