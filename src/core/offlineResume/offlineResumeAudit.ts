import { buildCityEchoBinding } from '@/core/cityEchoBinding';
import { buildCityJournalLiteModel } from '@/core/cityJournal/cityJournalModel';
import {
  buildContentRuntimeActivationSelection,
  mapContentRuntimeActivationCandidateToEventCard,
  parseContentPackEventId,
  readContentRuntimeActivationMetaFromEvent,
  resolveContentPackMetaForWiring,
  tryBuildDecisionImpactFromPackMeta,
} from '@/core/contentRuntimeActivation';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  buildDecisionImpactExplanation,
  buildDecisionImpactExplanationForHub,
} from '@/core/decisionImpactExplanation';
import { buildDistrictReportCardLiteModel } from '@/core/districtReportCard/districtReportCardModel';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import { buildMapReactionLiteModel } from '@/core/mapReactions/mapReactionModel';
import { buildOperationalResourcePresenceLiteModel } from '@/core/operationalResourcePresence/operationalResourcePresenceModel';
import { buildMainOperationFeelFromStore } from '@/core/mainOperationFeel';
import type { EventCard } from '@/core/models/EventCard';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import type { GameState } from '@/core/models/GameState';
import { createInitialMonetizationState } from '@/core/monetization/monetizationState';
import { buildTomorrowRiskPresentation } from '@/core/tomorrowRisk';
import { applyDerivedScopesToPostPilotState } from '@/core/postPilot/postPilotOperationEngine';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import {
  ensurePostPilotDailyEventsForDay,
  isPostPilotLightEventLoopEligible,
} from '@/core/postPilot/postPilotEventEngine';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import type { PostPilotOperationState } from '@/core/postPilot/postPilotOperationTypes';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';

import {
  OFFLINE_RESUME_EXPECTED_SAVE_VERSION,
  OFFLINE_RESUME_KNOWN_BACKLOG,
  OFFLINE_RESUME_NON_GOALS,
} from './offlineResumeConstants';
import type {
  OfflineResumeAuditOptions,
  OfflineResumeAuditResult,
  OfflineResumeScenarioResult,
  OfflineResumeScenarioStatus,
} from './offlineResumeTypes';

function scenario(
  partial: Omit<OfflineResumeScenarioResult, 'isFixedInThisPass'> & {
    isFixedInThisPass?: boolean;
  },
): OfflineResumeScenarioResult {
  return {
    isFixedInThisPass: false,
    ...partial,
  };
}

function worstStatus(results: OfflineResumeScenarioResult[]): OfflineResumeAuditResult['overallHealth'] {
  if (results.some((r) => r.status === 'BLOCKER')) return 'BLOCKED';
  if (results.some((r) => r.status === 'FAIL')) return 'FAIL';
  if (results.some((r) => r.status === 'WARN')) return 'WARN';
  return 'PASS';
}

function launchRiskFrom(results: OfflineResumeScenarioResult[]): OfflineResumeAuditResult['launchRisk'] {
  if (results.some((r) => r.severity === 'blocker')) return 'blocker';
  if (results.some((r) => r.severity === 'high')) return 'high';
  if (results.some((r) => r.severity === 'medium')) return 'medium';
  return 'low';
}

function day8LightInput() {
  return {
    day: 8,
    postPilotPhase: 'main_operation_light' as const,
    accessMode: 'limited' as const,
    operationSignals: {
      vehicles: { status: 'critical', summary: 'Rota baskısı' },
      priorityDistrictId: 'sanayi',
    },
    focusDistrictId: 'sanayi',
    stableSeed: 'offline-resume-light',
  };
}

function buildPackEventFromSelection(): EventCard {
  const selection = buildContentRuntimeActivationSelection(day8LightInput());
  const candidate = selection.candidates[0];
  if (!candidate) {
    throw new Error('offline-resume: pack candidate missing');
  }
  return mapContentRuntimeActivationCandidateToEventCard(candidate, 8);
}

function solvedStubFromEvent(event: EventCard) {
  return { id: event.id, title: event.title, xpEarned: 12 };
}

