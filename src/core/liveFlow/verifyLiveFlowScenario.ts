import { createDay1Seed } from '@/core/content/day1Seed';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import type { EventCard } from '@/core/models/EventCard';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import { buildCarryOverReportLines } from '@/core/carryOver/carryOverPresentation';

import {
  buildEventLifecycleContext,
  buildEventLifecycleMeta,
  getEventLifecycleStatusForEvent,
} from './eventLifecycleEngine';
import { buildLiveFlowEntries } from './liveFlowEngine';
import {
  buildCombinedDecisionResolvedEntry,
  collapseDecisionResolvedPairs,
  countRawSemanticDuplicates,
  countVisibleEventDuplicates,
  formatHubTodayFlowLines,
  HUB_TODAY_FLOW_MAX_LINES,
  selectHubVisibleFlowEntries,
} from './liveFlowPresentation';
import { selectHubPrimaryEventPresentation, type LiveFlowStoreSlice } from './liveFlowSelectors';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

type Severity = 'PASS' | 'WARN' | 'FAIL';

function mockDecisionResult(
  partial: Pick<
    DecisionResultSnapshot,
    'eventId' | 'eventTitle' | 'day' | 'summaryText' | 'resultTone'
  >,
): DecisionResultSnapshot {
  return {
    id: `verify-result-${partial.eventId}`,
    day: partial.day,
    eventId: partial.eventId,
    eventTitle: partial.eventTitle,
    decisionId: 'dec-verify',
    decisionTitle: 'Müdahale',
    decisionTone: 'balanced',
    createdAt: 0,
    summaryTitle: 'Sonuç',
    summaryText: partial.summaryText,
    resultTone: partial.resultTone,
    metricChanges: [],
    subsystemOutcomes: [],
    highlightLines: [],
    riskLines: [],
  };
}

function record(
  checks: { name: string; severity: Severity; detail: string }[],
  ok: boolean,
  name: string,
  detail: string,
  severity: Severity = 'FAIL',
): void {
  checks.push({ name, severity: ok ? 'PASS' : severity, detail });
}

function mockEvent(id: string, overrides?: Partial<EventCard>): EventCard {
  return {
    id,
    title: 'Test Olay',
    category: 'operasyon',
    riskLevel: 'medium',
    district: 'Merkez',
    neighborhoodId: 'merkez',
    description: 'd',
    contextTag: 't',
    urgencyHours: 8,
    decisions: [
      {
        id: 'd1',
        title: 'A',
        description: '',
        style: 'balanced',
        effects: {
          publicSatisfaction: 0,
          budget: 0,
          morale: 0,
          risk: 0,
          xp: 0,
        },
      },
    ],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    ...overrides,
  };
}

function baseSlice(overrides: Partial<LiveFlowStoreSlice>): LiveFlowStoreSlice {
  const seed = createDay1Seed();
  return {
    gameState: seed.gameState,
    eventPool: seed.eventPool,
    decisionHistory: [],
    lastDecisionResult: null,
    lastDailyReport: null,
    dailyPriorityByDay: {},
    dailyGoalsByDay: {},
    ...overrides,
  };
}

