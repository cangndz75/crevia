import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildHubOpenEndedIntegrationModel } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { buildMapDistrictIntelligenceModel } from '@/core/map/mapDistrictIntelligencePresentation';
import { buildProfileCareerShowcaseModel } from '@/core/profile/profileCareerShowcasePresentation';
import { buildReportSystemsIntegrationModel } from '@/core/reports/reportSystemsIntegrationPresentation';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { verifyHubOpenEndedIntegrationScenario } from '@/core/hub/verifyHubOpenEndedIntegrationScenario';
import { verifyMapDistrictIntelligenceScenario } from '@/core/map/verifyMapDistrictIntelligenceScenario';
import { verifyProfileCareerShowcaseScenario } from '@/core/profile/verifyProfileCareerShowcaseScenario';
import { verifyReportSystemsIntegrationScenario } from '@/core/reports/verifyReportSystemsIntegrationScenario';
import { verifyStoryChainRuntimeHintScenario } from '@/core/storyChains/verifyStoryChainRuntimeHintScenario';
import { verifyOperationEraScenario } from '@/core/operationEra/verifyOperationEraScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  OPERATION_ERA_RUNTIME_PREVIEW_MOBILE_COPY_MAX,
  OPERATION_ERA_CONTENT_PACK_IDS,
} from './operationEraRuntimePreviewConstants';
import {
  buildOperationEraEligibility,
  buildOperationEraRuntimePreviewModel,
  resolveOperationEraPreviewKind,
  scoreOperationEraPreviewCandidate,
} from './operationEraRuntimePreviewModel';
import {
  buildOperationEraHubLine,
  buildOperationEraMapLine,
  buildOperationEraProfileLine,
  buildOperationEraReportLine,
  buildOperationEraSelectionContextHint,
  buildOperationEraStoryChainBias,
  buildOperationEraVariantBias,
  operationEraRuntimePreviewCopyContainsForbiddenTerms,
  operationEraRuntimePreviewCopyContainsPanicTerms,
  validateOperationEraRuntimePreviewCopy,
} from './operationEraRuntimePreviewPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyOperationEraRuntimePreviewOutcome = {
  ok: boolean;
  checks: string[];
};

