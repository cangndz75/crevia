/**
 * Authority gameplay expansion diagnostic analyzer.
 * Calistir: npm run analyze:authority-gameplay-expansion
 */

import { verifyMeaningfulAuthorityGameplayScenario } from '../src/core/authority/verifyMeaningfulAuthorityGameplayScenario';
import { buildAuthorityGameplayExpansionSummary } from '../src/core/authorityGameplayExpansion/authorityGameplayExpansionModel';
import {
  buildAuthorityGameplayBenefitCardModels,
  buildAuthorityGameplaySummaryCard,
} from '../src/core/authorityGameplayExpansion/authorityGameplayExpansionPresentation';
import type { AuthorityGameplayExpansionInput } from '../src/core/authorityGameplayExpansion/authorityGameplayExpansionTypes';

type Scenario = { label: string; input: AuthorityGameplayExpansionInput };

const scenarios: Scenario[] = [
  { label: 'No permission', input: { day: 8 } },
  {
    label: 'Early rank',
    input: { rankId: 'field_observer', permissionIds: ['inspect_basic_events'], day: 2 },
  },
  {
    label: 'Mid rank',
    input: {
      rankId: 'field_coordinator',
      permissionIds: ['assignment_fit_preview', 'resource_pressure_summary'],
      nextRankPermissionIds: ['district_trust_preview'],
      day: 5,
      portfolioAvailable: true,
    },
  },
  {
    label: 'Map-focused rank',
    input: {
      rankId: 'city_operations_manager',
      permissionIds: ['map_resource_layer', 'map_trust_layer'],
      day: 12,
      mapBindingAvailable: true,
      portfolioAvailable: true,
    },
  },
  {
    label: 'Resource-focused rank',
    input: {
      rankId: 'field_coordinator',
      permissionIds: ['resource_pressure_summary'],
      day: 6,
      portfolioAvailable: true,
    },
  },
  {
    label: 'District memory permission',
    input: {
      rankId: 'district_supervisor',
      permissionIds: ['district_memory_trace_preview', 'district_trust_preview'],
      day: 9,
      districtPersonalityAvailable: true,
      portfolioAvailable: true,
    },
  },
  { label: 'Day 1', input: { rankId: 'field_observer', permissionIds: ['inspect_basic_events'], day: 1 } },
  {
    label: 'Day 8+',
    input: {
      rankId: 'district_supervisor',
      permissionIds: [
        'district_trust_preview',
        'advisor_specialist_notes_preview',
        'map_resource_layer',
        'resource_pressure_summary',
      ],
      day: 8,
      mapBindingAvailable: true,
      portfolioAvailable: true,
      districtPersonalityAvailable: true,
    },
  },
  {
    label: 'Next rank teaser',
    input: {
      rankId: 'field_coordinator',
      permissionIds: ['assignment_fit_preview'],
      nextRankPermissionIds: ['district_trust_preview'],
      day: 7,
      districtPersonalityAvailable: true,
    },
  },
];

let hasWarn = false;
let hasFail = false;

for (const scenario of scenarios) {
  const summary = buildAuthorityGameplayExpansionSummary(scenario.input);
  const cards = buildAuthorityGameplayBenefitCardModels(summary);
  const summaryCard = buildAuthorityGameplaySummaryCard(summary);
  const domains = new Set(summary.unlockedBenefits.map((b) => b.domain));
  const detailedWithoutPermission = summary.unlockedBenefits.some(
    (b) => b.visibility === 'detailed' && !b.requiredPermissionId,
  );
  const lockedTeasers = cards.filter((c) => !c.isUnlocked).length;

  // eslint-disable-next-line no-console
  console.log(`\n=== ${scenario.label} ===`);
  // eslint-disable-next-line no-console
  console.log(
    `Unlocked=${summary.unlockedBenefits.length} teaser=${summary.teaserBenefits.length} cards=${cards.length}`,
  );
  // eslint-disable-next-line no-console
  console.log(`Summary: ${summaryCard.summaryLine}`);
  if (summary.nextBenefit) console.log(`Next: ${summary.nextBenefit.title}`);

  if (detailedWithoutPermission) {
    console.log('FAIL detailed without permission');
    hasFail = true;
  }
  if (lockedTeasers > 1) {
    console.log('FAIL locked teaser > 1');
    hasFail = true;
  }
  if (cards.filter((c) => c.isUnlocked).length > 3) {
    console.log('FAIL unlocked presentation > 3');
    hasFail = true;
  }
  if (scenario.input.day && scenario.input.day >= 8 && !summary.unlockedBenefits.some((b) => b.tone === 'strategic')) {
    console.log('WARN day8+ no strategic benefit');
    hasWarn = true;
  }
  if (summary.unlockedBenefits.length > 1 && domains.size === 1) {
    console.log('WARN all benefits same domain');
    hasWarn = true;
  }
  for (const card of cards) {
    if (card.line.length > 96) {
      console.log(`FAIL line too long: ${card.id}`);
      hasFail = true;
    }
    if (/assignment_fit_preview|map_layer_detail/.test(card.line)) {
      console.log(`FAIL technical enum in line: ${card.id}`);
      hasFail = true;
    }
  }
}

const meaningfulStart = Date.now();
const meaningful = verifyMeaningfulAuthorityGameplayScenario();
const meaningfulMs = Date.now() - meaningfulStart;
// eslint-disable-next-line no-console
console.log(`\nMeaningful authority verify: ${meaningful.ok ? 'PASS' : 'FAIL'} (${meaningfulMs}ms)`);
if (meaningfulMs > 30000) {
  console.log('WARN meaningful authority verify slow');
  hasWarn = true;
}
if (!meaningful.ok) {
  hasFail = true;
}

// eslint-disable-next-line no-console
console.log('\n--- Analyzer result ---');
if (hasFail) {
  console.log('FAIL');
  process.exit(1);
}
if (hasWarn) {
  console.log('WARN');
  process.exit(0);
}
console.log('PASS');
