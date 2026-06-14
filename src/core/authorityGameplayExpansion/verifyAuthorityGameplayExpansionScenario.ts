import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyMeaningfulAuthorityGameplayScenario } from '@/core/authority/verifyMeaningfulAuthorityGameplayScenario';
import { verifyDailyCapacityPortfolioScenario } from '@/core/dailyCapacityPortfolio/verifyDailyCapacityPortfolioScenario';
import { verifyMapGameplayBindingScenario } from '@/core/mapGameplayBinding/verifyMapGameplayBindingScenario';
import { verifyActiveOperationMapBindingScenario } from '@/core/activeOperationMapBinding/verifyActiveOperationMapBindingScenario';
import { verifyDistrictPersonalityScenario } from '@/core/districtPersonality/verifyDistrictPersonalityScenario';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildAuthorityGameplayExpansionSummary,
  buildAuthorityAdvisorCapabilityLine,
  buildAuthorityMapBenefitLine,
  buildAuthorityPortfolioBenefitLine,
} from './authorityGameplayExpansionModel';
import {
  buildAuthorityGameplayBenefitCardModels,
  buildAuthorityGameplaySummaryCard,
} from './authorityGameplayExpansionPresentation';
import {
  AUTHORITY_EXPANSION_MAX_LOCKED_TEASERS,
  AUTHORITY_EXPANSION_MAX_PRESENTATION_BENEFITS,
  PERMISSION_BENEFIT_CATALOG,
} from './authorityGameplayExpansionConstants';
import {
  AUTHORITY_GAMEPLAY_BENEFIT_DOMAINS,
  AUTHORITY_GAMEPLAY_BENEFIT_KINDS,
  AUTHORITY_GAMEPLAY_BENEFIT_VISIBILITIES,
} from './authorityGameplayExpansionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;

