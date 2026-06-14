import { pilotEvents } from '@/core/content/pilotEvents';
import {
  buildEventGameplayVarietyProfile,
  buildProfilesForEventIds,
  resolveEventGameplayPressureDomain,
} from '@/core/eventVariety/eventGameplayVarietyModel';
import {
  EVENT_GAMEPLAY_DECISION_SHAPES,
  EVENT_GAMEPLAY_PRESSURE_DOMAINS,
  EVENT_GAMEPLAY_PRESSURE_KINDS,
  EVENT_GAMEPLAY_STRATEGY_BIASES,
  type EventGameplayRepetitionRisk,
  type EventGameplayVarietyProfile,
} from '@/core/eventVariety/eventGameplayVarietyTypes';
import type { EventCard } from '@/core/models/EventCard';
import { buildPostPilotLightGameState } from '@/core/postPilot/postPilotLoopAudit';
import { ensurePostPilotDailyEventsForDay } from '@/core/postPilot/postPilotEventEngine';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import {
  auditEventDispatchPhasePresentation,
  buildEventDispatchPhasePresentation,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import {
  auditEventFieldPhasePresentation,
  buildEventFieldPhasePresentation,
} from '@/features/events/utils/eventFieldPhasePresentation';
import {
  auditEventInspectPhasePresentation,
  buildEventInspectFindings,
  buildEventInspectPhasePresentation,
} from '@/features/events/utils/eventInspectPhasePresentation';
import {
  auditEventPlanPhasePresentation,
  buildEventPlanPhasePresentation,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { verifyOperationDispatchMotionScenario } from '@/features/events/verifyOperationDispatchMotionScenario';
import { verifyOperationFieldLiveScenario } from '@/features/events/verifyOperationFieldLiveScenario';
import { verifyOperationFlowQaScenario } from '@/features/events/verifyOperationFlowQaScenario';
import { verifyOperationInspectUiScenario } from '@/features/events/verifyOperationInspectUiScenario';
import { verifyOperationPlanUiScenario } from '@/features/events/verifyOperationPlanUiScenario';

export type VerifyEventGameplayVarietyOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
  day8PlusSamples: Day8PlusGameplaySample[];
};

export type Day8PlusGameplaySample = {
  scenario: string;
  event1Pressure: string;
  event2Pressure: string;
  sameShapeRisk: EventGameplayRepetitionRisk;
  note: string;
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleLowDataEvent(): EventCard {
  return {
    id: 'evt_variety_low_data',
    title: 'Genel operasyon',
    category: 'general',
    riskLevel: 'low',
    district: '',
    description: '',
    contextTag: 'test',
    urgencyHours: 8,
    day: 3,
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    decisions: [
      {
        id: 'd_basic',
        title: 'Standart',
        description: 'Temel',
        style: 'balanced',
        effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 },
      },
    ],
  };
}

function auditProfile(profile: EventGameplayVarietyProfile, checks: Check[]): void {
  assert(
    checks,
    EVENT_GAMEPLAY_PRESSURE_DOMAINS.includes(profile.domain),
    `domain enum ${profile.eventId}`,
    profile.domain,
  );
  assert(
    checks,
    EVENT_GAMEPLAY_PRESSURE_KINDS.includes(profile.primaryPressure),
    `primaryPressure enum ${profile.eventId}`,
    profile.primaryPressure,
  );
  assert(
    checks,
    profile.secondaryPressures.length <= 3,
    `secondaryPressures max 3 ${profile.eventId}`,
    String(profile.secondaryPressures.length),
  );
  for (const kind of profile.secondaryPressures) {
    assert(
      checks,
      EVENT_GAMEPLAY_PRESSURE_KINDS.includes(kind),
      `secondaryPressure enum ${profile.eventId}`,
      kind,
    );
  }
  assert(
    checks,
    EVENT_GAMEPLAY_DECISION_SHAPES.includes(profile.decisionShape),
    `decisionShape enum ${profile.eventId}`,
    profile.decisionShape,
  );
  assert(
    checks,
    EVENT_GAMEPLAY_STRATEGY_BIASES.includes(profile.strategyBias),
    `strategyBias enum ${profile.eventId}`,
    profile.strategyBias,
  );
  assert(
    checks,
    profile.playerFacingLine.trim().length > 0,
    `playerFacingLine non-empty ${profile.eventId}`,
  );
  assert(
    checks,
    profile.sourceIds.length === new Set(profile.sourceIds).size,
    `sourceIds unique ${profile.eventId}`,
  );
  assert(
    checks,
    profile.freshnessScore >= 0 && profile.freshnessScore <= 100,
    `freshnessScore clamp ${profile.eventId}`,
    String(profile.freshnessScore),
  );
  assert(
    checks,
    ['low', 'medium', 'high'].includes(profile.repetitionRisk),
    `repetitionRisk enum ${profile.eventId}`,
    profile.repetitionRisk,
  );

  if (profile.primaryPressure !== 'calm_standard') {
    const urgentFake =
      profile.playerFacingLine.toLowerCase().includes('acil kriz') ||
      profile.playerFacingLine.toLowerCase().includes('kritik alarm');
    assert(checks, !urgentFake, `no fake urgent ${profile.eventId}`);
  }
}

function collectDay8PlusSamples(): Day8PlusGameplaySample[] {
  const samples: Day8PlusGameplaySample[] = [];

  for (const day of [8, 9, 10]) {
    const gameState = buildPostPilotLightGameState(day);
    const postPilot = normalizePostPilotOperationState(gameState.pilot.postPilotOperation, {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    });
    const result = ensurePostPilotDailyEventsForDay({
      gameState,
      postPilotOperation: postPilot,
      day,
    });
    const events = result.events.slice(0, 2);
    if (events.length < 2) continue;

    const profiles = buildProfilesForEventIds(events, { day });
    const p1 = profiles[0]!;
    const p2 = profiles[1]!;
    const sameShape = p1.decisionShape === p2.decisionShape;
    let risk: EventGameplayRepetitionRisk = 'low';
    if (sameShape && p1.domain === p2.domain) risk = 'high';
    else if (sameShape) risk = 'medium';

    samples.push({
      scenario: `day_${day}_light_loop`,
      event1Pressure: `${p1.domain}/${p1.primaryPressure}/${p1.decisionShape}`,
      event2Pressure: `${p2.domain}/${p2.primaryPressure}/${p2.decisionShape}`,
      sameShapeRisk: risk,
      note:
        p1.domain !== p2.domain
          ? 'Farklı domain'
          : sameShape
            ? 'Aynı gün aynı decisionShape'
            : 'Aynı domain farklı pressure/shape',
    });
  }

  return samples;
}

export function verifyEventGameplayVarietyScenario(): VerifyEventGameplayVarietyOutcome {
  const checks: Check[] = [];
  const day8PlusSamples = collectDay8PlusSamples();

  const sampleEvents = [
    ...pilotEvents.slice(0, 12),
    sampleLowDataEvent(),
    pilotEvents.find((e) => e.category === 'waste' || e.eventType === 'waste') ?? pilotEvents[2]!,
    pilotEvents.find((e) => e.eventType === 'social_media') ?? pilotEvents[3]!,
  ].filter(Boolean) as EventCard[];

  const profiles = buildProfilesForEventIds(sampleEvents, { day: 3 });

  for (const profile of profiles) {
    auditProfile(profile, checks);
  }

  const lowDataProfile = buildEventGameplayVarietyProfile(sampleLowDataEvent());
  assert(
    checks,
    lowDataProfile.primaryPressure === 'calm_standard',
    'low-data calm_standard fallback',
    lowDataProfile.primaryPressure,
  );

  const day1Event = pilotEvents.find((e) => e.day === 1) ?? pilotEvents[0]!;
  const day1Profile = buildEventGameplayVarietyProfile(day1Event, {
    day: 1,
    isDay1LearningEvent: true,
  });
  assert(
    checks,
    day1Profile.primaryPressure === 'calm_standard',
    'day1 teaching safe pressure',
    day1Profile.primaryPressure,
  );
  assert(
    checks,
    day1Profile.decisionShape === 'standard',
    'day1 teaching standard shape',
    day1Profile.decisionShape,
  );

  const transportEvent =
    sampleEvents.find((e) => resolveEventGameplayPressureDomain(e) === 'transport') ??
    sampleEvents[0]!;
  const inspectModel = buildEventInspectPhasePresentation({
    event: transportEvent,
    interactionState: 'revealed',
    day: 3,
  });
  const inspectIssues = auditEventInspectPhasePresentation(inspectModel);
  assert(checks, inspectIssues.length === 0, 'inspect audit clean', inspectIssues.join('; '));
  assert(
    checks,
    inspectModel.findings.length <= 3,
    'inspect findings max 3',
    String(inspectModel.findings.length),
  );

  const planModel = buildEventPlanPhasePresentation({
    event: transportEvent,
    selectedStrategyId: 'balanced_plan',
    day: 3,
  });
  const planIssues = auditEventPlanPhasePresentation(planModel);
  assert(checks, planIssues.length === 0, 'plan audit clean', planIssues.join('; '));
  assert(
    checks,
    planModel.strategies.length >= 2 && planModel.strategies.length <= 3,
    'plan strategies count',
    String(planModel.strategies.length),
  );

  const dispatchModel = buildEventDispatchPhasePresentation({
    event: transportEvent,
    assignmentReady: true,
    hasSelectedDecision: true,
    selectedPlanStrategyId: 'balanced_plan',
    day: 3,
  });
  const dispatchIssues = auditEventDispatchPhasePresentation(dispatchModel);
  assert(checks, dispatchIssues.length === 0, 'dispatch audit clean', dispatchIssues.join('; '));
  assert(
    checks,
    dispatchModel.compatibility.reasons.length <= 3,
    'dispatch compatibility max 3',
    String(dispatchModel.compatibility.reasons.length),
  );

  const fieldModel = buildEventFieldPhasePresentation({
    event: transportEvent,
    selectedPlanStrategyId: 'balanced_plan',
    day: 3,
  });
  const fieldIssues = auditEventFieldPhasePresentation(fieldModel);
  assert(checks, fieldIssues.length === 0, 'field audit clean', fieldIssues.join('; '));

  const findingsNoFake = buildEventInspectFindings(sampleLowDataEvent(), { day: 3 });
  const fakeUrgent = findingsNoFake.some(
    (f) => f.priority === 'urgent' && f.kind === 'general',
  );
  assert(checks, !fakeUrgent, 'low-data no fake urgent findings');

  assert(
    checks,
    day8PlusSamples.length >= 2,
    'day8+ sample set',
    String(day8PlusSamples.length),
  );

  const nestedInspect = verifyOperationInspectUiScenario();
  assert(checks, nestedInspect.ok, 'verify:operation-inspect-ui nested');

  const nestedPlan = verifyOperationPlanUiScenario();
  assert(checks, nestedPlan.ok, 'verify:operation-plan-ui nested');

  const nestedDispatch = verifyOperationDispatchMotionScenario();
  assert(checks, nestedDispatch.ok, 'verify:operation-dispatch-motion nested');

  const nestedField = verifyOperationFieldLiveScenario();
  assert(checks, nestedField.ok, 'verify:operation-field-live nested');

  const nestedFlow = verifyOperationFlowQaScenario();
  assert(checks, nestedFlow.ok, 'verify:operation-flow-qa nested');

  const failCount = checks.filter((c) => !c.ok).length;

  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
    day8PlusSamples,
  };
}