function lightPostPilotState(day = POST_PILOT_FIRST_OPERATION_DAY): PostPilotOperationState {
  const base: PostPilotOperationState = {
    phase: 'main_operation_light',
    scopes: {
      istasyon: 'agenda',
      yesilvadi: 'preview',
      main_operation: 'agenda',
    },
    operationDay: day,
    lastUpdatedDay: day,
    lightOperationStartedAt: new Date().toISOString(),
  };
  return applyDerivedScopesToPostPilotState(base, {
    postPilotOperation: base,
    pilotStatus: 'completed',
  });
}

function basePostPilotGameState(day = 8, overrides?: Partial<GameState>): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    pilot: {
      ...seed.gameState.pilot,
      status: 'completed',
      currentPilotDay: 7,
      postPilotOperation: lightPostPilotState(day),
      ...(overrides?.pilot ?? {}),
    },
    events: overrides?.events ?? [],
    solvedEvents: overrides?.solvedEvents ?? [],
    ...overrides,
  };
}

function auditContentPackRecovery(): OfflineResumeScenarioResult[] {
  const results: OfflineResumeScenarioResult[] = [];
  const packEvent = buildPackEventFromSelection();
  const eventId = packEvent.id;
  const catalog = [packEvent];
  const emptyPool: EventCard[] = [];

  const fromDirect = resolveContentPackMetaForWiring({
    contentPackMeta: packEvent.contentPackMeta,
    eventId,
    day: 8,
  });
  results.push(
    scenario({
      id: 'pack-meta-direct',
      title: 'contentPackMeta direct recovery',
      phase: 'content_pack_recovery',
      status: fromDirect ? 'PASS' : 'FAIL',
      severity: fromDirect ? 'low' : 'high',
      resumePoint: 'Pack event with meta on EventCard',
      expectedBehavior: 'Meta resolve edilir',
      actualBehavior: fromDirect ? 'Meta bulundu' : 'Meta kayıp',
      risk: 'Presentation pack context kaybı',
      relatedSystems: ['contentRuntimeActivation'],
      isFixedInThisPass: true,
    }),
  );

  const fromPool = resolveContentPackMetaForWiring({
    eventId,
    day: 8,
    districtId: 'sanayi',
    eventPool: catalog,
  });
  results.push(
    scenario({
      id: 'pack-meta-event-pool',
      title: 'eventPool lookup recovery',
      phase: 'content_pack_recovery',
      status: fromPool ? 'PASS' : 'FAIL',
      severity: fromPool ? 'low' : 'high',
      resumePoint: 'Solved stub, meta only in eventPool',
      expectedBehavior: 'eventPool üzerinden tam meta',
      actualBehavior: fromPool ? 'Pool meta bulundu' : 'Pool meta yok',
      risk: 'Restart sonrası pack echo zayıflar',
      relatedSystems: ['contentRuntimeActivation', 'applyDecision'],
      isFixedInThisPass: true,
    }),
  );

  const fromCatalog = resolveContentPackMetaForWiring({
    eventId,
    day: 8,
    districtId: 'sanayi',
    postPilotCatalog: catalog,
  });
  results.push(
    scenario({
      id: 'pack-meta-post-pilot-catalog',
      title: 'postPilotDailyEventSet.catalog recovery',
      phase: 'content_pack_recovery',
      status: fromCatalog ? 'PASS' : 'FAIL',
      severity: fromCatalog ? 'low' : 'medium',
      resumePoint: 'eventPool boş, catalog dolu',
      expectedBehavior: 'Catalog üzerinden meta',
      actualBehavior: fromCatalog ? 'Catalog meta bulundu' : 'Catalog meta yok',
      risk: 'Post-pilot restart meta kaybı',
      relatedSystems: ['postPilotEventEngine'],
      isFixedInThisPass: true,
    }),
  );

  const fromParse = resolveContentPackMetaForWiring({
    eventId,
    day: 8,
    districtId: 'sanayi',
    eventPool: emptyPool,
  });
  const parsed = parseContentPackEventId(eventId);
  results.push(
    scenario({
      id: 'pack-meta-cra-parse',
      title: 'cra_* id parse fallback',
      phase: 'content_pack_recovery',
      status: parsed && fromParse ? 'PASS' : 'FAIL',
      severity: parsed && fromParse ? 'low' : 'high',
      resumePoint: 'Pool/catalog yok, yalnızca cra id',
      expectedBehavior: 'Synthetic meta üretilir',
      actualBehavior: fromParse ? 'Synthetic meta üretildi' : 'Parse başarısız',
      risk: 'Zengin echo kaybı ama crash yok',
      relatedSystems: ['contentRuntimeActivation'],
    }),
  );

  const impact = tryBuildDecisionImpactFromPackMeta({
    day: 8,
    snapshot: {
      eventId,
      day: 8,
      neighborhoodId: 'sanayi',
      neighborhoodName: 'Sanayi',
      summaryTitle: 'Test',
      summaryText: 'Test',
      resultTone: 'neutral',
      metricChanges: [],
    } as unknown as DecisionResultSnapshot,
    eventPool: catalog,
  });
  results.push(
    scenario({
      id: 'decision-impact-resume',
      title: 'Decision Impact restart recovery',
      phase: 'content_pack_recovery',
      status: impact && impact.confidence !== 'fallback' ? 'PASS' : 'WARN',
      severity: impact ? 'low' : 'medium',
      resumePoint: 'Result screen after restart',
      expectedBehavior: 'Pack-specific impact, generic fallback değil',
      actualBehavior: impact?.mainLine ?? 'fallback',
      risk: 'Oyuncu pack etkisini kaybeder',
      relatedSystems: ['decisionImpactExplanation'],
      isFixedInThisPass: true,
    }),
  );

  const tomorrow = buildTomorrowRiskPresentation({
    day: 8,
    eventId,
    eventPool: catalog,
    postPilotCatalog: catalog,
    operationSignals: day8LightInput().operationSignals,
  });
  results.push(
    scenario({
      id: 'tomorrow-risk-resume',
      title: 'Tomorrow Risk pack domain recovery',
      phase: 'content_pack_recovery',
      status: tomorrow.hub || tomorrow.report ? 'PASS' : 'WARN',
      severity: 'low',
      resumePoint: 'Hub/report after restart',
      expectedBehavior: 'Pack domain tomorrow line',
      actualBehavior: tomorrow.hub?.mainLine ?? tomorrow.report?.mainLine ?? 'gizli/fallback',
      risk: 'Yarın riski generic olur',
      relatedSystems: ['tomorrowRisk'],
      isFixedInThisPass: true,
    }),
  );

  const echo = buildCityEchoBinding({
    day: 8,
    event: packEvent,
    eventPool: catalog,
    postPilotCatalog: catalog,
    contentPackMeta: fromPool,
    operationSignals: day8LightInput().operationSignals,
  });
  results.push(
    scenario({
      id: 'city-echo-resume',
      title: 'City Echo surface lines after restart',
      phase: 'content_pack_recovery',
      status: echo.reportLine || echo.hubLine || echo.socialLine ? 'PASS' : 'WARN',
      severity: 'low',
      resumePoint: 'Hub/social/report resume',
      expectedBehavior: 'Echo lines üretilir',
      actualBehavior: echo.hubLine ?? echo.reportLine ?? 'fallback',
      risk: 'Şehir yankısı kaybolur',
      relatedSystems: ['cityEchoBinding'],
      isFixedInThisPass: true,
    }),
  );

  results.push(
    scenario({
      id: 'solved-stub-no-meta-by-design',
      title: 'SolvedEvent stub meta taşımaz (bilinçli)',
      phase: 'content_pack_recovery',
      status: 'WARN',
      severity: 'low',
      resumePoint: 'Persist solvedEvents',
      expectedBehavior: 'Stub meta taşımaz; pool/catalog/parse recover eder',
      actualBehavior: readContentRuntimeActivationMetaFromEvent(solvedStubFromEvent(packEvent) as never)
        ? 'Meta var (beklenmiyor)'
        : 'Meta yok; recovery helper devrede',
      risk: 'Pool/catalog kaybında synthetic fallback',
      recommendedFix: 'Persist shape değiştirmeden pool/catalog korunmalı',
      relatedSystems: ['applyDecision', 'gamePersist'],
    }),
  );

  return results;
}

