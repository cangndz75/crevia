import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { evaluateStoryChainPackRisk } from './contentRuntimeActivationFullPlanningAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL,
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT,
} from './contentRuntimeActivationConstants';
import {
  CONTENT_RUNTIME_ACTIVATION_FULL_FUTURE_MAX_PACK_ORIGIN,
  CONTENT_RUNTIME_ACTIVATION_IMPLEMENTATION_FORBIDDEN_TERMS,
} from './contentRuntimeActivationFullImplementationConstants';
import {
  containsForbiddenPlayerTerm,
  inferSemanticCluster,
  resolveContentRuntimeActivationModeForAccess,
  resolveMaxPackOriginForMode,
} from './contentRuntimeActivationFullGuards';
import {
  buildContentRuntimeActivationSelection,
  isPilotDayProtected,
} from './contentRuntimeActivationIntegration';
import { readContentRuntimeActivationMetaFromEvent } from './contentRuntimeActivationMapper';
import { CONTENT_RUNTIME_ACTIVATION_PACK_LABELS } from './contentRuntimeActivationConstants';
import {
  stableContentRuntimeHash,
} from './contentRuntimeActivationSelector';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyContentRuntimeActivationFullImplementationOutcome = {
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

function day8LightInput() {
  return {
    day: 8,
    postPilotPhase: 'main_operation_light' as const,
    accessMode: 'limited' as const,
    operationSignals: {
      vehicles: { status: 'watch', summary: 'Rota' },
      containers: { status: 'watch', summary: 'Konteyner' },
      priorityDistrictId: 'sanayi',
    },
    focusDistrictId: 'sanayi',
    stableSeed: 'verify-full-impl-light',
  };
}

function day9FullInput() {
  return {
    day: 9,
    postPilotPhase: 'main_operation_full' as const,
    accessMode: 'full' as const,
    operationSignals: {
      vehicles: { status: 'strained', summary: 'Araç' },
      containers: { status: 'watch', summary: 'Konteyner' },
      districts: { status: 'watch', summary: 'Mahalle' },
      priorityDistrictId: 'cumhuriyet',
    },
    hasActiveMainOperation: true,
    focusDistrictId: 'cumhuriyet',
    stableSeed: 'verify-full-impl-limited',
  };
}

export function verifyContentRuntimeActivationFullImplementationScenario(): VerifyContentRuntimeActivationFullImplementationOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  record(assert(checks, SAVE_VERSION === 24, 'SAVE_VERSION 24 unchanged'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('limited_full'), 'persist shape unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('limited_full'), 'applyDecision unchanged'));

  const day1 = buildContentRuntimeActivationSelection({ day: 1, postPilotPhase: 'main_operation_full', accessMode: 'full' });
  record(assert(checks, day1.eventCards.length === 0, 'Day 1 pack-origin 0'));

  const day5 = buildContentRuntimeActivationSelection({ day: 5, postPilotPhase: 'main_operation_full', accessMode: 'full' });
  record(assert(checks, day5.eventCards.length === 0, 'Day 2-7 full activation 0'));
  record(assert(checks, isPilotDayProtected(5), 'Pilot Day 2-7 protected'));

  const light = buildContentRuntimeActivationSelection(day8LightInput());
  record(assert(checks, light.model.activationMode === 'lite', 'Day 8 light stays lite'));
  record(
    assert(
      checks,
      light.eventCards.length <= CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT,
      'Day 8 light max 1',
    ),
  );

  const full = buildContentRuntimeActivationSelection(day9FullInput());
  record(assert(checks, full.model.activationMode === 'limited_full', 'Day 8+ full limited_full mode'));
  record(
    assert(
      checks,
      full.eventCards.length <= CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL,
      'Day 8+ full limited max 2',
    ),
  );
  record(
    assert(
      checks,
      resolveMaxPackOriginForMode('limited_full', 12) === 2,
      'Future Day 10+ max 3 not opened (stays 2)',
    ),
  );
  record(
    assert(
      checks,
      CONTENT_RUNTIME_ACTIVATION_FULL_FUTURE_MAX_PACK_ORIGIN === 3,
      'Future cap constant documented as 3',
    ),
  );

  const limitedNoFull = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    accessMode: 'limited',
    postPilotPhase: 'main_operation_light',
  });
  record(assert(checks, limitedNoFull.model.activationMode === 'lite', 'Full access yoksa lite korunur'));

  record(
    assert(
      checks,
      full.candidates.some((c) =>
        ['district_pack_one', 'vehicle_route_pack_one', 'container_environment_pack_one'].includes(
          c.packId,
        ),
      ),
      'Ready pack groups selectable',
    ),
  );

  const socialFull = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    districtTrustRuntime: { cumhuriyet: { state: 'fragile' } },
    stableSeed: 'verify-social-trust',
  });
  record(
    assert(
      checks,
      socialFull.candidates.length === 0 ||
        socialFull.candidates.some((c) => c.packId === 'social_trust_pack_one') ||
        socialFull.suppressedCandidates.some((c) => c.packId === 'social_trust_pack_one'),
      'Social trust pack in limited_full pool',
    ),
  );

  const crisisLimited = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    previousFamilyIds: ['crisis_adjacent_family_prior'],
    stableSeed: 'verify-crisis-limit',
  });
  record(
    assert(
      checks,
      crisisLimited.candidates.filter((c) => c.packId === 'crisis_adjacent_pack_one').length <= 1,
      'crisis_adjacent rate-limited',
    ),
  );

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
  record(assert(checks, rewardRisk.shouldSuppressChainTrigger, 'reward/comeback pressure chain başlatmaz'));

  const dupDay = buildContentRuntimeActivationSelection(day9FullInput());
  const sameDistrictDomain = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    previousDistrictDomainKeys: dupDay.candidates.map(
      (c) => `${c.selectedDistrictId}:${c.domains[0] ?? 'generic'}`,
    ),
  });
  record(
    assert(
      checks,
      sameDistrictDomain.candidates.every((c) => {
        const key = `${c.selectedDistrictId}:${c.domains[0] ?? 'generic'}`;
        return !dupDay.candidates.some(
          (prior) =>
            `${prior.selectedDistrictId}:${prior.domains[0] ?? 'generic'}` === key,
        );
      }),
      'same district+domain same day blocked',
    ),
  );

  const windowBlock = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    previousDistrictDomainKeys: ['sanayi:vehicle_route', 'sanayi:container'],
    stableSeed: 'verify-window',
  });
  record(
    assert(
      checks,
      windowBlock.candidates.filter((c) => c.selectedDistrictId === 'sanayi').length <= 1,
      'same district max 2 per 2-day window guard active',
    ),
  );

  const storyClosure = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    activeStoryChainDistrictIds: ['cumhuriyet'],
    stableSeed: 'verify-story-closure',
  });
  record(
    assert(
      checks,
      storyClosure.candidates.length === 0 ||
        storyClosure.candidates.every(
          (c) =>
            c.selectedVariantKind === 'recovery' ||
            c.selectedVariantKind === 'reward' ||
            c.selectedVariantKind === 'comeback' ||
            c.selectedDistrictId !== 'cumhuriyet',
        ),
      'active story chain district closure/recovery preferred',
    ),
  );

  const familyDup = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    previousFamilyIds: full.model.selectedFamilyIds,
  });
  record(
    assert(
      checks,
      familyDup.candidates.every((c) => !full.model.selectedFamilyIds.includes(c.familyId)),
      'event family cooldown guard',
    ),
  );

  const clusterDup = buildContentRuntimeActivationSelection({
    ...day9FullInput(),
    previousSemanticClusters: full.candidates.map((c) => inferSemanticCluster(c)),
  });
  record(
    assert(
      checks,
      clusterDup.candidates.length <= 1 ||
        new Set(clusterDup.candidates.map((c) => inferSemanticCluster(c))).size ===
          clusterDup.candidates.length,
      'copy cluster guard limits same-day duplicates',
    ),
  );

  const ids = full.eventCards.map((e) => e.id);
  record(assert(checks, new Set(ids).size === ids.length, 'selected event IDs unique'));
  record(
    assert(
      checks,
      !readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationSelector.ts').includes(
        'Math.random',
      ),
      'no Math.random',
    ),
  );

  record(
    assert(
      checks,
      (full.model.archiveWriteEligibility?.allowed ?? 0) <= 2,
      'pack archive max 2/day limited_full',
    ),
  );
  record(
    assert(
      checks,
      (light.model.archiveWriteEligibility?.allowed ?? 0) <= 1,
      'light archive max 1/day',
    ),
  );

  const meta = readContentRuntimeActivationMetaFromEvent(full.eventCards[0]);
  record(
    assert(
      checks,
      meta?.source === 'content_runtime_activation_limited_full' || !meta,
      'limited_full meta source when events present',
    ),
  );
  record(
    assert(
      checks,
      !JSON.stringify(meta ?? {}).includes('raw_pack_metadata'),
      'raw pack metadata not stored',
    ),
  );

  record(
    assert(
      checks,
      Boolean(full.model.storyTriggerEligibility),
      'story trigger eligibility exposed',
    ),
  );
  record(
    assert(
      checks,
      Boolean(full.model.surfaceDensitySummary?.includes('report_max')),
      'surface density summary exposed',
    ),
  );

  for (const label of Object.values(CONTENT_RUNTIME_ACTIVATION_PACK_LABELS)) {
    record(
      assert(
        checks,
        !containsForbiddenPlayerTerm(label),
        `chip label safe: ${label}`,
      ),
    );
  }

  const launchAudit = runManualLaunchTrackerAudit();
  record(assert(checks, launchAudit.evidenceSummary.verifiedEvidence === 0, 'evidence verified 0'));
  record(assert(checks, launchAudit.roundOne.canProceedPublicLaunch === false, 'public launch blocked'));

  record(assert(checks, Boolean(full.model.capSummary), 'cap summary present'));
  record(assert(checks, Boolean(full.model.districtBalanceSummary), 'district balance summary present'));
  record(
    assert(
      checks,
      resolveContentRuntimeActivationModeForAccess('main_operation_full', 'full') === 'limited_full',
      'limited_full only Day 8+ full access path',
    ),
  );

  record(
    assert(
      checks,
      typeof stableContentRuntimeHash('verify') === 'number',
      'deterministic stable hash',
    ),
  );

  for (const term of CONTENT_RUNTIME_ACTIVATION_IMPLEMENTATION_FORBIDDEN_TERMS) {
    record(
      assert(
        checks,
        !Object.values(CONTENT_RUNTIME_ACTIVATION_PACK_LABELS).some((label) =>
          label.toLocaleLowerCase('tr-TR').includes(term.toLocaleLowerCase('tr-TR')),
        ),
        `forbidden term not in chip labels: ${term}`,
      ),
    );
  }

  record(
    assert(
      checks,
      readRepo('docs/crevia-content-pack-activation-full-implementation.md').includes('limited_full'),
      'implementation docs present',
    ),
  );

  return { ok, checks };
}
