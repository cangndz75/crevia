import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { EventCard } from '@/core/models/EventCard';

import { buildActiveOperationMapBinding, resolveActiveOperationMapPhase } from './activeOperationMapBindingModel';
import {
  buildActiveOperationMapCardModel,
  enrichMapGameplayActiveOperationTracker,
} from './activeOperationMapBindingPresentation';
import { ACTIVE_OPERATION_MAP_PHASES } from './activeOperationMapBindingTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyActiveOperationMapBindingOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function makeEvent(id = 'event_active_operation'): EventCard {
  return {
    id,
    title: 'Rota daralmasi',
    category: 'transport',
    riskLevel: 'medium',
    district: 'Merkez',
    neighborhoodId: 'merkez',
    description: 'Saha ekibi rota baskisini kontrol ediyor.',
    contextTag: 'route',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: 2, risk: -1, xp: 30 },
    day: 4,
  };
}

function makeAssignment(status: EventAssignmentState['status']): EventAssignmentState {
  return {
    eventId: 'event_active_operation',
    day: 4,
    status,
    source: 'player',
    personnelType: 'balanced_team',
    vehicleType: 'route_support_vehicle',
    approachType: 'balanced_response',
    compatibilityScore: 74,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
    advisorNote: 'Plan uyumu dengeli.',
  };
}