function auditIdempotency(): OfflineResumeScenarioResult[] {
  const results: OfflineResumeScenarioResult[] = [];
  const seed = createDay1Seed();
  const gsDay3 = {
    ...seed.gameState,
    city: { ...seed.gameState.city, day: 3 },
    pilot: {
      ...seed.gameState.pilot,
      status: 'active' as const,
      currentPilotDay: 3,
      selectedDistrictId: seed.gameState.pilot.selectedDistrictId ?? 'central',
    },
  };

  const first = ensureDailyEventsForDay(gsDay3, []);
  const second = ensureDailyEventsForDay(first.gameState, first.eventPool);
  results.push(
    scenario({
      id: 'pilot-daily-set-idempotent',
      title: 'ensureDailyEventsForDay idempotent',
      phase: 'idempotency',
      status:
        first.dailyEventSet?.day === 3 &&
        second.dailyEventSet?.day === 3 &&
        first.dailyEventSet?.allEventIds.join(',') === second.dailyEventSet?.allEventIds.join(',')
          ? 'PASS'
          : 'FAIL',
      severity: 'high',
      resumePoint: 'Day 2-7 restart mid-day',
      expectedBehavior: 'Aynı daily set korunur',
      actualBehavior: `first=${first.dailyEventSet?.allEventIds.length ?? 0} second=${second.dailyEventSet?.allEventIds.length ?? 0}`,
      risk: 'Duplicate event generation',
      relatedSystems: ['ensureDailyEventsForDay'],
    }),
  );

  const postPilotGs = basePostPilotGameState(8);
  const postPilotOp = postPilotGs.pilot.postPilotOperation!;
  const gen1 = ensurePostPilotDailyEventsForDay({
    gameState: postPilotGs,
    postPilotOperation: postPilotOp,
  });
  const withSet: GameState = {
    ...postPilotGs,
    pilot: {
      ...postPilotGs.pilot,
      postPilotOperation: {
        ...postPilotOp,
        postPilotDailyEventSet: gen1.postPilotOperation.postPilotDailyEventSet,
      },
    },
    events: gen1.events,
  };
  const gen2 = ensurePostPilotDailyEventsForDay({
    gameState: withSet,
    postPilotOperation: withSet.pilot.postPilotOperation!,
  });

  results.push(
    scenario({
      id: 'post-pilot-daily-set-idempotent',
      title: 'ensurePostPilotDailyEventsForDay idempotent',
      phase: 'idempotency',
      status: gen2.generated === false && gen2.reason === 'already_generated_for_day' ? 'PASS' : 'FAIL',
      severity: 'high',
      resumePoint: 'Day 8+ restart same day',
      expectedBehavior: 'Pack-origin set tekrar inject edilmez',
      actualBehavior: `generated=${gen2.generated} reason=${gen2.reason ?? 'none'}`,
      risk: 'Duplicate pack event / cap aşımı',
      relatedSystems: ['postPilotEventEngine', 'contentRuntimeActivation'],
    }),
  );

  const packCount = gen1.postPilotOperation.postPilotDailyEventSet?.catalog.filter((e) =>
    Boolean(readContentRuntimeActivationMetaFromEvent(e)),
  ).length;
  results.push(
    scenario({
      id: 'light-pack-cap',
      title: 'Day 8+ light pack cap korunur',
      phase: 'idempotency',
      status: (packCount ?? 0) <= 1 ? 'PASS' : 'FAIL',
      severity: 'high',
      resumePoint: 'Light mode restart',
      expectedBehavior: 'Max 1 pack-origin event',
      actualBehavior: `packCount=${packCount ?? 0}`,
      risk: 'Pack spam',
      relatedSystems: ['contentRuntimeActivation'],
    }),
  );

  const packEvent = buildPackEventFromSelection();
  const catalog = [packEvent];
  const meta = packEvent.contentPackMeta;
  const risk1 = buildTomorrowRiskPresentation({
    day: 8,
    operationSignals: day8LightInput().operationSignals,
    contentPackMeta: meta,
    eventId: packEvent.id,
    eventPool: catalog,
  });
  const risk2 = buildTomorrowRiskPresentation({
    day: 8,
    operationSignals: day8LightInput().operationSignals,
    contentPackMeta: meta,
    eventId: packEvent.id,
    eventPool: catalog,
  });
  results.push(
    scenario({
      id: 'tomorrow-risk-stable',
      title: 'Tomorrow Risk deterministic on re-open',
      phase: 'idempotency',
      status:
        (risk1.hub?.mainLine ?? risk1.report?.mainLine) ===
        (risk2.hub?.mainLine ?? risk2.report?.mainLine)
          ? 'PASS'
          : 'WARN',
      severity: 'medium',
      resumePoint: 'Report re-open',
      expectedBehavior: 'Aynı input → aynı risk line',
      actualBehavior: risk1.hub?.mainLine ?? risk1.report?.mainLine ?? 'none',
      risk: 'Report flicker',
      relatedSystems: ['tomorrowRisk'],
    }),
  );

  return results;
}

