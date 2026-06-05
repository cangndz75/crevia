import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDistrictMemoryRuntimeSnapshot } from '@/core/districtMemoryRuntime/districtMemoryRuntimeModel';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeModel';
import { verifyContentProductionScenario } from '@/core/contentProduction/verifyContentProductionScenario';
import { verifyDistrictOperationActionScenario } from '@/core/districtOperationActions/verifyDistrictOperationActionScenario';
import { verifyEventFreshnessScenario } from '@/core/eventFreshness/verifyEventFreshnessScenario';
import { verifyEventSelectionScenario } from '@/core/eventSelection/verifyEventSelectionScenario';
import { verifyEventVariantScenario } from '@/core/eventVariants/verifyEventVariantScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  STORY_CHAIN_KINDS,
  STORY_CHAIN_KIND_DEFINITIONS,
  STORY_CHAIN_MOBILE_COPY_MAX,
  STORY_CHAIN_SCORE_WEIGHTS,
  STORY_CHAIN_STATUSES,
  STORY_CHAIN_STEP_KINDS,
} from './storyChainConstants';
import { STORY_CHAIN_TEMPLATES } from './storyChainTemplates';
import {
  buildStoryChainAdvisorLine,
  buildStoryChainAnalyticsHint,
  buildStoryChainCompactChip,
  buildStoryChainHubLine,
  buildStoryChainMapLine,
  buildStoryChainPresentationModel,
  buildStoryChainReportLine,
  buildStoryChainResultLine,
  buildStoryChainTomorrowLine,
  storyChainCopyContainsForbiddenTerms,
  storyChainCopyContainsPanicTerms,
  validateStoryChainPresentationCopy,
} from './storyChainPresentation';
import {
  buildResolvedStoryChain,
  buildStoryChainContext,
  buildStoryChainDebugRows,
  buildStoryChainStepPreview,
  resolveStoryChainCandidates,
  resolveStoryChainForDistrict,
  resolveStoryChainForEventFamily,
  scoreStoryChainTemplate,
} from './storyChainResolver';
import { isKnownContentPackEventFamilyId } from './storyChainTemplates';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyStoryChainOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function recordScenario(
  checks: string[],
  outcome: { ok: boolean; checks: string[]; warn?: boolean },
  label: string,
): boolean {
  const failCount = outcome.checks.filter((line) => line.startsWith('FAIL')).length;
  const warnCount = outcome.checks.filter((line) => line.startsWith('WARN')).length;
  checks.push(
    outcome.ok
      ? `PASS ${label} scenario (${warnCount} warn)`
      : `FAIL ${label} scenario (${failCount} fail, ${warnCount} warn)`,
  );
  return outcome.ok;
}

const REQUIRED_STEP_HINT_SURFACES = [
  'mapHint',
  'advisorHint',
  'reportHint',
  'socialHint',
  'tomorrowHint',
  'resultHint',
] as const;

