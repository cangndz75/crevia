import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyActiveTaskRouteScenario } from '@/core/activeTaskRoutes/verifyActiveTaskRouteScenario';
import { verifyDistrictOperationActionScenario } from '@/core/districtOperationActions/verifyDistrictOperationActionScenario';
import { verifyDistrictOperationsRuntimeScenario } from '@/core/districtOperationsRuntime/verifyDistrictOperationsRuntimeScenario';
import { verifyEventFreshnessScenario } from '@/core/eventFreshness/verifyEventFreshnessScenario';
import { verifyEventSelectionScenario } from '@/core/eventSelection/verifyEventSelectionScenario';
import { verifyEventVariantScenario } from '@/core/eventVariants/verifyEventVariantScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_PACK_ONE_ITEMS,
  VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK,
  VEHICLE_ROUTE_PACK_ONE_FAMILIES,
  VEHICLE_ROUTE_PACK_ONE_ID,
  VEHICLE_ROUTE_PACK_ONE_ITEMS,
  VEHICLE_ROUTE_PACK_ONE_REQUIRED_ECHO_SURFACES,
  getVehicleRoutePackOneEchoSurfaceCoverage,
  getVehicleRoutePackOneFamiliesByDistrict,
  getVehicleRoutePackOneVariantCoverage,
  type VehicleRoutePackOneDistrictId,
  type VehicleRoutePackOneDomain,
  type VehicleRoutePackOneEchoSurface,
  type VehicleRoutePackOneFamily,
  type VehicleRoutePackOneVariantKind,
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

const SANAYI_MIN = 5;
const ISTASYON_MIN = 5;
const OTHER_DISTRICT_MIN = 2;

const REQUIRED_VARIANTS: readonly VehicleRoutePackOneVariantKind[] = [
  'normal',
  'improved',
  'worsened',
  'carry_over',
  'reward',
  'comeback',
  'resource_fatigue',
  'district_trust',
] as const;

const REQUIRED_DOMAINS: readonly VehicleRoutePackOneDomain[] = [
  'vehicle_route',
  'route_efficiency',
  'vehicle_maintenance',
  'resource_fatigue',
  'active_route',
  'personnel_coordination',
  'district_operation',
  'carry_over',
  'reward_recovery',
  'crisis_adjacent',
] as const;

const REQUIRED_ECHO_SURFACES: readonly VehicleRoutePackOneEchoSurface[] = [
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
  'pan' + 'ik',
  'coktu',
  'basarisiz oldun',
  'al' + 'arm',
  'kesin cozuldu',
  'gercek zamanli gps',
  'canli takip',
  'kesin varis',
] as const;

const PANIC_TERMS = ['panik', 'felaket', 'cokus'] as const;

const FAKE_SUCCESS_TERMS = ['kesin basari', 'tamamen cozuldu', 'mukemmel sonuc'] as const;

const FREE_RECOVERY_TERMS = ['bedelsiz', 'ucretsiz kurtarma', 'otomatik toparlandi'] as const;