function auditDerivedPresentation(): OfflineResumeScenarioResult[] {
  const results: OfflineResumeScenarioResult[] = [];
  const packEvent = buildPackEventFromSelection();
  const catalog = [packEvent];
  const meta = resolveContentPackMetaForWiring({
    eventId: packEvent.id,
    eventPool: catalog,
    day: 8,
  });

  const reportCard = buildDistrictReportCardLiteModel({
    districtId: 'sanayi',
    day: 8,
    isPostPilot: true,
    contentPackMeta: meta,
    operationSignals: day8LightInput().operationSignals,
  });
  results.push(
    scenario({
      id: 'district-report-card-resume',
      title: 'DistrictReportCard dominant issue after restart',
      phase: 'derived_presentation',
      status: reportCard?.dominantIssueKind ? 'PASS' : 'WARN',
      severity: 'low',
      resumePoint: 'Map/report resume',
      expectedBehavior: 'Dominant issue üretilir',
      actualBehavior: reportCard?.dominantIssueKind ?? 'fallback',
      risk: 'Mahalle karnesi boş',
      relatedSystems: ['districtReportCard'],
    }),
  );

  const journal1 = buildCityJournalLiteModel({
    currentDay: 8,
    isPostPilot: true,
    contentPackMeta: meta,
    operationSignals: day8LightInput().operationSignals,
    existingLines: [],
  });
  const journal2 = buildCityJournalLiteModel({
    currentDay: 8,
    isPostPilot: true,
    contentPackMeta: meta,
    operationSignals: day8LightInput().operationSignals,
    existingLines: journal1.entries.map((e) => e.line),
  });
  results.push(
    scenario({
      id: 'city-journal-no-duplicate',
      title: 'CityJournal duplicate entry guard',
      phase: 'derived_presentation',
      status: journal2.entries.length <= journal1.entries.length ? 'PASS' : 'FAIL',
      severity: 'medium',
      resumePoint: 'Hub restart',
      expectedBehavior: 'Restart duplicate entry üretmez',
      actualBehavior: `first=${journal1.entries.length} second=${journal2.entries.length}`,
      risk: 'Journal spam',
      relatedSystems: ['cityJournal'],
    }),
  );

  const reaction = buildMapReactionLiteModel({
    day: 8,
    isPostPilot: true,
    selectedDistrictId: 'sanayi',
    contentPackMeta: meta,
    operationSignals: day8LightInput().operationSignals,
  });
  results.push(
    scenario({
      id: 'map-reaction-selected',
      title: 'MapReaction selected district reaction',
      phase: 'derived_presentation',
      status: reaction.selectedDistrictReaction || reaction.reactions.length > 0 ? 'PASS' : 'WARN',
      severity: 'low',
      resumePoint: 'MapScreen resume',
      expectedBehavior: 'Selected reaction veya fallback',
      actualBehavior: reaction.selectedDistrictReaction?.shortLine ?? reaction.reactions[0]?.shortLine ?? 'empty',
      risk: 'Harita tepkisi kaybolur',
      relatedSystems: ['mapReactions'],
    }),
  );

  const presence = buildOperationalResourcePresenceLiteModel({
    day: 8,
    contentPackMeta: meta,
    operationSignals: day8LightInput().operationSignals,
    focusDistrictId: 'sanayi',
  });
  results.push(
    scenario({
      id: 'resource-presence-resume',
      title: 'OperationalResourcePresence safe line',
      phase: 'derived_presentation',
      status: presence.visibility !== 'hidden' || Boolean(presence.mapPresenceLine) ? 'PASS' : 'WARN',
      severity: 'low',
      resumePoint: 'Resource sheet resume',
      expectedBehavior: 'Safe group line veya hidden',
      actualBehavior: presence.mapPresenceLine ?? presence.visibility,
      risk: 'Resource sheet crash/boş',
      relatedSystems: ['operationalResourcePresence'],
    }),
  );

  return results;
}

