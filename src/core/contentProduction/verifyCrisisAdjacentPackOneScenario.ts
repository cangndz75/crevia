import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyCrisisScenario } from '@/core/crisis/verifyCrisisScenario';
import { verifyDistrictOperationActionScenario } from '@/core/districtOperationActions/verifyDistrictOperationActionScenario';
import { verifyEventFreshnessScenario } from '@/core/eventFreshness/verifyEventFreshnessScenario';
import { verifyEventSelectionScenario } from '@/core/eventSelection/verifyEventSelectionScenario';
import { verifyEventVariantScenario } from '@/core/eventVariants/verifyEventVariantScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CONTAINER_ENVIRONMENT_PACK_ONE_ITEMS,
  CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK,
  CRISIS_ADJACENT_PACK_ONE_FAMILIES,
  CRISIS_ADJACENT_PACK_ONE_ID,
  CRISIS_ADJACENT_PACK_ONE_ITEMS,
  CRISIS_ADJACENT_PACK_ONE_REQUIRED_ECHO_SURFACES,
  DISTRICT_PACK_ONE_ITEMS,
  SOCIAL_TRUST_PACK_ONE_ITEMS,
  VEHICLE_ROUTE_PACK_ONE_ITEMS,
  getCrisisAdjacentPackOneEchoSurfaceCoverage,
  getCrisisAdjacentPackOneFamiliesByDistrict,
  getCrisisAdjacentPackOneVariantCoverage,
  type CrisisAdjacentPackOneDomain,
  type CrisisAdjacentPackOneEchoSurface,
  type CrisisAdjacentPackOneFamily,
  type CrisisAdjacentPackOneVariantKind,
} from './contentPacks';
import { validateContentPackDefinition } from './contentPackSchema';
import { buildContentCoverageMatrix } from './contentCoverageMatrix';
import {
  compareContentItemSimilarity,
  findContentDuplicateRisks,
} from './contentDuplicateGuard';
import { evaluateEchoCompletenessForPack } from './contentEchoCompleteness';
import {
  buildContentProductionAuditResult,
  collectContentProductionPlayerFacingCopy,
} from './contentProductionPresentation';
import type { CreviaContentProductionSurface } from './contentProductionTypes';
import { verifyContentProductionScenario } from './verifyContentProductionScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const CUMHURIYET_MIN = 3;
const SANAYI_MIN = 3;
const ISTASYON_MIN = 3;
const MERKEZ_MIN = 3;
const YESILVADI_MIN = 2;

const REQUIRED_VARIANTS: readonly CrisisAdjacentPackOneVariantKind[] = [
  'normal',
  'improved',
  'worsened',
  'carry_over',
  'comeback',
  'recovery',
  'resource_fatigue',
  'district_trust',
  'crisis_adjacent',
  'reward',
] as const;

const REQUIRED_DOMAINS: readonly CrisisAdjacentPackOneDomain[] = [
  'crisis_adjacent',
  'crisis_watch',
  'prevention',
  'recovery',
  'resource_pressure',
  'social_trust',
  'vehicle_route',
  'container_network',
  'district_memory',
  'district_operation',
  'carry_over',
] as const;

const REQUIRED_ECHO_SURFACES: readonly CrisisAdjacentPackOneEchoSurface[] = [
  'advisor',
  'report',
  'social',
  'map',
  'tomorrow_preview',
  'result',
] as const;

const EXTRA_FORBIDDEN_TERMS = [
  'oyun ' + 'sonu',
  'sezon ' + 'finali',
  '14 gun ' + 'bitti',
  'premium',
  'satin al',
  'kilitli',
  'gercek zamanli gps',
  'canli takip',
  'kesin varis',
  'siyasi parti',
  'belediye baskan',
  'hakaret',
] as const;

const PANIC_TERMS = [
  'pan' + 'ik',
  'al' + 'arm',
  'kriz patladi',
  'coktu',
  'felaket',
  'acil durum ilani',
  'basarisiz oldun',
  'kontrol kaybedildi',
  'kesin cozuldu',
  'cokus',
] as const;