export function verifyActiveOperationMapBindingScenario(): VerifyActiveOperationMapBindingOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const unknown = buildActiveOperationMapBinding({ day: 3 });
  const day1 = buildActiveOperationMapBinding({ day: 1, activeEvent: makeEvent() });
  const planning = buildActiveOperationMapBinding({
    day: 4,
    activeEvent: makeEvent(),
    assignment: makeAssignment('draft'),
  });
  const dispatchReady = buildActiveOperationMapBinding({
    day: 4,
    activeEvent: makeEvent(),
    assignment: makeAssignment('confirmed'),
    eventDetailRoute: '/events/event_active_operation',
  });
  const completed = buildActiveOperationMapBinding({
    day: 4,
    activeEvent: makeEvent(),
    assignment: makeAssignment('processed'),
  });
  const resultTrace = buildActiveOperationMapBinding({
    day: 8,
    activeEvent: makeEvent(),
    assignment: makeAssignment('processed'),
    resultRouteAvailable: true,
  });

  record(assert(checks, unknown.phase === 'unknown', 'missing event uses unknown phase', `unexpected phase ${unknown.phase}`));
  record(assert(checks, unknown.visibilityLevel === 'hidden', 'missing event hides card', `missing event visibility ${unknown.visibilityLevel}`));
  record(assert(checks, day1.phase === 'before_inspect', 'day 1 uses before_inspect', `day 1 phase ${day1.phase}`));
  record(assert(checks, day1.visibilityLevel === 'summary', 'day 1 keeps summary visibility', `day 1 visibility ${day1.visibilityLevel}`));
  record(assert(checks, planning.phase === 'planning', 'draft assignment maps to planning', `draft phase ${planning.phase}`));
  record(assert(checks, dispatchReady.phase === 'dispatch_ready', 'confirmed assignment maps to dispatch_ready', `confirmed phase ${dispatchReady.phase}`));
  record(assert(checks, completed.phase === 'completed', 'processed assignment maps to completed', `processed phase ${completed.phase}`));
  record(assert(checks, resultTrace.phase === 'result_trace_available', 'result trace requires source flag', `result phase ${resultTrace.phase}`));
  record(assert(checks, !completed.signalKinds.includes('result_trace'), 'completed does not fake result trace', 'completed fakes result trace'));
  record(assert(checks, ACTIVE_OPERATION_MAP_PHASES.includes(resultTrace.phase), 'phase enum is valid', 'phase enum invalid'));

  const withRoute = buildActiveOperationMapBinding({
    day: 8,
    activeEvent: makeEvent(),
    activeTaskRoute: {
      id: 'route:event_active_operation',
      phase: 'en_route',
      status: 'active',
      healthStatus: 'healthy',
      visibility: { mode: 'standard', showSteps: true, showResourceWarning: false, maxSteps: 3, showMapHint: true },
      routeModel: {} as never,
      steps: [],
      districtNodes: [],
      resourceNodes: [],
      dispatchLine: 'Sevk hazir.',
      fieldLine: 'Saha aktif.',
      mapLine: 'Rota haritada takip ediliyor.',
      reportLine: 'Rota rapora islenir.',
      statusLine: 'Yolda',
      activeStepIndex: 0,
      visible: true,
      isHintOnly: true,
    },
  });
  record(assert(checks, withRoute.phase === 'dispatching', 'route en_route maps to dispatching', `route phase ${withRoute.phase}`));
  record(assert(checks, withRoute.canShowRouteHint && withRoute.routeLine === 'Rota haritada takip ediliyor.', 'route line only appears with visible route', 'route hint missing'));
  record(assert(checks, withRoute.mapLine !== withRoute.routeLine, 'map line stays phase copy when route exists', 'map line replaced by route'));

  const noRoute = buildActiveOperationMapBinding({ day: 8, activeEvent: makeEvent() });
  record(assert(checks, !noRoute.routeLine && !noRoute.canShowRouteHint, 'route line absent without route source', 'route line invented'));

  const paused = buildActiveOperationMapBinding({
    day: 5,
    activeEvent: makeEvent(),
    assignment: makeAssignment('confirmed'),
    microDecisionPending: true,
  });
  record(assert(checks, paused.phase === 'field_paused', 'micro decision maps to field_paused', `paused phase ${paused.phase}`));
  record(
    assert(
      checks,
      resolveActiveOperationMapPhase({
        day: 5,
        activeEvent: makeEvent(),
        assignment: makeAssignment('confirmed'),
        microDecisionPending: true,
      }) === 'field_paused',
      'phase resolver exported',
      'resolver missing',
    ),
  );

  const enriched = enrichMapGameplayActiveOperationTracker(
    {
      id: 'active_operation_tracker',
      role: 'operation_tracker',
      title: 'Aktif Operasyon',
      playerQuestion: 'Operasyon hangi fazda?',
      supportedDecision: 'open_active_operation',
      supportedDecisionLine: 'Eski satir.',
      sourceKinds: ['active_event'],
      sourceIds: ['event:test'],
      visibilityLevel: 'summary',
      dayRange: 'day_2_7',
      implementationRisk: 'medium',
      confidence: 'medium',
      priority: 70,
      isActionable: true,
    },
    dispatchReady,
  );
  record(assert(checks, enriched?.supportedDecisionLine === dispatchReady.decisionLine, 'tracker binding enriched from active operation', 'enrich failed'));

  const detailedDistrict = buildActiveOperationMapBinding({
    day: 8,
    activeEvent: makeEvent(),
    unlockedPermissionIds: ['district_trust_preview'],
    districtPersonality: {
      districtId: 'merkez',
      districtName: 'Merkez',
      archetypeIds: ['balanced_district'],
      primaryArchetypeId: 'balanced_district',
      criteria: [],
      primaryCriterionId: 'social_sensitivity',
      secondaryCriterionIds: [],
      gameplayTags: ['balanced_watch'],
      eventBias: { preferredDomains: ['transport'], pressureHints: ['route_pressure'] },
      strategyBias: { rapidResponseRisk: 'medium', balancedPlanFit: 'high', longTermFixValue: 'medium', recommendedCautionLine: 'Dengeyi koru.' },
      mapBias: { preferredMapRoles: ['route_support'], mapSignalLine: 'Merkez rota baskisina duyarlidir.' },
      eceToneHint: 'strategic',
      confidence: 'high',
      isFallback: false,
      sourceLabel: 'district',
      sourceIds: ['district:merkez'],
    },
  });
  record(assert(checks, detailedDistrict.visibilityLevel === 'detailed', 'permission unlocks detailed visibility', `visibility ${detailedDistrict.visibilityLevel}`));
  record(assert(checks, detailedDistrict.districtLine === 'Merkez rota baskisina duyarlidir.', 'detailed district line comes from source', 'district line missing'));
  record(assert(checks, !day1.districtLine, 'day 1 suppresses district detail', 'day 1 leaks district detail'));

  const card = buildActiveOperationMapCardModel(dispatchReady);
  record(assert(checks, Boolean(card), 'visible binding builds card', 'card missing'));
  record(assert(checks, !buildActiveOperationMapCardModel(unknown), 'hidden binding has no card', 'hidden binding built card'));
  record(assert(checks, card?.ctaLabel === 'Operasyonu Ac', 'active card uses event route CTA', `cta ${card?.ctaLabel}`));
  record(assert(checks, !JSON.stringify(card).includes('dispatch_ready'), 'card hides technical enum', 'card leaks technical enum'));

  const mapScreen = readRepo('src/features/map/screens/MapScreen.tsx');
  const cityMapCard = readRepo('src/features/map/components/CityMapCard.tsx');
  const mapHeroPanel = readRepo('src/features/map/components/MapHeroPanel.tsx');
  const mapUiPresentation = readRepo('src/features/map/utils/mapUiPresentation.ts');
  const packageJson = readRepo('package.json');
  const gamePersist = readRepo('src/store/gamePersist.ts');
  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  const dayPipeline = [
    readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts'),
    readRepo('src/core/dayPipeline/index.ts'),
  ].join('\n');

  record(assert(checks, mapScreen.includes('buildActiveOperationMapBinding'), 'MapScreen builds active operation binding', 'MapScreen missing binding'));
  record(assert(checks, mapScreen.includes('eventDetailRoute:'), 'MapScreen passes event detail route', 'MapScreen missing event route'));
  record(assert(checks, mapScreen.includes('activeOperationCard={activeOperationMapCard}'), 'MapScreen passes card to map panel', 'MapScreen missing card prop'));
  record(assert(checks, readRepo('src/core/activeOperationMapBinding/activeOperationMapBindingPresentation.ts').includes('enrichMapGameplayActiveOperationTracker'), 'map gameplay tracker enrich helper', 'enrich helper missing'));
  record(assert(checks, mapHeroPanel.includes('activeOperationCard?: ActiveOperationMapCardModel'), 'MapHeroPanel accepts card model', 'MapHeroPanel missing card prop'));
  record(assert(checks, cityMapCard.includes('activeOperationCard') && !cityMapCard.includes('Meydan Temizlik Kontrolu'), 'CityMapCard copy is model-driven', 'CityMapCard still hard-codes operation copy'));
  record(assert(checks, cityMapCard.includes('numberOfLines={2}') && cityMapCard.includes('minWidth: 0'), 'map card keeps overflow guards', 'map card overflow guards missing'));
  record(assert(checks, mapUiPresentation.includes('activeOperationCardNumberOfLines'), 'layout guard records active operation card', 'layout guard missing active operation card'));
  record(assert(checks, packageJson.includes('verify:active-operation-map-binding'), 'package script registered', 'package script missing'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-active-operation-map-binding-pass.md')), 'binding docs exist', 'binding docs missing'));
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION && gamePersist.includes('SAVE_VERSION = 26'), 'SAVE_VERSION unchanged', 'SAVE_VERSION changed'));
  record(assert(checks, !applyDecision.includes('activeOperationMapBinding'), 'applyDecision untouched by binding', 'applyDecision imports binding'));
  record(assert(checks, !dayPipeline.includes('activeOperationMapBinding'), 'day pipeline untouched by binding', 'day pipeline imports binding'));

  return { ok, warn: false, checks };
}