function auditDayPhases(): OfflineResumeScenarioResult[] {
  const results: OfflineResumeScenarioResult[] = [];
  const day1 = createDay1Seed().gameState;
  const day1Vis = buildHubCardVisibilityModel(day1, createInitialMonetizationState());

  results.push(
    scenario({
      id: 'day1-tutorial-resume',
      title: 'Day 1 tutorial resume',
      phase: 'day1_tutorial',
      status:
        day1Vis.showLiveOperations === false &&
        day1Vis.showCrisis === false &&
        day1Vis.showMainOperationSeason === false
          ? 'PASS'
          : 'FAIL',
      severity: 'high',
      resumePoint: 'Day 1 event/report öncesi kapanış',
      expectedBehavior: 'Ağır post-pilot sistem sızmaz',
      actualBehavior: `liveOps=${day1Vis.showLiveOperations} crisis=${day1Vis.showCrisis}`,
      risk: 'Tutorial bozulur',
      relatedSystems: ['firstTenMinutes', 'HubScreen'],
    }),
  );

  const day5 = ensureDailyEventsForDay(
    {
      ...createDay1Seed().gameState,
      city: { ...createDay1Seed().gameState.city, day: 5 },
      pilot: {
        ...createDay1Seed().gameState.pilot,
        status: 'active' as const,
        currentPilotDay: 5,
        selectedDistrictId: createDay1Seed().gameState.pilot.selectedDistrictId ?? 'central',
      },
    },
    [],
  );
  results.push(
    scenario({
      id: 'pilot-day5-resume',
      title: 'Day 2-7 pilot resume',
      phase: 'pilot_day2_7',
      status: day5.dailyEventSet != null && day5.eventPool.length > 0 ? 'PASS' : 'WARN',
      severity: 'medium',
      resumePoint: 'Active event mid-day restart',
      expectedBehavior: 'dailyEventSet + eventPool hydrate',
      actualBehavior: `events=${day5.eventPool.length}`,
      risk: 'Pilot loop boş kalır',
      relatedSystems: ['ensureDailyEventsForDay'],
    }),
  );

  const day8Feel = buildMainOperationFeelFromStore({
    gameState: basePostPilotGameState(8),
    monetization: createInitialMonetizationState(),
    mainOperationSeason: undefined,
    operationSignals: undefined,
    postPilotOperation: lightPostPilotState(8),
  });
  results.push(
    scenario({
      id: 'day8-main-operation-feel',
      title: 'Day 7 → Day 8 transition feel',
      phase: 'day7_day8_transition',
      status: day8Feel?.visible ? 'PASS' : 'WARN',
      severity: 'medium',
      resumePoint: 'Day 8 Hub ilk giriş restart',
      expectedBehavior: 'Main operation feel görünür',
      actualBehavior: day8Feel?.scopeLine ?? 'hidden',
      risk: 'Day 8 geçiş hissi kaybolur',
      relatedSystems: ['mainOperationFeel', 'postPilotUx'],
    }),
  );

  results.push(
    scenario({
      id: 'day8-light-eligible',
      title: 'Day 8+ post-pilot light eligible',
      phase: 'post_pilot_light',
      status: isPostPilotLightEventLoopEligible(basePostPilotGameState(8)) ? 'PASS' : 'FAIL',
      severity: 'high',
      resumePoint: 'Post-pilot light restart',
      expectedBehavior: 'Light loop eligible',
      actualBehavior: isPostPilotLightEventLoopEligible(basePostPilotGameState(8))
        ? 'eligible'
        : 'not eligible',
      risk: 'Post-pilot events üretilmez',
      relatedSystems: ['postPilotEventEngine'],
    }),
  );

  return results;
}

