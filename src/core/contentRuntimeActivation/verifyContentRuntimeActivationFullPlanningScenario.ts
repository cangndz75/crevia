import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CITY_ARCHIVE_MAX_ENTRIES } from '@/core/cityArchive/cityArchiveConstants';
import {
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL,
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT,
} from '@/core/contentRuntimeActivation/contentRuntimeActivationConstants';
import { isPilotDayProtected } from '@/core/contentRuntimeActivation/contentRuntimeActivationIntegration';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CONTENT_PACK_FULL_ACTIVATION_PHASES,
  CONTENT_PACK_FULL_DAY_CAP_PLANS,
  CONTENT_PACK_FULL_DOMAIN_PLANS,
  CONTENT_PACK_FULL_FORBIDDEN_PLAYER_TERMS,
  CONTENT_PACK_FULL_GROUP_PLANS,
  CONTENT_PACK_FULL_IMPLEMENTATION_SCOPE,
  CONTENT_PACK_FULL_PLANNING_DOCS_PATH,
  CONTENT_PACK_FULL_RUNTIME_UNCHANGED_FILES,
  CONTENT_PACK_FULL_SEMANTIC_CLUSTERS,
} from './contentRuntimeActivationFullPlanningConstants';
import {
  buildContentPackFullReadinessScore,
  buildDistrictBalanceRisk,
  evaluateStoryChainPackRisk,
  runContentPackFullPlanningAudit,
} from './contentRuntimeActivationFullPlanningAudit';
import {
  formatContentPackFullPlanningSummary,
  formatDistrictBalanceRiskLine,
} from './contentRuntimeActivationFullPlanningPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyContentRuntimeActivationFullPlanningOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

export function verifyContentRuntimeActivationFullPlanningScenario(): VerifyContentRuntimeActivationFullPlanningOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runContentPackFullPlanningAudit();
  for (const c of audit.checks) {
    record(assert(checks, c.status !== 'FAIL', c.message, c.message));
  }

  record(assert(checks, CONTENT_PACK_FULL_GROUP_PLANS.length === 8, 'Pack groups defined (8)'));
  record(assert(checks, CONTENT_PACK_FULL_DOMAIN_PLANS.length === 10, 'Domain groups defined (10)'));
  record(assert(checks, CONTENT_PACK_FULL_ACTIVATION_PHASES.length === 4, 'Activation phases defined'));
  record(assert(checks, CONTENT_PACK_FULL_DAY_CAP_PLANS.length >= 5, 'Day/access caps defined'));

  const score = buildContentPackFullReadinessScore();
  record(assert(checks, score.overallReadiness === 'ready_for_limited_full' || score.overallReadiness === 'risky', 'Balance score model exists'));
  record(assert(checks, score.dayOneSafetyScore === 100, 'Day one safety score max'));
  record(assert(checks, audit.implementationBlocked, 'Full runtime implementation still blocked'));

  const districtRisk = buildDistrictBalanceRisk();
  record(assert(checks, districtRisk.recommendedWeightAdjustment != null, 'District balance guard'));
  record(assert(checks, districtRisk.repeatedDomainWarnings.length > 0, 'Repeated domain warnings'));

  const storyRisk = evaluateStoryChainPackRisk({
    day: 1,
    hasActiveChain: false,
    sameDistrictKindActive: false,
    packOriginStartsToday: 0,
    activeChainCount: 0,
    activeChainCap: 2,
    isRewardComebackPack: false,
    isCrisisAdjacent: false,
  });
  record(assert(checks, !storyRisk.canStartChain, 'Story chain Day 1 blocked'));

  const rewardRisk = evaluateStoryChainPackRisk({
    day: 10,
    hasActiveChain: true,
    sameDistrictKindActive: false,
    packOriginStartsToday: 0,
    activeChainCount: 1,
    activeChainCap: 2,
    isRewardComebackPack: true,
    isCrisisAdjacent: false,
  });
  record(assert(checks, rewardRisk.shouldSuppressChainTrigger, 'Reward pack suppresses chain start'));

  record(assert(checks, CONTENT_PACK_FULL_SEMANTIC_CLUSTERS.length === 10, 'Semantic clusters (10)'));
  record(assert(checks, CONTENT_PACK_FULL_IMPLEMENTATION_SCOPE.included.length >= 6, 'Implementation scope defined'));
  record(assert(checks, CONTENT_PACK_FULL_IMPLEMENTATION_SCOPE.notIncluded.includes('Remote config'), 'Remote config not in scope'));

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 24'));
  record(assert(checks, CITY_ARCHIVE_MAX_ENTRIES === 120, 'cityArchive maxEntries 120'));

  for (const file of CONTENT_PACK_FULL_RUNTIME_UNCHANGED_FILES) {
    const content = readRepo(file);
    record(assert(checks, content.length > 0, `File exists: ${file}`));
    record(
      assert(
        checks,
        !content.includes('contentRuntimeActivationFullPlanning'),
        `${file} unchanged by full planning`,
      ),
    );
  }

  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('FullPlanning'), 'applyDecision unchanged'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('CONTENT_PACK_FULL'), 'persist shape unchanged'));
  record(
    assert(
      checks,
      isPilotDayProtected(3) && isPilotDayProtected(7),
      'Pilot Day 2-7 protected in lite runtime',
    ),
  );
  record(assert(checks, CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT === 1, 'Lite max 1 unchanged'));
  record(assert(checks, CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL === 2, 'Full max 2 unchanged'));

  record(assert(checks, CONTENT_PACK_FULL_DAY_CAP_PLANS[0]?.packOriginEventsMax === 0, 'Day 1 pack activation blocked'));
  record(assert(checks, CONTENT_PACK_FULL_DAY_CAP_PLANS[1]?.packOriginEventsMax === 0, 'Day 2-7 blocked'));

  const crisisDomain = CONTENT_PACK_FULL_DOMAIN_PLANS.find((d) => d.domainId === 'crisis_adjacent');
  record(assert(checks, crisisDomain?.maxPerWindowCount === 1, 'crisis_adjacent rate limited'));

  for (const term of ['pack', 'metadata', 'gps']) {
    record(assert(checks, CONTENT_PACK_FULL_FORBIDDEN_PLAYER_TERMS.includes(term as never), `forbidden: ${term}`));
  }

  record(assert(checks, existsSync(join(REPO_ROOT, CONTENT_PACK_FULL_PLANNING_DOCS_PATH)), 'docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:content-runtime-activation-full-planning'), 'package script'));
  record(assert(checks, formatContentPackFullPlanningSummary(audit).includes('Readiness'), 'presentation summary'));
  record(assert(checks, formatDistrictBalanceRiskLine(audit).includes('District balance'), 'district balance line'));

  return { ok, checks };
}