export type VerifyAuthorityGameplayExpansionOutcome = {
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

function warn(checks: string[], pass: boolean, ok: string, warning: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `WARN ${warning}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const MID_RANK_INPUT = {
  rankId: 'field_coordinator',
  permissionIds: ['assignment_fit_preview', 'resource_pressure_summary'],
  nextRankPermissionIds: ['district_trust_preview'],
  day: 4,
  portfolioAvailable: true,
  mapBindingAvailable: true,
  districtPersonalityAvailable: true,
};

const DAY8_INPUT = {
  rankId: 'district_supervisor',
  permissionIds: [
    'assignment_fit_preview',
    'resource_pressure_summary',
    'district_trust_preview',
    'advisor_specialist_notes_preview',
    'map_resource_layer',
    'district_memory_trace_preview',
  ],
  nextRankPermissionIds: ['map_trust_layer'],
  day: 8,
  portfolioAvailable: true,
  mapBindingAvailable: true,
  districtPersonalityAvailable: true,
};

export function verifyAuthorityGameplayExpansionScenario(): VerifyAuthorityGameplayExpansionOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnState = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) warnState = true;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`));

  const hubPortfolio = readRepo('src/features/hub/utils/centerDailyCapacityPortfolioPresentation.ts');
  record(assert(checks, hubPortfolio.length === 0 || !hubPortfolio.includes('authorityGameplayExpansion'), 'hub portfolio untouched', 'hub portfolio wired'));

  const day1 = buildAuthorityGameplayExpansionSummary({
    rankId: 'field_observer',
    permissionIds: ['inspect_basic_events'],
    day: 1,
  });
  record(assert(checks, day1.unlockedBenefits.length <= 2, 'day1 low noise', `day1 benefits ${day1.unlockedBenefits.length}`));
  record(
    assert(
      checks,
      !day1.unlockedBenefits.some((b) => b.visibility === 'detailed'),
      'day1 no detailed',
      'day1 detailed leaked',
    ),
  );

  const none = buildAuthorityGameplayExpansionSummary({ day: 8 });
  record(assert(checks, none.teaserBenefits.length <= AUTHORITY_EXPANSION_MAX_LOCKED_TEASERS, 'locked teaser max 1', `teasers ${none.teaserBenefits.length}`));
  record(assert(checks, !none.unlockedBenefits.some((b) => b.visibility === 'detailed'), 'no permission no detailed', 'detailed without permission'));

  const mid = buildAuthorityGameplayExpansionSummary(MID_RANK_INPUT);
  const day8 = buildAuthorityGameplayExpansionSummary(DAY8_INPUT);

  for (const summary of [mid, day8]) {
    const allBenefits = [...summary.unlockedBenefits, ...summary.teaserBenefits];
    record(assert(checks, unique(allBenefits.map((b) => b.id)), 'benefit ids unique', 'duplicate benefit ids'));
    record(assert(checks, unique(summary.sourceIds), 'summary sourceIds unique', 'duplicate sourceIds'));

    for (const benefit of allBenefits) {
      record(assert(checks, AUTHORITY_GAMEPLAY_BENEFIT_KINDS.includes(benefit.kind), `${benefit.id} kind valid`, `${benefit.id} invalid kind`));
      record(assert(checks, AUTHORITY_GAMEPLAY_BENEFIT_DOMAINS.includes(benefit.domain), `${benefit.id} domain valid`, `${benefit.id} invalid domain`));
      record(assert(checks, AUTHORITY_GAMEPLAY_BENEFIT_VISIBILITIES.includes(benefit.visibility), `${benefit.id} visibility valid`, `${benefit.id} invalid visibility`));
      record(assert(checks, unique(benefit.sourceIds), `${benefit.id} sourceIds unique`, `${benefit.id} duplicate sourceIds`));
      record(assert(checks, benefit.priority >= 0 && benefit.priority <= 100, `${benefit.id} priority clamp`, `${benefit.id} priority out of range`));
      if (!benefit.isUnlocked) {
        record(assert(checks, benefit.visibility !== 'detailed', `${benefit.id} locked not detailed`, `${benefit.id} locked detailed`));
      }
      if (benefit.visibility === 'detailed') {
        record(assert(checks, benefit.isUnlocked && Boolean(benefit.requiredPermissionId), `${benefit.id} detailed guard`, `${benefit.id} detailed without permission`));
      }
    }
  }

  const cards = buildAuthorityGameplayBenefitCardModels(day8);
  const summaryCard = buildAuthorityGameplaySummaryCard(day8);
  record(assert(checks, cards.length <= AUTHORITY_EXPANSION_MAX_PRESENTATION_BENEFITS + AUTHORITY_EXPANSION_MAX_LOCKED_TEASERS, 'presentation benefit cap', `cards ${cards.length}`));
  record(assert(checks, cards.filter((c) => !c.isUnlocked).length <= AUTHORITY_EXPANSION_MAX_LOCKED_TEASERS, 'locked teaser presentation cap', 'too many locked teasers'));
  record(assert(checks, summaryCard.accessibilityLabel.trim().length > 0, 'summary accessibility', 'empty accessibility'));
  record(assert(checks, Boolean(summaryCard.nextBenefitLine) || !day8.nextBenefit, 'next benefit max 1', 'multiple next benefits'));

  recordWarn(warn(checks, day8.unlockedBenefits.some((b) => b.tone === 'strategic'), 'day8 strategic benefits', 'day8 no strategic benefit'));

  const advisorLine = buildAuthorityAdvisorCapabilityLine(day8);
  const mapLine = buildAuthorityMapBenefitLine(day8);
  const portfolioLine = buildAuthorityPortfolioBenefitLine(day8);
  record(assert(checks, Boolean(advisorLine), 'advisor line', 'missing advisor line'));
  record(assert(checks, Boolean(mapLine), 'map line', 'missing map line'));
  record(assert(checks, Boolean(portfolioLine), 'portfolio line', 'missing portfolio line'));

  for (const card of cards) {
    record(assert(checks, card.line.length <= 96, `${card.id} line length`, `${card.id} line too long`));
    record(assert(checks, card.accessibilityLabel.length <= 160, `${card.id} a11y length`, `${card.id} a11y too long`));
    record(assert(checks, !/assignment_fit_preview|map_layer_detail/.test(card.line), `${card.id} no technical enum`, `${card.id} enum leaked`));
  }

  const catalogPermissionIds = Object.keys(PERMISSION_BENEFIT_CATALOG);
  record(assert(checks, catalogPermissionIds.length >= 8, 'catalog coverage', `only ${catalogPermissionIds.length} permissions`));
  for (const permissionId of catalogPermissionIds) {
    record(
      assert(
        checks,
        (REQUIRED_RANK_PERMISSION_IDS as readonly string[]).includes(permissionId),
        `${permissionId} canonical`,
        `${permissionId} fake permission`,
      ),
    );
  }

  const meaningful = verifyMeaningfulAuthorityGameplayScenario();
  record(assert(checks, meaningful.ok, 'meaningful-authority verify', `${meaningful.failCount} failures`));

  record(assert(checks, verifyDailyCapacityPortfolioScenario().ok, 'daily-capacity-portfolio verify', 'portfolio verify failed'));
  record(assert(checks, verifyMapGameplayBindingScenario().ok, 'map-gameplay-binding verify', 'map binding failed'));
  record(assert(checks, verifyActiveOperationMapBindingScenario().ok, 'active-operation-map-binding verify', 'active map failed'));
  record(assert(checks, verifyDistrictPersonalityScenario().ok, 'district-personality verify', 'district personality failed'));

  const moduleFiles = [
    'src/core/authorityGameplayExpansion/authorityGameplayExpansionTypes.ts',
    'src/core/authorityGameplayExpansion/authorityGameplayExpansionConstants.ts',
    'src/core/authorityGameplayExpansion/authorityGameplayExpansionModel.ts',
    'src/core/authorityGameplayExpansion/authorityGameplayExpansionPresentation.ts',
    'src/core/authorityGameplayExpansion/verifyAuthorityGameplayExpansionScenario.ts',
    'src/core/authorityGameplayExpansion/index.ts',
    'scripts/verify-authority-gameplay-expansion.ts',
    'scripts/analyze-authority-gameplay-expansion.ts',
    'docs/crevia-authority-gameplay-expansion-final-pass.md',
  ];
  for (const file of moduleFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  return { ok, warn: warnState, checks };
}