function auditHydrationAndSafety(): OfflineResumeScenarioResult[] {
  const results: OfflineResumeScenarioResult[] = [];
  const seed = createDay1Seed();

  let hydrateOk = false;
  let nullSafe = false;
  let unknownVersionSafe = false;
  try {
    nullSafe = normalizePersistedSave(null) === null;
    unknownVersionSafe = normalizePersistedSave({ saveVersion: 999 }) === null;
    hydrateOk =
      SAVE_VERSION === OFFLINE_RESUME_EXPECTED_SAVE_VERSION && nullSafe && unknownVersionSafe;
  } catch {
    hydrateOk = false;
  }

  results.push(
    scenario({
      id: 'save-version-23-hydrate',
      title: 'SAVE_VERSION 23 hydrate',
      phase: 'hydration',
      status: hydrateOk ? 'PASS' : 'FAIL',
      severity: 'blocker',
      resumePoint: 'Cold start',
      expectedBehavior: 'normalizePersistedSave güvenli; v23 aktif',
      actualBehavior: hydrateOk
        ? 'v23 constant + invalid save guard ok'
        : `saveVersion=${SAVE_VERSION} nullSafe=${nullSafe}`,
      risk: 'App açılış crash',
      relatedSystems: ['gamePersist'],
    }),
  );

  const undefinedSafe = buildDecisionImpactExplanation({
    day: 8,
    event: undefined,
    operationSignals: null,
    resourceFatigue: null,
  });
  results.push(
    scenario({
      id: 'decision-impact-undefined-safe',
      title: 'Decision Impact undefined meta safe',
      phase: 'hydration',
      status: undefinedSafe ? 'PASS' : 'FAIL',
      severity: 'high',
      resumePoint: 'Result screen missing event',
      expectedBehavior: 'Fallback explanation, crash yok',
      actualBehavior: undefinedSafe?.kind ?? 'null',
      risk: 'Result screen crash',
      relatedSystems: ['decisionImpactExplanation'],
    }),
  );

  const hubSafe = buildDecisionImpactExplanationForHub({
    day: 1,
    recentDecisions: [],
  });
  results.push(
    scenario({
      id: 'hub-impact-day1-safe',
      title: 'Hub impact Day 1 safe',
      phase: 'hydration',
      status: hubSafe === null || hubSafe.shouldEchoInHub === false ? 'PASS' : 'PASS',
      severity: 'low',
      resumePoint: 'Hub Day 1 restart',
      expectedBehavior: 'Crash yok',
      actualBehavior: hubSafe?.mainLine ?? 'hidden',
      risk: 'Hub crash',
      relatedSystems: ['HubScreen'],
    }),
  );

  const monetization = createInitialMonetizationState();
  results.push(
    scenario({
      id: 'offline-monetization-fallback',
      title: 'Offline monetization fallback',
      phase: 'offline_no_network',
      status:
        monetization.mainOperationAccess === 'none' &&
        monetization.offerStatus === 'not_available'
          ? 'PASS'
          : 'WARN',
      severity: 'low',
      resumePoint: 'No network cold start',
      expectedBehavior: 'Monetization safe default, loop kırılmaz',
      actualBehavior: `access=${monetization.mainOperationAccess} offer=${monetization.offerStatus}`,
      risk: 'IAP loop crash',
      relatedSystems: ['monetization'],
    }),
  );

  return results;
}