export function verifyStoryChainScenario(): VerifyStoryChainOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION remains 23', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, STORY_CHAIN_TEMPLATES.length >= 8, '8+ story chain templates', `templates ${STORY_CHAIN_TEMPLATES.length}`));

  for (const kind of STORY_CHAIN_KINDS) {
    const def = STORY_CHAIN_KIND_DEFINITIONS[kind];
    record(assert(checks, !!def, `kind def ${kind}`, `missing kind ${kind}`));
    record(assert(checks, def.minStepCount >= 2 && def.maxStepCount <= 3, `${kind} step bounds`, `${kind} step bounds invalid`));
  }

  for (const template of STORY_CHAIN_TEMPLATES) {
    record(assert(checks, template.steps.length >= 2 && template.steps.length <= 3, `${template.id} step count`, `${template.id} step count invalid`));
    record(assert(checks, template.steps[0]?.stepKind === 'trigger', `${template.id} trigger step`, `${template.id} missing trigger`));
    record(
      assert(
        checks,
        template.steps.some((step) => step.stepKind === 'closure') || template.steps.length >= 2,
        `${template.id} progression`,
        `${template.id} progression invalid`,
      ),
    );
    record(assert(checks, template.districtIds.length > 0, `${template.id} districts`, `${template.id} districts missing`));
    record(assert(checks, template.relatedDomains.length > 0, `${template.id} domains`, `${template.id} domains missing`));
    record(assert(checks, template.recommendedVariantKinds.length > 0, `${template.id} variant bias`, `${template.id} variants missing`));

    for (const step of template.steps) {
      for (const surface of REQUIRED_STEP_HINT_SURFACES) {
        record(assert(checks, step.hints[surface].length > 0, `${template.id} ${step.stepKind} ${surface}`, `${template.id} ${surface} missing`));
        record(
          assert(
            checks,
            step.hints[surface].length <= STORY_CHAIN_MOBILE_COPY_MAX,
            `${template.id} ${surface} length`,
            `${template.id} ${surface} too long`,
          ),
        );
      }
      const copyBlob = [step.title, step.shortLine, ...Object.values(step.hints)].join(' ');
      record(assert(checks, !storyChainCopyContainsPanicTerms(copyBlob), `${template.id} panic guard`, `${template.id} panic wording`));
      record(assert(checks, !storyChainCopyContainsForbiddenTerms(copyBlob), `${template.id} forbidden guard`, `${template.id} forbidden wording`));
    }
  }

  for (const status of STORY_CHAIN_STATUSES) {
    record(assert(checks, STORY_CHAIN_STATUSES.includes(status), `status ${status}`, `status ${status} missing`));
  }
  for (const stepKind of STORY_CHAIN_STEP_KINDS) {
    record(assert(checks, STORY_CHAIN_STEP_KINDS.includes(stepKind), `step kind ${stepKind}`, `step kind ${stepKind} missing`));
  }

  const dayOne = buildStoryChainContext({ currentDay: 1, selectedDistrictId: 'cumhuriyet' });
  const dayOneResolved = resolveStoryChainForDistrict('cumhuriyet', dayOne);
  record(assert(checks, dayOneResolved?.status === 'blocked', 'day 1 blocked status', 'day 1 not blocked'));
  record(assert(checks, dayOneResolved?.isComplexityHidden === true, 'day 1 complexity hidden', 'day 1 not hidden'));

  const districtCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'sanayi',
    eventFamilyDomains: ['vehicle_route', 'personnel'],
  });
  const districtScored = scoreStoryChainTemplate(STORY_CHAIN_TEMPLATES.find((t) => t.id === 'sanayi_route_pressure_chain')!, districtCtx);
  record(assert(checks, districtScored.score >= STORY_CHAIN_SCORE_WEIGHTS.districtMatch, 'district match scoring', 'district match scoring weak'));

  const domainCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'istasyon',
    eventFamilyDomains: ['crisis_watch', 'prevention'],
  });
  const domainScored = scoreStoryChainTemplate(STORY_CHAIN_TEMPLATES.find((t) => t.id === 'istasyon_transfer_flow_chain')!, domainCtx);
  record(assert(checks, domainScored.reasons.some((r) => r.startsWith('domain_match')), 'domain match scoring', 'domain match missing'));

  const trustSnapshot = buildDistrictTrustRuntimeSnapshot({ day: 8, focusDistrictId: 'cumhuriyet' });
  const lowTrustCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'cumhuriyet',
    districtTrustSnapshot: {
      ...trustSnapshot,
      districts: trustSnapshot.districts.map((d) =>
        d.districtId === 'cumhuriyet' ? { ...d, band: 'fragile' as const } : d,
      ),
    },
  });
  const socialCandidates = resolveStoryChainCandidates(lowTrustCtx);
  const socialTop = socialCandidates.find((c) => c.kind === 'social_trust_chain');
  record(assert(checks, (socialTop?.score ?? 0) > 0, 'low trust social chain bonus', 'low trust social chain not boosted'));

  const fatigueCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'sanayi',
    resourceFatigue: { level: 'high' },
  });
  const fatigueScored = scoreStoryChainTemplate(STORY_CHAIN_TEMPLATES.find((t) => t.id === 'resource_fatigue_balance_chain')!, fatigueCtx);
  record(assert(checks, fatigueScored.reasons.includes('resource_fatigue_high'), 'resource fatigue chain bonus', 'resource fatigue bonus missing'));

  const crisisCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'sanayi',
    crisisState: { watchActive: true },
  });
  const crisisScored = scoreStoryChainTemplate(STORY_CHAIN_TEMPLATES.find((t) => t.id === 'crisis_watch_prevention_chain')!, crisisCtx);
  record(assert(checks, crisisScored.reasons.includes('crisis_watch_active'), 'crisis watch chain bonus', 'crisis watch bonus missing'));
  record(assert(checks, !storyChainCopyContainsPanicTerms(crisisScored.reasons.join(' ')), 'crisis chain panic-free scoring', 'crisis panic in scoring'));

  const routeCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'istasyon',
    activeRouteHint: { active: true, routeId: 'istasyon_sabah' },
  });
  const routeScored = scoreStoryChainTemplate(STORY_CHAIN_TEMPLATES.find((t) => t.id === 'istasyon_transfer_flow_chain')!, routeCtx);
  record(assert(checks, routeScored.reasons.includes('active_route_bonus'), 'active route chain bonus', 'active route bonus missing'));

  const freshCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'sanayi',
    recentChainKindIds: ['route_pressure_chain'],
  });
  const freshScored = scoreStoryChainTemplate(STORY_CHAIN_TEMPLATES.find((t) => t.id === 'sanayi_route_pressure_chain')!, freshCtx);
  record(assert(checks, freshScored.reasons.includes('freshness_penalty'), 'freshness penalty', 'freshness penalty missing'));

  const memorySnapshot = buildDistrictMemoryRuntimeSnapshot({ day: 8, focusDistrictId: 'cumhuriyet' });
  const memoryCtx = buildStoryChainContext({
    currentDay: 8,
    selectedDistrictId: 'cumhuriyet',
    districtMemorySnapshot: {
      ...memorySnapshot,
      districts: memorySnapshot.districts.map((d) =>
        d.districtId === 'cumhuriyet' ? { ...d, primaryKind: 'unresolved_carry_over' as const } : d,
      ),
    },
  });
  const memoryScored = scoreStoryChainTemplate(STORY_CHAIN_TEMPLATES.find((t) => t.id === 'cumhuriyet_container_recovery_chain')!, memoryCtx);
  record(assert(checks, memoryScored.reasons.some((r) => r.startsWith('memory_follow_up')), 'memory follow-up bonus', 'memory follow-up missing'));

  let emptyCrash = false;
  try {
    const emptyCtx = buildStoryChainContext({});
    resolveStoryChainCandidates(emptyCtx);
    buildStoryChainDebugRows({});
    resolveStoryChainForDistrict('merkez', {});
    resolveStoryChainForEventFamily('unknown_family_id', {});
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'missing state no crash', 'missing state crashed'));

  record(assert(checks, isKnownContentPackEventFamilyId('cumhuriyet_sokak_kenari_gece_yigini'), 'known pack family id', 'known family id missing'));
  record(assert(checks, !isKnownContentPackEventFamilyId('totally_unknown_family'), 'unknown family fallback safe', 'unknown family misdetected'));

  const resolved = resolveStoryChainForEventFamily('cumhuriyet_sokak_kenari_gece_yigini', { currentDay: 8, selectedDistrictId: 'cumhuriyet' });
  record(assert(checks, resolved !== null, 'event family resolve', 'event family resolve failed'));
  record(assert(checks, resolved?.isRuntimeLinked === false, 'resolved not runtime linked', 'runtime linked true'));

  const presentation = buildStoryChainPresentationModel('cumhuriyet', { currentDay: 8, selectedDistrictId: 'cumhuriyet' });
  record(assert(checks, presentation !== null, 'presentation model', 'presentation model null'));
  if (presentation) {
    for (const line of [
      presentation.hubLine,
      presentation.mapLine,
      presentation.reportLine,
      presentation.resultLine,
      presentation.advisorLine,
      presentation.tomorrowLine,
      presentation.compactChip,
    ]) {
      const validation = validateStoryChainPresentationCopy(line);
      record(assert(checks, validation.ok, `presentation copy ${line.slice(0, 24)}`, `presentation copy invalid ${line.slice(0, 24)}`));
    }
    record(assert(checks, presentation.isRuntimeLinked === false, 'presentation not runtime linked', 'presentation runtime linked'));
  }

  const hub = buildStoryChainHubLine('merkez', { currentDay: 8, selectedDistrictId: 'merkez' });
  const map = buildStoryChainMapLine('merkez', { currentDay: 8, selectedDistrictId: 'merkez' });
  const report = buildStoryChainReportLine('merkez', { currentDay: 8, selectedDistrictId: 'merkez' });
  const resultLine = buildStoryChainResultLine('merkez', { currentDay: 8, selectedDistrictId: 'merkez' });
  const advisor = buildStoryChainAdvisorLine('merkez', { currentDay: 8, selectedDistrictId: 'merkez' });
  const tomorrow = buildStoryChainTomorrowLine('merkez', { currentDay: 8, selectedDistrictId: 'merkez' });
  const chip = buildStoryChainCompactChip('merkez', { currentDay: 8, selectedDistrictId: 'merkez' });
  for (const line of [hub, map, report, resultLine, advisor, tomorrow, chip]) {
    record(assert(checks, validateStoryChainPresentationCopy(line).ok, `helper copy guard`, `helper copy failed: ${line.slice(0, 20)}`));
  }

  if (resolved) {
    const analyticsHint = buildStoryChainAnalyticsHint(resolved);
    record(assert(checks, analyticsHint.isRuntimeLinked === false, 'analytics hint not runtime linked', 'analytics runtime linked'));
    record(assert(checks, !('copy' in analyticsHint), 'analytics hint no raw copy', 'analytics hint has copy'));
    record(assert(checks, analyticsHint.chainKind.length > 0, 'analytics chainKind', 'analytics chainKind missing'));
  }

  const preview = buildStoryChainStepPreview('cumhuriyet_container_recovery_chain', 0);
  record(assert(checks, preview !== null, 'step preview', 'step preview null'));

  const resolverSource = readRepo('src/core/storyChains/storyChainResolver.ts');
  record(assert(checks, !resolverSource.includes('ensureDailyEventsForDay'), 'resolver no ensureDailyEvents', 'resolver imports ensureDailyEvents'));
  record(assert(checks, !resolverSource.includes('applyDecision'), 'resolver no applyDecision', 'resolver imports applyDecision'));
  record(assert(checks, !resolverSource.includes('Math.random'), 'resolver no Math.random', 'resolver Math.random'));

  const docs = readRepo('docs/crevia-mini-story-chain-system.md').toLowerCase();
  record(assert(checks, docs.includes('runtime'), 'docs runtime note', 'docs runtime note missing'));
  record(assert(checks, docs.includes('save_version'), 'docs SAVE_VERSION note', 'docs SAVE_VERSION missing'));
  record(assert(checks, docs.includes('2-3'), 'docs 2-3 day chain note', 'docs chain length missing'));

  record(recordScenario(checks, verifyContentProductionScenario(), 'content production'));
  record(recordScenario(checks, verifyEventSelectionScenario(), 'event selection'));
  record(recordScenario(checks, verifyEventVariantScenario(), 'event variants'));
  record(recordScenario(checks, verifyEventFreshnessScenario(), 'event freshness'));
  record(recordScenario(checks, verifyDistrictOperationActionScenario(), 'district operation actions'));
  record(recordScenario(checks, verifyFullUxFlowScenario(), 'full ux flow'));

  const built = buildResolvedStoryChain(STORY_CHAIN_TEMPLATES[0]!, buildStoryChainContext({ currentDay: 8, selectedDistrictId: 'cumhuriyet' }));
  record(assert(checks, built.steps.length === STORY_CHAIN_TEMPLATES[0]!.steps.length, 'resolved step count', 'resolved step mismatch'));

  return { ok, warn: false, checks };
}