export function verifyLiveFlowScenario(): {
  ok: boolean;
  failCount: number;
  warnCount: number;
  checks: string[];
} {
  const checks: { name: string; severity: Severity; detail: string }[] = [];
  const day = 3;

  const active = mockEvent('ev-active');
  const ctx = buildEventLifecycleContext({
    currentDay: day,
    decisionHistory: [],
    solvedEventIds: [],
  });
  const activeMeta = buildEventLifecycleMeta(active, ctx, []);
  record(checks, activeMeta.status === 'active' && activeMeta.canDecide, 'active_status', activeMeta.status);
  record(checks, activeMeta.canDecide === true, 'active_can_decide', String(activeMeta.canDecide));

  const todayRecord: DecisionRecord = {
    id: 'r1',
    day,
    eventId: 'ev-resolved',
    eventTitle: 'Çözülen',
    decisionId: 'd1',
    decisionLabel: 'Müdahale',
    appliedEffects: {},
    createdAt: '',
  };
  const resolvedEvent = mockEvent('ev-resolved');
  const ctxResolved = buildEventLifecycleContext({
    currentDay: day,
    decisionHistory: [todayRecord],
    solvedEventIds: ['ev-resolved'],
  });
  const resolvedMeta = buildEventLifecycleMeta(resolvedEvent, ctxResolved, [todayRecord]);
  record(checks, resolvedMeta.status === 'resolved_today', 'resolved_today', resolvedMeta.status);
  record(checks, resolvedMeta.canDecide === false, 'resolved_no_decide', String(resolvedMeta.canDecide));
  const prevRecord: DecisionRecord = { ...todayRecord, id: 'r2', day: day - 1, eventId: 'ev-old' };
  const archivedEvent = mockEvent('ev-old');
  const ctxArch = buildEventLifecycleContext({
    currentDay: day,
    decisionHistory: [prevRecord],
    solvedEventIds: ['ev-old'],
  });
  const archMeta = buildEventLifecycleMeta(archivedEvent, ctxArch, [prevRecord]);
  record(checks, archMeta.status === 'archived', 'archived', archMeta.status);

  const followUp = mockEvent('ev-bf', {
    butterflyMeta: {
      hookId: 'h1',
      label: 'Karar Yankısı',
    },
  });
  const followMeta = buildEventLifecycleMeta(followUp, ctx, []);
  record(checks, followMeta.status === 'follow_up', 'follow_up', followMeta.status);

  const watching = mockEvent('ev-co', {
    carryOverMeta: { signalId: 's1', label: 'Sinyal', tone: 'neutral' },
  });
  const watchMeta = buildEventLifecycleMeta(watching, ctx, []);
  record(checks, watchMeta.status === 'watching', 'watching', watchMeta.status);

  const resultSnapshot = mockDecisionResult({
    eventId: 'ev-resolved',
    eventTitle: 'Çözülen',
    day,
    summaryText: 'Saha riski azaldı.',
    resultTone: 'positive',
  });

  const rawEntries = buildLiveFlowEntries({
    currentDay: day,
    activeEvents: [active],
    decisionHistory: [todayRecord],
    lastDecisionResult: resultSnapshot,
    isDay1Tutorial: false,
  });

  const visibleEntries = selectHubVisibleFlowEntries(rawEntries);
  const hubLines = formatHubTodayFlowLines(rawEntries);

  record(checks, hubLines.length <= HUB_TODAY_FLOW_MAX_LINES, 'hub_max_3', String(hubLines.length));
  record(checks, hubLines.every((l) => l.text.trim().length > 0), 'flow_text', 'ok');

  const combinedForEvent = visibleEntries.filter(
    (e) => e.relatedEventId === 'ev-resolved',
  );
  record(
    checks,
    combinedForEvent.length === 1,
    'decision_resolved_visible_single',
    String(combinedForEvent.length),
  );
  record(
    checks,
    combinedForEvent[0]?.type === 'decision_resolved',
    'combined_entry_type',
    combinedForEvent[0]?.type ?? 'none',
  );
  record(
    checks,
    Boolean(combinedForEvent[0]?.text?.trim()),
    'combined_entry_text',
    combinedForEvent[0]?.text ?? 'empty',
  );
  record(
    checks,
    combinedForEvent[0]?.tone === 'positive',
    'combined_entry_tone',
    combinedForEvent[0]?.tone ?? 'none',
  );

  const visibleEventIds = visibleEntries
    .map((e) => e.relatedEventId)
    .filter(Boolean);
  record(
    checks,
    new Set(visibleEventIds).size === visibleEventIds.length,
    'visible_no_duplicate_event',
    visibleEventIds.join(','),
  );

  const rawDup = countRawSemanticDuplicates(rawEntries);
  const visibleDup = countVisibleEventDuplicates(visibleEntries);
  record(
    checks,
    visibleDup === 0,
    'visible_duplicate_zero',
    `raw=${rawDup} visible=${visibleDup}`,
  );

  const legacyPair: Parameters<typeof collapseDecisionResolvedPairs>[0] = [
    {
      id: 'a',
      day,
      timestampOrder: 1,
      type: 'decision_applied',
      title: 'T',
      text: 'Karar uygulandı',
      tone: 'info',
      relatedEventId: 'ev-legacy',
    },
    {
      id: 'b',
      day,
      timestampOrder: 2,
      type: 'event_resolved',
      title: 'T',
      text: 'Saha baskısı azaldı',
      tone: 'positive',
      relatedEventId: 'ev-legacy',
    },
  ];
  const collapsed = collapseDecisionResolvedPairs(legacyPair);
  record(
    checks,
    collapsed.length === 1 && collapsed[0]?.type === 'decision_resolved',
    'collapse_legacy_pair',
    String(collapsed.length),
  );

  const missingResultCombined = buildCombinedDecisionResolvedEntry({
    record: todayRecord,
    result: null,
    timestampOrder: 1,
  });
  record(
    checks,
    missingResultCombined.text.trim().length > 0 && missingResultCombined.tone === 'info',
    'combined_missing_result_safe',
    missingResultCombined.tone,
  );

  const carryLine = 'Dünden kalan sinyal';
  const butterflyLine = 'Karar yankısı takipte';
  const overlapRaw = buildLiveFlowEntries({
    currentDay: day,
    activeEvents: [active],
    decisionHistory: [todayRecord],
    carryOverLine: carryLine,
    butterflyLine,
    isDay1Tutorial: false,
  });
  const overlapVisible = selectHubVisibleFlowEntries(overlapRaw);
  const rawHasCarry = overlapRaw.some((e) => e.type === 'carry_over_signal');
  const rawHasButterfly = overlapRaw.some((e) => e.type === 'butterfly_echo');
  record(
    checks,
    rawHasCarry &&
      rawHasButterfly &&
      countVisibleEventDuplicates(overlapVisible) === 0,
    'carry_butterfly_intentional_overlap',
    `raw=${rawHasCarry}/${rawHasButterfly} visibleDup=${countVisibleEventDuplicates(overlapVisible)}`,
  );

  const day1Slice = baseSlice({
    gameState: { ...createDay1Seed().gameState, city: { ...createDay1Seed().gameState.city, day: 1 } },
    isDay1Tutorial: true,
  });
  const day1Flow = formatHubTodayFlowLines(
    buildLiveFlowEntries({
      currentDay: 1,
      activeEvents: day1Slice.gameState.events,
      decisionHistory: [],
      isDay1Tutorial: true,
    }),
  );
  record(checks, day1Flow.length > 0, 'day1_safe', String(day1Flow.length));

  const slice = baseSlice({
    gameState: {
      ...createDay1Seed().gameState,
      city: { ...createDay1Seed().gameState.city, day },
      events: [],
      solvedEvents: [{ id: 'ev-resolved', title: 'T', xpEarned: 1 }],
      pilot: createDefaultPilotState(),
    },
    eventPool: [resolvedEvent],
    decisionHistory: [todayRecord],
  });
  const primary = selectHubPrimaryEventPresentation(slice);
  record(checks, primary?.lifecycle.status === 'resolved_today', 'hub_primary_resolved', primary?.lifecycle.status ?? 'none');

  const reportLines = buildCarryOverReportLines([], { hideOverlapWhenButterflyReport: true });
  record(checks, Array.isArray(reportLines), 'report_filter', 'ok');

  const missing = buildLiveFlowEntries({
    currentDay: 2,
    activeEvents: [],
    decisionHistory: [],
  });
  record(checks, missing.length > 0, 'missing_fallback', String(missing.length));

  const resolvedSummary = buildEventLifecycleMeta(
    resolvedEvent,
    ctxResolved,
    [todayRecord],
  );
  record(checks, Boolean(resolvedSummary.summaryText), 'resolved_summary', resolvedSummary.summaryText ?? 'none');

  const emptyCtx = buildEventLifecycleContext({
    currentDay: day,
    decisionHistory: [],
    solvedEventIds: [],
  });
  record(
    checks,
    getEventLifecycleStatusForEvent(resolvedEvent, emptyCtx, []) === 'active',
    'unresolved_without_record',
    'active',
  );

  const failCount = checks.filter((c) => c.severity === 'FAIL').length;
  const warnCount = checks.filter((c) => c.severity === 'WARN').length;
  return {
    ok: failCount === 0,
    failCount,
    warnCount,
    checks: checks.map((c) => `[${c.severity}] ${c.name}: ${c.detail}`),
  };
}