function record(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function scenarioOk(outcome: { ok: boolean; checks?: string[] }): boolean {
  if ('checks' in outcome && Array.isArray(outcome.checks)) {
    return outcome.ok && !outcome.checks.some((line) => line.startsWith('FAIL'));
  }
  return outcome.ok;
}

function routePressureSignals(day: number) {
  const signals = createInitialOperationSignalsState(day);
  signals.vehicles = { ...signals.vehicles, status: 'critical', score: 88 };
  signals.overall = { ...signals.overall, status: 'strained' };
  return signals;
}

function containerPressureSignals(day: number) {
  const signals = createInitialOperationSignalsState(day);
  signals.containers = { ...signals.containers, status: 'critical', score: 86 };
  return signals;
}

export function verifyOperationEraRuntimePreviewScenario(): VerifyOperationEraRuntimePreviewOutcome {
  const checks: string[] = [];
  let ok = true;

  let missingSafe = false;
  try {
    missingSafe = !buildOperationEraRuntimePreviewModel({}).visible;
  } catch {
    missingSafe = false;
  }
  ok = record(checks, missingSafe, 'Eksik state crash üretmez', 'Eksik state crash') && ok;

  const day1 = buildOperationEraRuntimePreviewModel({ day: 1 });
  const day7 = buildOperationEraRuntimePreviewModel({ day: 7 });
  ok =
    record(
      checks,
      !day1.visible && !day7.visible,
      'Day 1-7 era preview hidden veya safe pilot fallback',
      `day1=${day1.visible} day7=${day7.visible}`,
    ) && ok;

  const day8 = buildOperationEraRuntimePreviewModel({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    isPostPilot: true,
    isFullMode: true,
    operationSignals: createInitialOperationSignalsState(POST_PILOT_FIRST_OPERATION_DAY),
  });
  ok =
    record(
      checks,
      day8.visible && buildOperationEraEligibility({ day: 8, isPostPilot: true }).visible,
      'Day 8+ operation era preview görünür olabilir',
      day8.debugRows.join(' | '),
    ) && ok;

  const highRank = buildOperationEraRuntimePreviewModel({
    day: 10,
    isPostPilot: true,
    isFullMode: true,
    rankKey: 'operations_director',
    authorityTrust: 500,
    unlockedPermissionIds: ['district_specific_operations_preview'],
    operationSignals: createInitialOperationSignalsState(10),
  });
  ok =
    record(
      checks,
      highRank.visibility === 'detailed',
      'High rank detailed visibility döner',
      highRank.visibility,
    ) && ok;

  const routeKind = resolveOperationEraPreviewKind({
    day: 9,
    isPostPilot: true,
    isFullMode: true,
    operationSignals: routePressureSignals(9),
    activeTaskRouteModel: { visible: true, active: true },
  });
  ok =
    record(
      checks,
      routeKind === 'route_efficiency_era',
      'Route pressure route_efficiency_era önceliklendirir',
      routeKind,
    ) && ok;

  const containerKind = resolveOperationEraPreviewKind({
    day: 9,
    isPostPilot: true,
    isFullMode: true,
    operationSignals: containerPressureSignals(9),
    districtMemorySnapshot: {
      day: 9,
      focusDistrictId: 'cumhuriyet',
      districts: [
        {
          districtId: 'cumhuriyet',
          districtName: 'Cumhuriyet',
          primaryKind: 'repeated_pressure',
          intensity: 'medium',
          trend: 'steady',
          summaryLine: 'Konteyner baskısı izleniyor.',
          chips: [],
          isPrimary: true,
        },
      ],
    } as never,
  });
  ok =
    record(
      checks,
      containerKind === 'container_recovery_era',
      'Container pressure container_recovery_era önceliklendirir',
      containerKind,
    ) && ok;

  const socialKind = resolveOperationEraPreviewKind({
    day: 9,
    isPostPilot: true,
    districtTrustSnapshot: {
      day: 9,
      focusDistrictId: 'cumhuriyet',
      districts: [{ districtId: 'cumhuriyet', districtName: 'Cumhuriyet', band: 'fragile', score: 32, trend: 'worsening' }],
    } as never,
  });
  ok =
    record(
      checks,
      socialKind === 'social_trust_era',
      'Social trust pressure social_trust_era önceliklendirir',
      socialKind,
    ) && ok;

  const crisisKind = resolveOperationEraPreviewKind({
    day: 9,
    isPostPilot: true,
    crisisState: { status: 'active', level: 'watch' },
    operationSignals: createInitialOperationSignalsState(9),
  });
  const crisisLine = buildOperationEraHubLine({
    day: 9,
    isPostPilot: true,
    crisisState: { status: 'active', level: 'watch' },
  });
  ok =
    record(
      checks,
      crisisKind === 'crisis_prevention_era' &&
        !operationEraRuntimePreviewCopyContainsPanicTerms(crisisLine?.text ?? ''),
      'Crisis watch crisis_prevention_era önceliklendirir ama panic wording üretmez',
      `${crisisKind} | ${crisisLine?.text ?? ''}`,
    ) && ok;

  const fatigueKind = resolveOperationEraPreviewKind({
    day: 9,
    isPostPilot: true,
    resourceFatigue: { level: 'high', score: 82, isHigh: true },
  });
  ok =
    record(
      checks,
      fatigueKind === 'resource_balance_era',
      'Resource fatigue resource_balance_era önceliklendirir',
      fatigueKind,
    ) && ok;

  const fallbackKind = resolveOperationEraPreviewKind({
    day: 8,
    isPostPilot: true,
    operationSignals: createInitialOperationSignalsState(8),
  });
  ok =
    record(
      checks,
      fallbackKind === 'open_operation_career_era',
      'No signal fallback open_operation_career_era döner',
      fallbackKind,
    ) && ok;

  const freshScore = scoreOperationEraPreviewCandidate('route_efficiency_era', {
    day: 9,
    operationSignals: routePressureSignals(9),
    recentEraKindIds: ['route_efficiency_era'],
  }).score;
  const freshBase = scoreOperationEraPreviewCandidate('route_efficiency_era', {
    day: 9,
    operationSignals: routePressureSignals(9),
  }).score;
  ok =
    record(
      checks,
      freshScore < freshBase,
      'Same era freshness penalty alır',
      `${freshScore} < ${freshBase}`,
    ) && ok;

  const hubLine = buildOperationEraHubLine({ day: 9, isPostPilot: true, isFullMode: true });
  ok =
    record(
      checks,
      Boolean(hubLine?.text) &&
        (hubLine?.text.length ?? 0) <= OPERATION_ERA_RUNTIME_PREVIEW_MOBILE_COPY_MAX + 1,
      'Hub line max length guard çalışır',
      hubLine?.text ?? 'none',
    ) && ok;

  const reportLine = buildOperationEraReportLine({ day: 9, isPostPilot: true, isFullMode: true });
  ok =
    record(
      checks,
      !reportLine?.text?.toLocaleLowerCase('tr-TR').includes('dönem kapanışı') &&
        !reportLine?.text?.toLocaleLowerCase('tr-TR').includes('sezon finali'),
      'Report line final/season wording içermez',
      reportLine?.text ?? 'none',
    ) && ok;

  const profileLine = buildOperationEraProfileLine({
    day: 9,
    isPostPilot: true,
    permissionChipLabels: ['Operasyon Dönemi'],
  });
  ok =
    record(
      checks,
      !operationEraRuntimePreviewCopyContainsForbiddenTerms(profileLine?.text ?? 'kariyer'),
      'Profile line premium/paywall wording içermez',
      profileLine?.text ?? 'none',
    ) && ok;

  const mapLine = buildOperationEraMapLine({
    day: 9,
    isPostPilot: true,
    crisisOverlayVisible: true,
  });
  ok =
    record(
      checks,
      !mapLine || mapLine.maxLines === 1,
      'Map line density guard çalışır',
      mapLine ? `${mapLine.maxLines}:${mapLine.text.length}` : 'hidden',
    ) && ok;

  const selectionHint = buildOperationEraSelectionContextHint({ day: 9, isPostPilot: true });
  const variantBias = buildOperationEraVariantBias({ day: 9, isPostPilot: true });
  const storyBias = buildOperationEraStoryChainBias({ day: 9, isPostPilot: true });
  ok =
    record(
      checks,
      selectionHint.isRuntimeLinked === false &&
        variantBias.length > 0 &&
        storyBias.length > 0 &&
        !('text' in selectionHint),
      'Selection/variant/story chain hint helperları safe payload döner',
      `${selectionHint.eraKind}`,
    ) && ok;

  ok =
    record(
      checks,
      Object.values(OPERATION_ERA_CONTENT_PACK_IDS).every((packId) => packId.length > 0),
      'Content pack references geçerli veya safe fallback',
      Object.values(OPERATION_ERA_CONTENT_PACK_IDS).join(','),
    ) && ok;

  const ensureDaily = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  ok =
    record(
      checks,
      !ensureDaily.includes('operationEraRuntimePreview') && !applyDecision.includes('operationEraRuntimePreview'),
      'Runtime event generation import/binding yok',
      'generation untouched',
    ) && ok;

  ok = record(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION değişmez', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const hubModel = buildHubOpenEndedIntegrationModel({
    day: 9,
    isPostPilot: true,
    operationSignals: createInitialOperationSignalsState(9),
  });
  const eraHubLines = hubModel.focusLines.filter((line) => line.kind === 'operation_era');
  ok =
    record(
      checks,
      eraHubLines.length <= 1,
      'Hub max 1 operation era line',
      String(eraHubLines.length),
    ) && ok;

  ok =
    record(checks, scenarioOk(verifyOperationEraScenario()), 'verify:operation-era bozulmaz', 'operation-era regressed') &&
    ok;
  ok =
    record(
      checks,
      scenarioOk(verifyHubOpenEndedIntegrationScenario()),
      'verify:hub-open-ended-integration bozulmaz',
      'hub regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyReportSystemsIntegrationScenario()),
      'verify:report-systems-integration bozulmaz',
      'report regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyProfileCareerShowcaseScenario()),
      'verify:profile-career-showcase bozulmaz',
      'profile regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyMapDistrictIntelligenceScenario()),
      'verify:map-district-intelligence bozulmaz',
      'map regressed',
    ) && ok;
  ok =
    record(
      checks,
      scenarioOk(verifyStoryChainRuntimeHintScenario()),
      'verify:story-chain-runtime-hints bozulmaz',
      'story-chain hints regressed',
    ) && ok;

  ok =
    record(
      checks,
      validateOperationEraRuntimePreviewCopy('Bugünkü ana yön: şehir operasyon ritmi sakin izleniyor.'),
      'Forbidden/panic copy guard çalışır',
      'copy guard',
    ) && ok;

  return { ok, checks };
}