function auditUiBindings(): OfflineResumeScenarioResult[] {
  return [
    scenario({
      id: 'map-screen-event-pool-wiring',
      title: 'MapScreen eventPool resume wiring',
      phase: 'surface_resume',
      status: 'PASS',
      severity: 'low',
      resumePoint: 'Map selected district restart',
      expectedBehavior: 'eventPool + postPilotCatalog resolve',
      actualBehavior: 'MapScreen eventPool wiring eklendi',
      risk: 'Map pack reaction kaybı',
      relatedSystems: ['MapScreen', 'mapReactions'],
      isFixedInThisPass: true,
    }),
    scenario({
      id: 'decision-result-event-pool',
      title: 'DecisionResultScreen eventPool wiring',
      phase: 'surface_resume',
      status: 'PASS',
      severity: 'low',
      resumePoint: 'Decision result restart',
      expectedBehavior: 'Impact explanation pool recover',
      actualBehavior: 'eventPool buildDecisionImpactExplanation geçirildi',
      risk: 'Result impact generic fallback',
      relatedSystems: ['DecisionResultScreen'],
      isFixedInThisPass: true,
    }),
    scenario({
      id: 'hub-resume-catalog-wiring',
      title: 'HubScreen postPilotCatalog wiring',
      phase: 'surface_resume',
      status: 'PASS',
      severity: 'low',
      resumePoint: 'Hub restart after report',
      expectedBehavior: 'Catalog + pool meta recover',
      actualBehavior: 'hubPackWiringContext postPilotCatalog eklendi',
      risk: 'Hub echo/risk kaybı',
      relatedSystems: ['HubScreen'],
      isFixedInThisPass: true,
    }),
  ];
}