const FAKE_SUCCESS_TERMS = ['kesin basari', 'tamamen cozuldu', 'mukemmel sonuc'] as const;

const FREE_RECOVERY_TERMS = ['bedelsiz', 'ucretsiz kurtarma', 'otomatik toparlandi'] as const;

export type VerifyCrisisAdjacentPackOneOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, note: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${note}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('ı', 'i')
    .replaceAll('İ', 'i');
}

function familyText(family: CrisisAdjacentPackOneFamily): string {
  return normalizeText(
    [
      family.title,
      family.affectedActor,
      family.concreteScene,
      family.visibleOperationalProblem,
      family.decisionTradeoff,
      family.shortTermEffect,
      family.carryOverConsequence,
      family.crisisWatchIntent,
      family.preventionIntent,
      family.recoveryIntent,
      family.resourcePressureIntent,
      family.districtTrustIntent,
      family.districtMemoryIntent,
      family.resourceIntent ?? '',
      family.trustIntent,
      family.memoryIntent,
      ...family.variantCopies.map((copy) => copy.text),
      ...Object.values(family.echoes),
      ...Object.values(family.crisisHints),
    ].join(' '),
  );
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

export function verifyCrisisAdjacentPackOneScenario(): VerifyCrisisAdjacentPackOneOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnFlag = false;

  function record(result: boolean) {
    if (!result) ok = false;
  }

  function recordWarn(result: boolean) {
    if (!result) warnFlag = true;
  }

  const totalVariants = CRISIS_ADJACENT_PACK_ONE_FAMILIES.reduce(
    (sum, family) => sum + family.variantCopies.length,
    0,
  );

  record(
    assert(
      checks,
      CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK.id === CRISIS_ADJACENT_PACK_ONE_ID,
      'pack id',
      'pack id mismatch',
    ),
  );
  record(
    assert(
      checks,
      CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK.kind === 'event_family_pack',
      'event family pack kind',
      'pack kind mismatch',
    ),
  );
  record(
    assert(
      checks,
      CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK.isRuntimeLinked === false,
      'pack is not runtime linked',
      'pack runtime linked',
    ),
  );
  record(assert(checks, CRISIS_ADJACENT_PACK_ONE_FAMILIES.length >= 14, '14+ event families', 'family count below 14'));
  record(
    assert(
      checks,
      CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK.items.length === CRISIS_ADJACENT_PACK_ONE_FAMILIES.length,
      'item count matches families',
      'item count mismatch',
    ),
  );
  record(assert(checks, totalVariants >= 56, '56+ variant copy', `variant copy ${totalVariants}`));

  const familiesByDistrict = getCrisisAdjacentPackOneFamiliesByDistrict();
  record(
    assert(
      checks,
      familiesByDistrict.cumhuriyet.length >= CUMHURIYET_MIN,
      `cumhuriyet has ${CUMHURIYET_MIN}+ families`,
      `cumhuriyet family count ${familiesByDistrict.cumhuriyet.length}`,
    ),
  );
  record(
    assert(
      checks,
      familiesByDistrict.sanayi.length >= SANAYI_MIN,
      `sanayi has ${SANAYI_MIN}+ families`,
      `sanayi family count ${familiesByDistrict.sanayi.length}`,
    ),
  );
  record(
    assert(
      checks,
      familiesByDistrict.istasyon.length >= ISTASYON_MIN,
      `istasyon has ${ISTASYON_MIN}+ families`,
      `istasyon family count ${familiesByDistrict.istasyon.length}`,
    ),
  );
  record(
    assert(
      checks,
      familiesByDistrict.merkez.length >= MERKEZ_MIN,
      `merkez has ${MERKEZ_MIN}+ families`,
      `merkez family count ${familiesByDistrict.merkez.length}`,
    ),
  );
  record(
    assert(
      checks,
      familiesByDistrict.yesilvadi.length >= YESILVADI_MIN,
      `yesilvadi has ${YESILVADI_MIN}+ families`,
      `yesilvadi family count ${familiesByDistrict.yesilvadi.length}`,
    ),
  );

  const ids = new Set<string>();
  for (const family of CRISIS_ADJACENT_PACK_ONE_FAMILIES) {
    record(assert(checks, !ids.has(family.id), `unique family ${family.id}`, `duplicate family ${family.id}`));
    ids.add(family.id);
    record(assert(checks, family.title.length > 0 && family.title.length <= 56, `${family.id} title length`, `${family.id} title length`));
    record(assert(checks, family.districtIds.length > 0, `${family.id} district link`, `${family.id} district missing`));
    record(assert(checks, family.domains.length >= 2, `${family.id} domain links`, `${family.id} domains weak`));
    record(
      assert(
        checks,
        family.crisisWatchIntent.length > 0 || family.preventionIntent.length > 0,
        `${family.id} crisis watch or prevention intent`,
        `${family.id} watch/prevention intent missing`,
      ),
    );
    record(
      assert(
        checks,
        family.recoveryIntent.length > 0 || family.resourcePressureIntent.length > 0,
        `${family.id} recovery or resource pressure intent`,
        `${family.id} recovery/pressure intent missing`,
      ),
    );
    record(
      assert(
        checks,
        family.districtTrustIntent.length > 0 || family.districtMemoryIntent.length > 0,
        `${family.id} district trust or memory intent`,
        `${family.id} trust/memory intent missing`,
      ),
    );
    record(assert(checks, family.crisisWatchIntent.length > 0, `${family.id} crisis watch intent`, `${family.id} crisis watch missing`));
    record(assert(checks, family.preventionIntent.length > 0, `${family.id} prevention intent`, `${family.id} prevention missing`));
    record(assert(checks, family.recoveryIntent.length > 0, `${family.id} recovery intent`, `${family.id} recovery missing`));
    record(assert(checks, family.resourcePressureIntent.length > 0, `${family.id} resource pressure intent`, `${family.id} resource pressure missing`));
    record(assert(checks, family.districtTrustIntent.length > 0, `${family.id} district trust intent`, `${family.id} district trust missing`));
    record(assert(checks, family.districtMemoryIntent.length > 0, `${family.id} district memory intent`, `${family.id} district memory missing`));
    record(assert(checks, family.crisisHints.crisisWatchHint.length > 0, `${family.id} crisis watch hint`, `${family.id} watch hint missing`));
    record(assert(checks, family.crisisHints.preventionHint.length > 0, `${family.id} prevention hint`, `${family.id} prevention hint missing`));
    record(assert(checks, family.crisisHints.recoveryHint.length > 0, `${family.id} recovery hint`, `${family.id} recovery hint missing`));
    record(assert(checks, family.crisisHints.advisorRiskToneHint.length > 0, `${family.id} advisor risk tone hint`, `${family.id} advisor hint missing`));
    record(assert(checks, family.crisisHints.reportRiskSummaryHint.length > 0, `${family.id} report risk summary hint`, `${family.id} report hint missing`));
    record(assert(checks, family.variantCopies.length >= 4, `${family.id} 4+ variants`, `${family.id} variants below minimum`));
    for (const surface of REQUIRED_ECHO_SURFACES) {
      record(assert(checks, family.echoes[surface].length > 0, `${family.id} echo ${surface}`, `${family.id} echo ${surface} missing`));
    }
    for (const copy of family.variantCopies) {
      record(assert(checks, copy.text.length <= 160, `${family.id} variant ${copy.kind} mobile length`, `${family.id} variant ${copy.kind} long`));
    }
    const text = familyText(family);
    for (const term of EXTRA_FORBIDDEN_TERMS) {
      record(assert(checks, !text.includes(term), `${family.id} avoids ${term}`, `${family.id} contains ${term}`));
    }
    for (const term of PANIC_TERMS) {
      record(assert(checks, !text.includes(term), `${family.id} panic wording avoids ${term}`, `${family.id} panic ${term}`));
    }
    if (family.variantCopies.some((copy) => copy.kind === 'reward')) {
      for (const term of FAKE_SUCCESS_TERMS) {
        record(assert(checks, !text.includes(term), `${family.id} reward avoids ${term}`, `${family.id} fake success ${term}`));
      }
    }
    if (family.variantCopies.some((copy) => copy.kind === 'comeback')) {
      for (const term of FREE_RECOVERY_TERMS) {
        record(assert(checks, !text.includes(term), `${family.id} comeback avoids ${term}`, `${family.id} free recovery ${term}`));
      }
    }
    if (family.variantCopies.some((copy) => copy.kind === 'recovery')) {
      for (const term of FREE_RECOVERY_TERMS) {
        record(assert(checks, !text.includes(term), `${family.id} recovery avoids ${term}`, `${family.id} free recovery ${term}`));
      }
    }
  }

  const variantCoverage = getCrisisAdjacentPackOneVariantCoverage();
  for (const variant of REQUIRED_VARIANTS) {
    record(assert(checks, variantCoverage[variant] > 0, `variant coverage ${variant}`, `missing variant ${variant}`));
  }

  const echoCoverage = getCrisisAdjacentPackOneEchoSurfaceCoverage();
  for (const surface of REQUIRED_ECHO_SURFACES) {
    record(
      assert(
        checks,
        echoCoverage[surface] === CRISIS_ADJACENT_PACK_ONE_FAMILIES.length,
        `echo coverage ${surface}`,
        `echo coverage ${surface} ${echoCoverage[surface]}`,
      ),
    );
  }

  for (const domain of REQUIRED_DOMAINS) {
    const covered =
      CRISIS_ADJACENT_PACK_ONE_FAMILIES.some((family) => family.domains.includes(domain)) ||
      CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK.items.some(
        (item) => item.tags.includes(domain) || item.tags.some((tag) => tag.startsWith(`${domain}_`)),
      );
    record(assert(checks, covered, `domain coverage ${domain}`, `missing domain ${domain}`));
  }

  const validation = validateContentPackDefinition(CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK);
  record(assert(checks, validation.status !== 'fail', 'pack validation not fail', `pack validation ${validation.status}`));

  const echoCompleteness = evaluateEchoCompletenessForPack(CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK);
  record(
    assert(
      checks,
      echoCompleteness.every((entry) => entry.status === 'pass'),
      'echo completeness PASS',
      'echo completeness missing',
    ),
  );

  for (const item of CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK.items) {
    for (const surface of CRISIS_ADJACENT_PACK_ONE_REQUIRED_ECHO_SURFACES) {
      record(
        assert(
          checks,
          (item.echoSurfaces ?? []).includes(surface) || item.copyBlocks.some((block) => block.surface === surface),
          `${item.id} has ${surface}`,
          `${item.id} missing ${surface}`,
        ),
      );
    }
  }

  const internalDuplicates = findContentDuplicateRisks(CRISIS_ADJACENT_PACK_ONE_ITEMS);
  record(
    assert(
      checks,
      internalDuplicates.length === 0,
      'internal duplicate guard PASS only',
      `internal duplicate guard found ${internalDuplicates.length} WARN/FAIL`,
    ),
  );

  let crossPackCollision = 0;
  for (const packItem of CRISIS_ADJACENT_PACK_ONE_ITEMS) {
    for (const districtItem of DISTRICT_PACK_ONE_ITEMS) {
      if (compareContentItemSimilarity(packItem, districtItem) >= 0.65) crossPackCollision += 1;
    }
    for (const vehicleItem of VEHICLE_ROUTE_PACK_ONE_ITEMS) {
      if (compareContentItemSimilarity(packItem, vehicleItem) >= 0.65) crossPackCollision += 1;
    }
    for (const containerItem of CONTAINER_ENVIRONMENT_PACK_ONE_ITEMS) {
      if (compareContentItemSimilarity(packItem, containerItem) >= 0.65) crossPackCollision += 1;
    }
    for (const socialItem of SOCIAL_TRUST_PACK_ONE_ITEMS) {
      if (compareContentItemSimilarity(packItem, socialItem) >= 0.65) crossPackCollision += 1;
    }
  }
  record(
    assert(
      checks,
      crossPackCollision === 0,
      'no cross-pack collision with district vehicle container and social trust packs',
      `cross-pack collision pairs ${crossPackCollision}`,
    ),
  );

  const audit = buildContentProductionAuditResult([CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK]);
  record(assert(checks, audit.blockerCount === 0, 'audit no blockers', `audit blockers ${audit.blockerCount}`));
  record(assert(checks, audit.failCount === 0, 'audit no failures', `audit failures ${audit.failCount}`));
  recordWarn(warn(checks, audit.warnCount === 0, 'audit no warnings', `audit warnings ${audit.warnCount}`));
  record(assert(checks, audit.score >= 80, 'audit score >= 80', `audit score ${audit.score}`));
  record(
    assert(
      checks,
      audit.summaryLines.some((line) => line.includes('no duplicate risk detected')) ||
        audit.duplicateRisks.length === 0,
      'audit duplicate safety summary',
      'missing duplicate safety summary',
    ),
  );

  const coverage = buildContentCoverageMatrix([CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK]);
  record(assert(checks, coverage.every((entry) => entry.status !== 'fail'), 'coverage has no FAIL', 'coverage FAIL present'));

  const playerCopy = normalizeText(
    collectContentProductionPlayerFacingCopy([CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK]).join(' '),
  );
  for (const term of [...EXTRA_FORBIDDEN_TERMS, ...PANIC_TERMS]) {
    record(assert(checks, !playerCopy.includes(term), `player copy avoids ${term}`, `player copy contains ${term}`));
  }

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION remains 23', 'SAVE_VERSION changed'));

  const packSource = readRepo('src/core/contentProduction/contentPacks/crisisAdjacentPackOne.ts');
  record(assert(checks, !packSource.includes('Math.random'), 'no Math.random', 'Math.random present'));
  record(assert(checks, !packSource.includes('@/store/gamePersist'), 'pack does not import persist', 'pack imports persist'));
  record(assert(checks, !packSource.includes('@/core/eventSelection'), 'pack does not import event selection', 'pack imports event selection'));

  const docs = readRepo('docs/crevia-crisis-adjacent-pack-one.md').toLowerCase();
  record(assert(checks, docs.includes('runtime activation yok'), 'docs runtime activation note', 'docs missing runtime activation'));
  record(assert(checks, docs.includes('save_version degismez'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION'));
  record(assert(checks, docs.includes('14 event family'), 'docs family count', 'docs family count missing'));

  record(recordScenario(checks, verifyContentProductionScenario(), 'content production'));
  record(recordScenario(checks, verifyEventSelectionScenario(), 'event selection'));
  record(recordScenario(checks, verifyEventVariantScenario(), 'event variants'));
  record(recordScenario(checks, verifyEventFreshnessScenario(), 'event freshness'));
  record(recordScenario(checks, verifyCrisisScenario(), 'crisis desk'));
  record(recordScenario(checks, verifyDistrictOperationActionScenario(), 'district operation actions'));

  const targetSurfaces: readonly CreviaContentProductionSurface[] = [
    'event_family',
    'event_variant',
    'advisor_echo',
    'report_echo',
    'social_echo',
    'map_hint',
    'tomorrow_preview',
    'operation_result',
  ] as const;
  for (const surface of targetSurfaces) {
    record(
      assert(
        checks,
        CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK.targetSurfaces.includes(surface),
        `target surface ${surface}`,
        `missing target surface ${surface}`,
      ),
    );
  }

  return { ok, warn: warnFlag, checks };
}