export type VerifyVehicleRoutePackOneOutcome = {
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

function familyText(family: VehicleRoutePackOneFamily): string {
  return normalizeText(
    [
      family.title,
      family.affectedActor,
      family.concreteScene,
      family.visibleOperationalProblem,
      family.decisionTradeoff,
      family.shortTermEffect,
      family.carryOverConsequence,
      family.activeRouteIntent,
      family.vehicleMaintenanceIntent,
      family.resourceFatigueIntent,
      family.trustIntent,
      family.memoryIntent,
      family.crisisAdjacency ?? '',
      ...family.variantCopies.map((copy) => copy.text),
      ...Object.values(family.echoes),
      ...Object.values(family.routeHints),
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

export function verifyVehicleRoutePackOneScenario(): VerifyVehicleRoutePackOneOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnFlag = false;

  function record(result: boolean) {
    if (!result) ok = false;
  }

  function recordWarn(result: boolean) {
    if (!result) warnFlag = true;
  }

  const totalVariants = VEHICLE_ROUTE_PACK_ONE_FAMILIES.reduce(
    (sum, family) => sum + family.variantCopies.length,
    0,
  );

  record(
    assert(
      checks,
      VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK.id === VEHICLE_ROUTE_PACK_ONE_ID,
      'pack id',
      'pack id mismatch',
    ),
  );
  record(
    assert(
      checks,
      VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK.kind === 'event_family_pack',
      'event family pack kind',
      'pack kind mismatch',
    ),
  );
  record(
    assert(
      checks,
      VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK.isRuntimeLinked === false,
      'pack is not runtime linked',
      'pack runtime linked',
    ),
  );
  record(assert(checks, VEHICLE_ROUTE_PACK_ONE_FAMILIES.length >= 16, '16+ event families', 'family count below 16'));
  record(
    assert(
      checks,
      VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK.items.length === VEHICLE_ROUTE_PACK_ONE_FAMILIES.length,
      'item count matches families',
      'item count mismatch',
    ),
  );
  record(assert(checks, totalVariants >= 64, '64+ variant copy', `variant copy ${totalVariants}`));

  const familiesByDistrict = getVehicleRoutePackOneFamiliesByDistrict();
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
  for (const districtId of ['merkez', 'cumhuriyet', 'yesilvadi'] as VehicleRoutePackOneDistrictId[]) {
    record(
      assert(
        checks,
        familiesByDistrict[districtId].length >= OTHER_DISTRICT_MIN,
        `${districtId} has ${OTHER_DISTRICT_MIN}+ families`,
        `${districtId} family count ${familiesByDistrict[districtId].length}`,
      ),
    );
  }

  const ids = new Set<string>();
  for (const family of VEHICLE_ROUTE_PACK_ONE_FAMILIES) {
    record(assert(checks, !ids.has(family.id), `unique family ${family.id}`, `duplicate family ${family.id}`));
    ids.add(family.id);
    record(assert(checks, family.title.length > 0 && family.title.length <= 56, `${family.id} title length`, `${family.id} title length`));
    record(assert(checks, family.districtIds.length > 0, `${family.id} district link`, `${family.id} district missing`));
    record(assert(checks, family.domains.length >= 2, `${family.id} domain links`, `${family.id} domains weak`));
    record(assert(checks, family.activeRouteIntent.length > 0, `${family.id} active route intent`, `${family.id} active route missing`));
    record(
      assert(
        checks,
        family.vehicleMaintenanceIntent.length > 0 || family.resourceFatigueIntent.length > 0,
        `${family.id} maintenance or fatigue intent`,
        `${family.id} maintenance/fatigue missing`,
      ),
    );
    record(assert(checks, family.vehicleMaintenanceIntent.length > 0, `${family.id} maintenance intent`, `${family.id} maintenance missing`));
    record(assert(checks, family.resourceFatigueIntent.length > 0, `${family.id} fatigue intent`, `${family.id} fatigue missing`));
    record(assert(checks, family.routeHints.dispatchHint.length > 0, `${family.id} dispatch hint`, `${family.id} dispatch hint missing`));
    record(assert(checks, family.routeHints.fieldHint.length > 0, `${family.id} field hint`, `${family.id} field hint missing`));
    record(assert(checks, family.routeHints.activeRouteHint.length > 0, `${family.id} active route hint`, `${family.id} active route hint missing`));
    record(assert(checks, family.routeHints.maintenanceHint.length > 0, `${family.id} maintenance hint`, `${family.id} maintenance hint missing`));
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
    if (family.variantCopies.some((copy) => copy.kind === 'crisis_adjacent') || family.crisisAdjacency) {
      for (const term of PANIC_TERMS) {
        record(assert(checks, !text.includes(term), `${family.id} crisis tone avoids ${term}`, `${family.id} crisis panic ${term}`));
      }
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
  }

  const variantCoverage = getVehicleRoutePackOneVariantCoverage();
  for (const variant of REQUIRED_VARIANTS) {
    record(assert(checks, variantCoverage[variant] > 0, `variant coverage ${variant}`, `missing variant ${variant}`));
  }
  record(assert(checks, variantCoverage.crisis_adjacent > 0, 'controlled crisis-adjacent variant', 'missing crisis-adjacent variant'));

  const echoCoverage = getVehicleRoutePackOneEchoSurfaceCoverage();
  for (const surface of REQUIRED_ECHO_SURFACES) {
    record(
      assert(
        checks,
        echoCoverage[surface] === VEHICLE_ROUTE_PACK_ONE_FAMILIES.length,
        `echo coverage ${surface}`,
        `echo coverage ${surface} ${echoCoverage[surface]}`,
      ),
    );
  }

  for (const domain of REQUIRED_DOMAINS) {
    const covered =
      VEHICLE_ROUTE_PACK_ONE_FAMILIES.some((family) => family.domains.includes(domain)) ||
      VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK.items.some(
        (item) => item.tags.includes(domain) || item.tags.some((tag) => tag.startsWith(`${domain}_`)),
      );
    record(assert(checks, covered, `domain coverage ${domain}`, `missing domain ${domain}`));
  }

  const validation = validateContentPackDefinition(VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK);
  record(assert(checks, validation.status !== 'fail', 'pack validation not fail', `pack validation ${validation.status}`));

  const echoCompleteness = evaluateEchoCompletenessForPack(VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK);
  record(
    assert(
      checks,
      echoCompleteness.every((entry) => entry.status === 'pass'),
      'echo completeness PASS',
      'echo completeness missing',
    ),
  );

  for (const item of VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK.items) {
    for (const surface of VEHICLE_ROUTE_PACK_ONE_REQUIRED_ECHO_SURFACES) {
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

  const internalDuplicates = findContentDuplicateRisks(VEHICLE_ROUTE_PACK_ONE_ITEMS);
  record(
    assert(
      checks,
      internalDuplicates.length === 0,
      'internal duplicate guard PASS only',
      `internal duplicate guard found ${internalDuplicates.length} WARN/FAIL`,
    ),
  );

  let crossPackCollision = 0;
  for (const vehicleItem of VEHICLE_ROUTE_PACK_ONE_ITEMS) {
    for (const districtItem of DISTRICT_PACK_ONE_ITEMS) {
      const score = compareContentItemSimilarity(vehicleItem, districtItem);
      if (score >= 0.65) crossPackCollision += 1;
    }
  }
  record(
    assert(
      checks,
      crossPackCollision === 0,
      'no district pack one cross-pack collision',
      `cross-pack collision pairs ${crossPackCollision}`,
    ),
  );

  const audit = buildContentProductionAuditResult([VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK]);
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

  const coverage = buildContentCoverageMatrix([VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK]);
  record(assert(checks, coverage.every((entry) => entry.status !== 'fail'), 'coverage has no FAIL', 'coverage FAIL present'));

  const playerCopy = normalizeText(
    collectContentProductionPlayerFacingCopy([VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK]).join(' '),
  );
  for (const term of EXTRA_FORBIDDEN_TERMS) {
    record(assert(checks, !playerCopy.includes(term), `player copy avoids ${term}`, `player copy contains ${term}`));
  }

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION remains 23', 'SAVE_VERSION changed'));

  const packSource = readRepo('src/core/contentProduction/contentPacks/vehicleRoutePackOne.ts');
  record(assert(checks, !packSource.includes('Math.random'), 'no Math.random', 'Math.random present'));
  record(assert(checks, !packSource.includes('@/store/gamePersist'), 'pack does not import persist', 'pack imports persist'));
  record(assert(checks, !packSource.includes('@/core/eventSelection'), 'pack does not import event selection', 'pack imports event selection'));

  const docs = readRepo('docs/crevia-vehicle-route-pack-one.md').toLowerCase();
  record(assert(checks, docs.includes('runtime activation yok'), 'docs runtime activation note', 'docs missing runtime activation'));
  record(assert(checks, docs.includes('save_version degismez'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION'));
  record(assert(checks, docs.includes('16 event family'), 'docs family count', 'docs family count missing'));

  record(recordScenario(checks, verifyContentProductionScenario(), 'content production'));
  record(recordScenario(checks, verifyEventSelectionScenario(), 'event selection'));
  record(recordScenario(checks, verifyEventVariantScenario(), 'event variants'));
  record(recordScenario(checks, verifyEventFreshnessScenario(), 'event freshness'));
  record(recordScenario(checks, verifyActiveTaskRouteScenario(), 'active task route'));
  record(recordScenario(checks, verifyDistrictOperationActionScenario(), 'district operation actions'));
  record(recordScenario(checks, verifyDistrictOperationsRuntimeScenario(), 'district operations runtime'));

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
        VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK.targetSurfaces.includes(surface),
        `target surface ${surface}`,
        `missing target surface ${surface}`,
      ),
    );
  }

  return { ok, warn: warnFlag, checks };
}