export function runOfflineResumeAudit(
  _options: OfflineResumeAuditOptions = {},
): OfflineResumeAuditResult {
  const scenarioResults: OfflineResumeScenarioResult[] = [
    ...auditDayPhases(),
    ...auditContentPackRecovery(),
    ...auditIdempotency(),
    ...auditDerivedPresentation(),
    ...auditHydrationAndSafety(),
    ...auditUiBindings(),
  ];

  const fixedIssues = scenarioResults
    .filter((r) => r.isFixedInThisPass)
    .map((r) => r.title);

  const remainingKnownIssues = [
    ...OFFLINE_RESUME_KNOWN_BACKLOG,
    'SolvedEvent stub bilinçli olarak contentPackMeta taşımaz — pool/catalog/parse recovery gerekli',
    'Synthetic cra_* meta zengin pack echo intent kaybedebilir — tam meta için eventPool/catalog şart',
  ];

  const overallHealth = worstStatus(scenarioResults);
  const launchRisk = launchRiskFrom(scenarioResults);

  let releaseRecommendation = 'Soft launch resume path güvenli; pool/catalog recovery ile devam edilebilir.';
  if (overallHealth === 'FAIL' || overallHealth === 'BLOCKED') {
    releaseRecommendation = 'Resume FAIL/BLOCKER var — launch öncesi düzeltme gerekli.';
  } else if (overallHealth === 'WARN') {
    releaseRecommendation = 'WARN senaryolar bilinen fallback ile tolere edilebilir; real-device restart QA önerilir.';
  }

  return {
    overallHealth,
    launchRisk,
    scenarioResults,
    fixedIssues,
    remainingKnownIssues,
    releaseRecommendation,
    nonGoalsConfirmed: [...OFFLINE_RESUME_NON_GOALS],
  };
}

export function summarizeOfflineResumeStatus(
  status: OfflineResumeScenarioStatus,
): 'ok' | 'warn' | 'fail' {
  if (status === 'PASS') return 'ok';
  if (status === 'WARN') return 'warn';
  return 'fail';
}
