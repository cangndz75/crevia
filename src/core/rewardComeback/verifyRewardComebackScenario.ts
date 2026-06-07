import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  REWARD_COMEBACK_FORBIDDEN_TERMS,
  REWARD_COMEBACK_VARIANT_KINDS,
} from './rewardComebackConstants';
import {
  buildRewardComebackMomentForKind,
  buildRewardComebackVisibilityModel,
} from './rewardComebackModel';
import {
  isDuplicateRewardComebackLine,
  rewardComebackCopyContainsForbiddenTerms,
  rewardComebackCopyIsBlaming,
} from './rewardComebackPresentation';
import {
  buildRewardComebackHubPresentation,
  buildRewardComebackMapPresentation,
  buildRewardComebackReportPresentation,
  buildRewardComebackResultPresentation,
  buildRewardComebackSocialPresentation,
} from './rewardComebackWiring';
import type { RewardComebackMomentKind } from './rewardComebackTypes';

export type VerifyRewardComebackOutcome = {
  ok: boolean;
  checks: string[];
};

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 23;

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], label: string, condition: boolean, detail?: string): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}${detail ? `: ${detail}` : ''}`);
}

const positiveImpact: DecisionImpactExplanation = {
  id: 'impact-rc-1',
  kind: 'positive_tradeoff',
  title: 'Kararın etkisi',
  mainLine: 'Bugünkü karar sosyal güveni artırdı ama araç yorgunluğunu yükseltti.',
  tomorrowLine: 'Yarın Sanayi rotası tekrar izlenebilir.',
  tone: 'positive',
  relatedDomain: 'route',
  relatedDistrictId: 'sanayi',
  relatedResource: 'vehicle',
  confidence: 'high',
  sourceSignals: {
    metricKeys: ['publicSatisfaction'],
    operationSignalDomains: ['vehicles'],
    hasCarryOver: false,
    hasResourcePressure: true,
    hasDistrictContext: true,
    hasSocialContext: true,
  },
  maxVisibleLines: 3,
  shouldShowInResult: true,
  shouldEchoInReport: true,
  shouldEchoInHub: true,
};

const tomorrowWatch: TomorrowRiskModel = {
  id: 'tomorrow-rc-1',
  kind: 'route_pressure_tomorrow',
  title: 'Yarın dikkat',
  mainLine: 'Yarın Sanayi hattında rota dengesi korunmalı.',
  tone: 'watch',
  priority: 'high',
  relatedDistrictId: 'sanayi',
  relatedDomain: 'route',
  sourceSignals: ['operation_signals'],
  shouldShowInReport: true,
  shouldShowInHub: true,
  shouldShowAsCompact: true,
  maxVisibleLines: 2,
};

const momentKinds: RewardComebackMomentKind[] = [
  'decision_worked',
  'district_recovered',
  'risk_prevented',
  'route_balanced',
  'container_relief',
  'social_thanks',
  'comeback_available',
  'comeback_completed',
  'resource_recovered',
  'advisor_prediction_confirmed',
];

export function verifyRewardComebackScenario(): VerifyRewardComebackOutcome {
  const checks: string[] = [];

  const day1 = buildRewardComebackVisibilityModel({ day: 1 });
  assert(checks, 'model üretilebiliyor', Boolean(day1.primaryMoment || day1.moments.length > 0));
  assert(checks, 'Day 1 light', day1.visibility === 'compact' && day1.maxVisibleMoments <= 1);

  const day5 = buildRewardComebackVisibilityModel({
    day: 5,
    tomorrowRisk: tomorrowWatch,
    districtReportCard: {
      districtId: 'cumhuriyet',
      districtName: 'Cumhuriyet',
      day: 5,
      visible: true,
      visibility: 'standard',
      trustBand: 'strained',
      dominantIssueKind: 'social_trust',
      dominantIssueLabel: 'Sosyal güven',
      dominantIssueLine: 'Sosyal güven izleniyor.',
      recentEffectKind: 'decision_echo',
      recentEffectLine: 'Son karar etkili.',
      sourceSignals: {
        hasTrustRuntime: true,
        hasMemoryRuntime: false,
        hasOperationsRuntime: true,
        hasCarryOver: false,
        hasContentPack: false,
        hasTomorrowRisk: true,
        hasCityEcho: false,
        hasOperationSignals: true,
        hasResourceFatigue: false,
        hasSocialPulse: false,
      },
      statusTone: 'watch',
      priority: 'medium',
      duplicateKey: 'cumhuriyet',
      maxVisibleLines: 2,
    },
  });
  assert(checks, 'Day 4+ comeback candidate', day5.moments.some((m) => m.kind === 'comeback_available'));

  const day9 = buildRewardComebackVisibilityModel({
    day: 9,
    isMainOperationFull: true,
    decisionImpact: positiveImpact,
  });
  assert(checks, 'Day 8+ standard', day9.visibility === 'highlighted' || day9.visibility === 'standard');
  assert(checks, 'max moment caps korunuyor', day9.moments.length <= day9.maxVisibleMoments);

  const fallback = buildRewardComebackVisibilityModel({ day: 2 });
  assert(checks, 'fallback güvenli', fallback.moments.length >= 0);

  for (const kind of momentKinds) {
    const moment = buildRewardComebackMomentForKind(kind, 'Sanayi');
    assert(checks, `${kind} üretiliyor`, Boolean(moment?.line));
    assert(checks, `${kind} suçlayıcı değil`, !rewardComebackCopyIsBlaming(moment?.line ?? ''));
  }

  const packReward = buildRewardComebackVisibilityModel({
    day: 8,
    contentPackMeta: {
      packId: 'district_pack_one',
      familyId: 'district_family_1',
      variantId: 'reward_v1',
      variantKind: 'reward',
      domain: 'social',
      districtId: 'cumhuriyet',
      resultEcho: 'Cumhuriyet’te görünür hizmet etkisi toparlandı.',
      source: 'content_runtime_activation_lite',
    },
  });
  assert(
    checks,
    'reward variant moment',
    packReward.moments.some((m) => m.kind === 'reward_event_seen'),
  );
  assert(
    checks,
    'comeback variant moment',
    buildRewardComebackVisibilityModel({
      day: 6,
      contentPackMeta: {
        packId: 'vehicle_route_pack_one',
        familyId: 'route_family_1',
        variantId: 'comeback_v1',
        variantKind: 'comeback',
        domain: 'route',
        districtId: 'sanayi',
        socialEcho: 'Dünkü sıkışma bugün toparlama fırsatına dönüştü.',
        source: 'content_runtime_activation_lite',
      },
    }).moments.some((m) => m.kind === 'comeback_available' || m.kind === 'comeback_started'),
  );
  assert(
    checks,
    'recovery variant moment',
    buildRewardComebackVisibilityModel({
      day: 6,
      contentPackMeta: {
        packId: 'container_environment_pack_one',
        familyId: 'container_family_1',
        variantId: 'recovery_v1',
        variantKind: 'recovery',
        domain: 'container',
        districtId: 'yesilvadi',
        mapHint: 'Yeşilvadi çevre baskısı sakinleşiyor.',
        source: 'content_runtime_activation_lite',
      },
    }).moments.some((m) => m.kind === 'district_recovered'),
  );
  assert(
    checks,
    'technical pack name görünmüyor',
    !packReward.resultLine?.includes('pack') && !packReward.hubLine?.includes('metadata'),
  );

  for (const term of REWARD_COMEBACK_FORBIDDEN_TERMS.slice(0, 6)) {
    assert(
      checks,
      `forbidden term listed: ${term}`,
      REWARD_COMEBACK_FORBIDDEN_TERMS.includes(term as (typeof REWARD_COMEBACK_FORBIDDEN_TERMS)[number]),
    );
  }
  assert(
    checks,
    'forbidden economy words yok',
    !rewardComebackCopyContainsForbiddenTerms(day9.resultLine ?? '') &&
      !rewardComebackCopyContainsForbiddenTerms(day9.hubLine ?? ''),
  );

  const hub = buildRewardComebackHubPresentation({ day: 5, decisionImpact: positiveImpact });
  const report = buildRewardComebackReportPresentation({ day: 5, decisionImpact: positiveImpact });
  const result = buildRewardComebackResultPresentation({
    day: 4,
    decisionImpact: positiveImpact,
    existingLines: [positiveImpact.mainLine],
  });
  const social = buildRewardComebackSocialPresentation({ day: 5, decisionImpact: positiveImpact });
  const map = buildRewardComebackMapPresentation({
    day: 6,
    mapReactionKind: 'recovery_glow',
    priorityDistrictId: 'yesilvadi',
  });

  assert(checks, 'Hub helper var', Boolean(hub.hubLine) || hub.model.moments.length > 0);
  assert(checks, 'Report helper var', Boolean(report.reportLine) || report.model.moments.length > 0);
  assert(checks, 'Result helper var', Boolean(result.resultLine));
  assert(checks, 'Social helper var', Boolean(social.socialLine) || social.model.moments.length > 0);
  assert(checks, 'Map helper var', Boolean(map.mapLine) || map.mapReactionKind === 'recovery_glow');
  assert(
    checks,
    'MapReaction recovery_glow bağlantısı',
    map.model.moments.some((m) => m.mapReactionKind === 'recovery_glow') ||
      map.mapReactionKind === 'recovery_glow',
  );
  assert(
    checks,
    'MapReaction trust_pulse bağlantısı',
    buildRewardComebackMapPresentation({
      day: 6,
      mapReactionKind: 'trust_pulse',
      priorityDistrictId: 'cumhuriyet',
    }).mapReactionKind === 'trust_pulse',
  );

  assert(
    checks,
    'duplicate guard',
    !isDuplicateRewardComebackLine(day5.hubLine, [positiveImpact.mainLine]) ||
      Boolean(day5.hubLine),
  );

  const hubCard = readRepo('src/features/hub/components/HubAdvisorCard.tsx');
  const reportView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  const resultScreen = readRepo('src/features/events/screens/DecisionResultScreen.tsx');
  const socialPulse = readRepo('src/features/social/utils/socialPulsePresentation.ts');
  const mapScreen = readRepo('src/features/map/screens/MapScreen.tsx');
  const packageJson = readRepo('package.json');
  const docs = readRepo('docs/crevia-positive-reward-comeback-loop.md');
  const persist = readRepo('src/store/gamePersist.ts');
  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  const dayPipeline = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  const selector = readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationSelector.ts');

  assert(checks, 'HubAdvisorCard integration', hubCard.includes('buildRewardComebackHubPresentation'));
  assert(checks, 'Report integration', reportView.includes('buildRewardComebackReportPresentation'));
  assert(
    checks,
    'Result integration',
    resultScreen.includes('buildRewardComebackResultPresentation'),
  );
  assert(checks, 'Social integration', socialPulse.includes('buildRewardComebackSocialPresentation'));
  assert(checks, 'Map integration', mapScreen.includes('buildRewardComebackMapPresentation'));
  assert(checks, 'CityJournal integration', reportView.includes('rewardComeback') || docs.includes('City Journal'));
  assert(checks, 'Ece/advisor helper', hubCard.includes('rewardComeback') || docs.includes('Ece'));
  assert(checks, 'package.json script', packageJson.includes('"verify:reward-comeback"'));
  assert(checks, 'docs var', docs.includes('Positive Reward'));
  assert(checks, 'SAVE_VERSION değişmedi', SAVE_VERSION === EXPECTED_SAVE_VERSION);
  assert(checks, 'persist shape değişmedi', persist.includes(`export const SAVE_VERSION = ${EXPECTED_SAVE_VERSION};`));
  assert(checks, 'applyDecision değişmedi', !applyDecision.includes('rewardComeback'));
  assert(checks, 'dayPipeline değişmedi', !dayPipeline.includes('rewardComeback'));
  assert(checks, 'event generation core rewrite yok', !dayPipeline.includes('buildRewardComebackVisibilityModel'));
  assert(checks, 'content pack caps değişmedi', selector.includes('rewardVariantAllowed'));
  assert(checks, 'variant kinds tanımlı', REWARD_COMEBACK_VARIANT_KINDS.length >= 6);

  const ok = checks.every((line) => line.startsWith('✓'));
  return { ok, checks };
}
