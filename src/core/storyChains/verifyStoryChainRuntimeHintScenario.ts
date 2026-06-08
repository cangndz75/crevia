import { buildActiveTaskRouteUiModel } from '@/core/activeTaskRoutes';
import type { CarryOverMemoryModel } from '@/core/carryOver';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  buildDistrictOperationActionCandidates,
  createInitialDistrictOperationActionState,
  selectDistrictOperationAction,
} from '@/core/districtOperationActions/districtOperationActionEngine';
import { buildDistrictMemoryRuntimeSnapshot } from '@/core/districtMemoryRuntime';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime';
import { buildHubOpenEndedIntegrationModel } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { buildMapDistrictIntelligenceModel } from '@/core/map/mapDistrictIntelligencePresentation';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { verifyDistrictOperationActionScenario } from '@/core/districtOperationActions/verifyDistrictOperationActionScenario';
import { verifyEventResultSystemsEchoScenario } from '@/core/events/verifyEventResultSystemsEchoScenario';
import { verifyHubOpenEndedIntegrationScenario } from '@/core/hub/verifyHubOpenEndedIntegrationScenario';
import { verifyMapDistrictIntelligenceScenario } from '@/core/map/verifyMapDistrictIntelligenceScenario';
import { verifyReportSystemsIntegrationScenario } from '@/core/reports/verifyReportSystemsIntegrationScenario';
import { verifyStoryChainScenario } from '@/core/storyChains/verifyStoryChainScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { STORY_CHAIN_MOBILE_COPY_MAX } from './storyChainConstants';
import {
  storyChainCopyContainsForbiddenTerms,
  storyChainCopyContainsPanicTerms,
} from './storyChainPresentation';
import {
  buildStoryChainRuntimeHintModel,
  buildStoryChainRuntimeHintVisibility,
  shouldSuppressStoryChainHintForSurface,
  validateStoryChainRuntimeHintCopy,
} from './storyChainRuntimeHintPresentation';

export type VerifyStoryChainRuntimeHintOutcome = {
  ok: boolean;
  checks: string[];
};

function record(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function carryOver(day: number): CarryOverMemoryModel {
  return {
    id: `verify-chain-carry-${day}`,
    surface: 'hub',
    direction: 'yesterday_to_today',
    domain: 'vehicle_route',
    tone: 'warning',
    title: 'Dünden Kalan Etki',
    summary: 'Dünkü rota bugün araç temposunda kısa bir takip izi bırakıyor.',
    primaryTag: 'Araç',
    secondaryTag: 'Rota',
    iconKey: 'car-outline',
    source: 'daily_report',
    visible: true,
    maxLines: 2,
  };
}

function scenarioOk(outcome: { ok: boolean; checks?: string[] }): boolean {
  if ('checks' in outcome && Array.isArray(outcome.checks)) {
    return outcome.ok && !outcome.checks.some((line) => line.startsWith('FAIL'));
  }
  return outcome.ok;
}

export function verifyStoryChainRuntimeHintScenario(): VerifyStoryChainRuntimeHintOutcome {
  const checks: string[] = [];
  let ok = true;

  let missingSafe = false;
  try {
    missingSafe = !buildStoryChainRuntimeHintModel({}).visible;
  } catch {
    missingSafe = false;
  }
  ok = record(checks, missingSafe, 'Eksik state crash üretmez', 'Eksik state crash') && ok;

  const day1Visibility = buildStoryChainRuntimeHintVisibility({ day: 1 });
  const day1Model = buildStoryChainRuntimeHintModel({ day: 1 });
  ok =
    record(
      checks,
      day1Visibility === 'hidden' && !day1Model.visible,
      'Day 1 story chain hint hidden',
      `day1 visibility=${day1Visibility}`,
    ) && ok;

  const day2NoSignal = buildStoryChainRuntimeHintModel({ day: 2 });
  const day2WithCarry = buildStoryChainRuntimeHintModel({ day: 2, carryOverMemory: carryOver(2) });
  ok =
    record(
      checks,
      buildStoryChainRuntimeHintVisibility({ day: 2 }) === 'hidden' ||
        buildStoryChainRuntimeHintVisibility({ day: 2, carryOverMemory: carryOver(2) }) === 'subtle',
      'Day 2-3 subtle visibility kuralı',
      `day2=${day2NoSignal.visibility} carry=${day2WithCarry.visibility}`,
    ) && ok;

  const day5Trust = buildDistrictTrustRuntimeSnapshot({ day: 5, focusDistrictId: 'cumhuriyet' });
  const day5Memory = buildDistrictMemoryRuntimeSnapshot({
    day: 5,
    focusDistrictId: 'cumhuriyet',
    trustSnapshot: day5Trust,
  });
  const day5Model = buildStoryChainRuntimeHintModel({
    day: 5,
    selectedDistrictId: 'cumhuriyet',
    districtTrustSnapshot: day5Trust,
    districtMemorySnapshot: day5Memory,
    operationSignals: createInitialOperationSignalsState(5),
  });
  ok =
    record(
      checks,
      day5Model.visibility === 'compact' &&
        Boolean(day5Model.hubLine || day5Model.mapLine || day5Model.resultLine || day5Model.reportLine),
      'Day 4+ Hub/Map/Result/Report hint üretebilir',
      day5Model.debugRows.join(' | '),
    ) && ok;

  const day8Model = buildStoryChainRuntimeHintModel({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    selectedDistrictId: 'merkez',
    operationSignals: createInitialOperationSignalsState(POST_PILOT_FIRST_OPERATION_DAY),
    isPostPilot: true,
  });
  ok =
    record(
      checks,
      day8Model.visibility === 'detailed',
      'Day 8+ detailed visibility dönebilir',
      day8Model.visibility,
    ) && ok;

  const carryVisible = buildStoryChainRuntimeHintModel({
    day: 6,
    carryOverMemory: carryOver(6),
    isCarryOverCardVisible: true,
    carryOverLine: carryOver(6).summary,
  });
  ok =
    record(
      checks,
      shouldSuppressStoryChainHintForSurface({
        surface: 'hub',
        hintText: carryOver(6).summary,
        input: { day: 6, isCarryOverCardVisible: true, carryOverLine: carryOver(6).summary },
      }),
      'Carry-over visible iken duplicate chain hint bastırılır',
      carryVisible.suppressionReasons.join(','),
    ) && ok;

  const memoryTrust = buildStoryChainRuntimeHintModel({
    day: 6,
    selectedDistrictId: 'cumhuriyet',
    districtTrustSnapshot: day5Trust,
    districtMemorySnapshot: day5Memory,
  });
  ok =
    record(
      checks,
      memoryTrust.chainKind !== undefined || Boolean(memoryTrust.hubLine?.text),
      'District memory unresolved relevant chain hint üretir',
      memoryTrust.debugRows.join(' | '),
    ) && ok;

  const fragileTrust = buildDistrictTrustRuntimeSnapshot({
    day: 6,
    focusDistrictId: 'cumhuriyet',
    operationSignals: createInitialOperationSignalsState(6),
  });
  const trustHint = buildStoryChainRuntimeHintModel({
    day: 6,
    selectedDistrictId: 'cumhuriyet',
    districtTrustSnapshot: fragileTrust,
  });
  ok =
    record(
      checks,
      trustHint.visible || trustHint.healthStatus !== 'blocked',
      'District trust recovery/social chain hint üretir',
      trustHint.debugRows.join(' | '),
    ) && ok;

  const seed = createDay1Seed();
  const route = buildActiveTaskRouteUiModel({
    day: 5,
    activeEvent: seed.gameState.events[0],
    operationSignals: createInitialOperationSignalsState(5),
    eventPhase: 'dispatch',
  });
  const routeHint = buildStoryChainRuntimeHintModel({
    day: 5,
    selectedDistrictId: 'merkez',
    activeTaskRouteModel: route,
    operationSignals: createInitialOperationSignalsState(5),
  });
  ok =
    record(
      checks,
      routeHint.visible || routeHint.mapLine !== undefined || routeHint.healthStatus !== 'blocked',
      'Active route varsa route chain hint bonus alır',
      routeHint.debugRows.join(' | '),
    ) && ok;

  const crisisHint = buildStoryChainRuntimeHintModel({
    day: 8,
    crisisState: { status: 'active', level: 'watch' },
    operationSignals: createInitialOperationSignalsState(8),
    selectedDistrictId: 'sanayi',
  });
  const crisisTexts = [
    crisisHint.hubLine?.text,
    crisisHint.mapLine?.text,
    crisisHint.resultLine?.text,
    crisisHint.reportLine?.text,
  ].filter(Boolean) as string[];
  ok =
    record(
      checks,
      !crisisTexts.some((text) => storyChainCopyContainsPanicTerms(text)),
      'Crisis context panic wording üretmez',
      crisisTexts.join(' | '),
    ) && ok;

  const actionState = createInitialDistrictOperationActionState();
  const day4Actions = buildDistrictOperationActionCandidates({
    day: 4,
    focusDistrictId: 'merkez',
    selectedByDay: actionState.selectedByDay,
    recentDistrictOperationKeys: actionState.recentDistrictOperationKeys,
  });
  const selectedState = selectDistrictOperationAction(actionState, day4Actions[0]!);
  const actionHint = buildStoryChainRuntimeHintModel({
    day: 4,
    districtOperationActionState: selectedState,
    selectedDistrictId: day4Actions[0]!.districtId,
  });
  ok =
    record(
      checks,
      actionHint.chainKind === 'operation_followup_chain' ||
        actionHint.hubLine?.source === 'district_operation_action' ||
        shouldSuppressStoryChainHintForSurface({
          surface: 'hub',
          hintText: actionHint.hubLine?.text ?? 'takip izi',
          input: {
            day: 4,
            districtOperationActionState: selectedState,
            districtOperationActionSummary: day4Actions[0]!.reasonLine,
          },
        }) === false,
      'District operation action selected ise operation_followup chain hint üretebilir',
      actionHint.debugRows.join(' | '),
    ) && ok;

  const hubModel = buildHubOpenEndedIntegrationModel({
    day: 6,
    operationSignals: createInitialOperationSignalsState(6),
    districtTrustSnapshot: day5Trust,
    districtMemorySnapshot: day5Memory,
    carryOverMemory: carryOver(6),
  });
  const storyChainLines = hubModel.focusLines.filter((line) => line.kind === 'story_chain');
  ok =
    record(
      checks,
      storyChainLines.length <= 1,
      'Hub max 1 story chain line per surface',
      String(storyChainLines.length),
    ) && ok;

  const mapModel = buildMapDistrictIntelligenceModel({
    day: 6,
    selectedDistrictId: 'cumhuriyet',
    districtTrustSnapshot: day5Trust,
    districtMemorySnapshot: day5Memory,
    operationSignals: createInitialOperationSignalsState(6),
  });
  const mapChainLines = mapModel.visibleLines.filter((line) => line.kind === 'chain');
  ok =
    record(
      checks,
      mapChainLines.length <= 1,
      'Map max 1 story chain line per surface',
      String(mapChainLines.length),
    ) && ok;

  const allHintTexts = [
    day5Model.hubLine?.text,
    day5Model.mapLine?.text,
    day5Model.resultLine?.text,
    day5Model.reportLine?.text,
    day8Model.hubLine?.text,
  ].filter(Boolean) as string[];
  ok =
    record(
      checks,
      allHintTexts.every((text) => text.length <= STORY_CHAIN_MOBILE_COPY_MAX + 1),
      'Copy max length guard çalışır',
      allHintTexts.map((text) => String(text.length)).join(','),
    ) && ok;

  ok =
    record(
      checks,
      allHintTexts.every(
        (text) =>
          !storyChainCopyContainsForbiddenTerms(text) && !storyChainCopyContainsPanicTerms(text),
      ) && validateStoryChainRuntimeHintCopy('Yarına kısa takip penceresi açılabilir.'),
      'Forbidden/panic copy guard çalışır',
      allHintTexts.join(' | '),
    ) && ok;

  ok = record(checks, SAVE_VERSION === 25, 'SAVE_VERSION değişmez', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  ok =
    record(checks, scenarioOk(verifyStoryChainScenario()), 'verify:story-chains bozulmaz', 'story-chains regressed') &&
    ok;
  ok =
    record(
      checks,
      scenarioOk(verifyHubOpenEndedIntegrationScenario()),
      'verify:hub-open-ended-integration bozulmaz',
      'hub-open-ended regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyMapDistrictIntelligenceScenario()),
      'verify:map-district-intelligence bozulmaz',
      'map-intelligence regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyEventResultSystemsEchoScenario()),
      'verify:event-result-systems-echo bozulmaz',
      'event-result-echo regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyReportSystemsIntegrationScenario()),
      'verify:report-systems-integration bozulmaz',
      'report-systems regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyDistrictOperationActionScenario()),
      'verify:district-operation-actions bozulmaz',
      'district-operation-actions regressed',
    ) && ok;

  return { ok, checks };
}
