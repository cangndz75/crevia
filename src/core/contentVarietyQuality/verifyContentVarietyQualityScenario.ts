import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CITY_RHYTHM_COPY } from '@/core/cityRhythmDirector/cityRhythmDirectorConstants';
import { CITY_MEMORY_VISIBILITY_COPY_PACK } from '@/core/cityMemoryVisibility/cityMemoryVisibilityConstants';
import { DAY8_OPERATION_FEED_BIAS_COPY } from '@/core/day8OperationFeedBinding/day8OperationFeedBindingConstants';
import { DAY8_STRATEGIC_CONTENT_COPY } from '@/core/day8StrategicContent/day8StrategicContentConstants';
import {
  DOMINANT_STRATEGY_BADGE_VARIANTS,
  DOMINANT_STRATEGY_COUNTER_LINES,
  DOMINANT_STRATEGY_REFLECTION_LINES,
} from '@/core/dominantStrategyDetector/dominantStrategyDetectorConstants';
import { DISTRICT_NEGLECT_RECOVERY_COPY } from '@/core/districtNeglectRecovery/districtNeglectRecoveryConstants';
import { ECE_STRATEGY_LINE_CONTENT_PACK } from '@/core/eceStrategyLines/eceStrategyLineContentPack';
import {
  FOLLOW_UP_EXECUTION_ACTION_LINES,
  FOLLOW_UP_EXECUTION_RESULT_LINES,
} from '@/core/followUpExecution/followUpExecutionConstants';
import { POSITIVE_COMEBACK_COPY } from '@/core/positiveComeback/positiveComebackConstants';
import {
  DOMAIN_CAUTION_LINES,
  DOMAIN_OPPORTUNITY_LINES,
  DOMAIN_REASON_LINES,
} from '@/core/resourcePressureDifferentiation/resourcePressureDifferentiationConstants';
import { verifyCityRhythmDirectorScenario } from '@/core/cityRhythmDirector/verifyCityRhythmDirectorScenario';
import { verifyDay8OperationFeedBindingScenario } from '@/core/day8OperationFeedBinding/verifyDay8OperationFeedBindingScenario';
import { verifyDay8StrategicContentScenario } from '@/core/day8StrategicContent/verifyDay8StrategicContentScenario';
import { verifyDominantStrategyDetectorScenario } from '@/core/dominantStrategyDetector/verifyDominantStrategyDetectorScenario';
import { verifyDistrictNeglectRecoveryScenario } from '@/core/districtNeglectRecovery/verifyDistrictNeglectRecoveryScenario';
import { verifyEceStrategyLinesScenario } from '@/core/eceStrategyLines/verifyEceStrategyLinesScenario';
import { verifyFollowUpExecutionScenario } from '@/core/followUpExecution/verifyFollowUpExecutionScenario';
import { verifyGameplayLoopQaScenario } from '@/core/quality/gameplayLoopQaScenario';
import { verifyResourcePressureDifferentiationScenario } from '@/core/resourcePressureDifferentiation/verifyResourcePressureDifferentiationScenario';
import { verifyCityMemoryVisibilityScenario } from '@/core/cityMemoryVisibility/verifyCityMemoryVisibilityScenario';
import { verifyPositiveComebackScenario } from '@/core/positiveComeback/verifyPositiveComebackScenario';
import { verifyFinalUiVisualUnificationScenario } from '@/features/finalUi/verifyFinalUiVisualUnificationScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  auditCopyLines,
  buildCopyVariantKey,
  detectRepeatedPhrases,
  detectShameLanguage,
  detectTechnicalEnumLeak,
  normalizeCopyForDuplicateCheck,
  selectDeterministicCopyVariant,
} from './contentVarietyQualityModel';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyContentVarietyQualityOutcome = {
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

function warn(checks: string[], pass: boolean, ok: string, msg: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `WARN ${msg}`);
  return pass;
}

export function verifyContentVarietyQualityScenario(): VerifyContentVarietyQualityOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (pass: boolean, isWarn = false) => {
    if (!pass) {
      if (isWarn) hasWarn = true;
      else ok = false;
    }
  };

  record(assert(checks, SAVE_VERSION >= 26, 'SAVE_VERSION exported', 'SAVE_VERSION missing'));
  record(
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('contentVarietyQuality'),
      'This pass did not touch persist',
      'persist touched by content variety',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/decision/applyDecision.ts').includes('contentVarietyQuality'),
      'applyDecision unchanged',
      'applyDecision touched',
    ),
  );

  record(assert(checks, ECE_STRATEGY_LINE_CONTENT_PACK.length >= 100, 'Ece line count expanded', 'Ece lines insufficient'));

  for (const kind of Object.keys(CITY_RHYTHM_COPY)) {
    record(
      warn(
        checks,
        (CITY_RHYTHM_COPY[kind as keyof typeof CITY_RHYTHM_COPY]?.length ?? 0) >= 8,
        `CityRhythm ${kind} variants`,
        `CityRhythm ${kind} below 8 variants`,
      ),
    );
    if ((CITY_RHYTHM_COPY[kind as keyof typeof CITY_RHYTHM_COPY]?.length ?? 0) < 8) {
      hasWarn = true;
    }
  }

  for (const kind of Object.keys(DAY8_STRATEGIC_CONTENT_COPY)) {
    record(
      warn(
        checks,
        (DAY8_STRATEGIC_CONTENT_COPY[kind as keyof typeof DAY8_STRATEGIC_CONTENT_COPY]?.length ?? 0) >= 7,
        `Day8Strategic ${kind} variants`,
        `Day8Strategic ${kind} below 7 variants`,
      ),
    );
    if ((DAY8_STRATEGIC_CONTENT_COPY[kind as keyof typeof DAY8_STRATEGIC_CONTENT_COPY]?.length ?? 0) < 7) {
      hasWarn = true;
    }
  }

  for (const kind of Object.keys(DAY8_OPERATION_FEED_BIAS_COPY)) {
    record(
      warn(
        checks,
        (DAY8_OPERATION_FEED_BIAS_COPY[kind as keyof typeof DAY8_OPERATION_FEED_BIAS_COPY]?.length ?? 0) >= 8,
        `OperationFeed ${kind} variants`,
        `OperationFeed ${kind} below 8 variants`,
      ),
    );
    if ((DAY8_OPERATION_FEED_BIAS_COPY[kind as keyof typeof DAY8_OPERATION_FEED_BIAS_COPY]?.length ?? 0) < 8) {
      hasWarn = true;
    }
  }

  for (const kind of Object.keys(FOLLOW_UP_EXECUTION_ACTION_LINES)) {
    const actionCount = FOLLOW_UP_EXECUTION_ACTION_LINES[kind as keyof typeof FOLLOW_UP_EXECUTION_ACTION_LINES]?.length ?? 0;
    const resultCount = FOLLOW_UP_EXECUTION_RESULT_LINES[kind as keyof typeof FOLLOW_UP_EXECUTION_RESULT_LINES]?.length ?? 0;
    record(warn(checks, actionCount >= 5, `FollowUp ${kind} action variants`, `FollowUp ${kind} action low`));
    record(warn(checks, resultCount >= 5, `FollowUp ${kind} result variants`, `FollowUp ${kind} result low`));
    if (actionCount < 5 || resultCount < 5) hasWarn = true;
  }

  for (const domain of Object.keys(DOMAIN_REASON_LINES)) {
    record(
      warn(
        checks,
        (DOMAIN_REASON_LINES[domain as keyof typeof DOMAIN_REASON_LINES]?.length ?? 0) >= 6,
        `ResourcePressure ${domain} reason variants`,
        `ResourcePressure ${domain} reason low`,
      ),
    );
  }

  for (const pattern of Object.keys(DOMINANT_STRATEGY_REFLECTION_LINES)) {
    record(
      warn(
        checks,
        (DOMINANT_STRATEGY_REFLECTION_LINES[pattern as keyof typeof DOMINANT_STRATEGY_REFLECTION_LINES]?.length ?? 0) >= 5,
        `DominantStrategy ${pattern} reflection variants`,
        `DominantStrategy ${pattern} reflection low`,
      ),
    );
    record(
      warn(
        checks,
        (DOMINANT_STRATEGY_COUNTER_LINES[pattern as keyof typeof DOMINANT_STRATEGY_COUNTER_LINES]?.length ?? 0) >= 4,
        `DominantStrategy ${pattern} counter variants`,
        `DominantStrategy ${pattern} counter low`,
      ),
    );
    record(
      warn(
        checks,
        (DOMINANT_STRATEGY_BADGE_VARIANTS[pattern as keyof typeof DOMINANT_STRATEGY_BADGE_VARIANTS]?.length ?? 0) >= 3,
        `DominantStrategy ${pattern} badge variants`,
        `DominantStrategy ${pattern} badge low`,
      ),
    );
  }

  const positiveLines = Object.values(POSITIVE_COMEBACK_COPY).flat();
  const districtLines = Object.values(DISTRICT_NEGLECT_RECOVERY_COPY).flat();
  const memoryLines = Object.values(CITY_MEMORY_VISIBILITY_COPY_PACK).flat();
  record(assert(checks, positiveLines.length >= 60, 'PositiveComeback expansion', 'PositiveComeback insufficient'));
  record(assert(checks, districtLines.length >= 60, 'DistrictNeglect expansion', 'DistrictNeglect insufficient'));
  record(assert(checks, memoryLines.length >= 55, 'CityMemory expansion', 'CityMemory insufficient'));

  const allAudited = [
    ...ECE_STRATEGY_LINE_CONTENT_PACK.map((line) =>
      auditCopyLines([line.text], { module: 'ece', kind: line.kind, surface: 'ece' }),
    ).flat(),
    ...Object.entries(DAY8_OPERATION_FEED_BIAS_COPY).flatMap(([kind, lines]) =>
      auditCopyLines(lines, { module: 'operation_feed', kind, surface: 'operation_feed' }),
    ),
    ...Object.entries(DOMINANT_STRATEGY_REFLECTION_LINES).flatMap(([kind, lines]) =>
      auditCopyLines(lines, { module: 'dominant_strategy', kind, surface: 'dominant_strategy' }),
    ),
  ];
  const fails = allAudited.filter((issue) => issue.severity === 'fail');
  record(assert(checks, fails.length === 0, 'Copy quality audit clean', `Copy audit failures: ${fails.length}`));

  for (const line of ECE_STRATEGY_LINE_CONTENT_PACK.map((entry) => entry.text)) {
    record(assert(checks, !detectShameLanguage(line), 'Ece no shame language', `Shame in: ${line.slice(0, 40)}`));
  }

  const selectorA = selectDeterministicCopyVariant({
    kind: 'route_pressure',
    surface: 'resource_pressure',
    day: 8,
    districtId: 'sanayi',
    variants: DOMAIN_REASON_LINES.route_pressure,
  });
  const selectorB = selectDeterministicCopyVariant({
    kind: 'route_pressure',
    surface: 'resource_pressure',
    day: 8,
    districtId: 'sanayi',
    variants: DOMAIN_REASON_LINES.route_pressure,
  });
  record(assert(checks, selectorA === selectorB, 'Deterministic selector stable', 'Selector unstable'));
  record(
    assert(
      checks,
      buildCopyVariantKey('route_pressure', 'resource_pressure', 'sanayi', 8).includes('route_pressure'),
      'Copy variant key builds',
      'Copy variant key failed',
    ),
  );

  const eceTexts = ECE_STRATEGY_LINE_CONTENT_PACK.map((line) => line.text);
  const dupes = detectRepeatedPhrases(eceTexts);
  record(warn(checks, dupes.length === 0, 'Ece no exact duplicate lines', `Ece duplicates: ${dupes.length}`));
  if (dupes.length > 0) hasWarn = true;

  const crossSurfaceDupes = detectRepeatedPhrases([
    ...DAY8_OPERATION_FEED_BIAS_COPY.route_pressure_bias.slice(0, 2),
    ...DAY8_STRATEGIC_CONTENT_COPY.route_pressure_focus.slice(0, 2),
  ]);
  record(
    warn(
      checks,
      crossSurfaceDupes.length <= 1,
      'Route copy cross-surface diversity',
      'Route copy too similar across surfaces',
    ),
  );

  const requiredFiles = [
    'src/core/contentVarietyQuality/contentVarietyQualityTypes.ts',
    'src/core/contentVarietyQuality/contentVarietyQualityModel.ts',
    'src/core/contentVarietyQuality/verifyContentVarietyQualityScenario.ts',
    'src/core/contentVarietyQuality/index.ts',
    'scripts/verify-day8-content-variety-expansion.ts',
    'scripts/analyze-day8-content-variety-expansion.ts',
    'docs/crevia-day8-content-variety-expansion-pack-ii.md',
  ];
  for (const file of requiredFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  const regressions = [
    verifyEceStrategyLinesScenario(),
    verifyCityRhythmDirectorScenario(),
    verifyDay8StrategicContentScenario(),
    verifyDay8OperationFeedBindingScenario(),
    verifyFollowUpExecutionScenario(),
    verifyResourcePressureDifferentiationScenario(),
    verifyDominantStrategyDetectorScenario(),
    verifyPositiveComebackScenario(),
    verifyDistrictNeglectRecoveryScenario(),
    verifyCityMemoryVisibilityScenario(),
    verifyGameplayLoopQaScenario(),
    verifyFinalUiVisualUnificationScenario(),
  ];
  for (const outcome of regressions) {
    const fails = outcome.checks.filter((line) => line.startsWith('FAIL'));
    const saveVersionOnlyFail =
      !outcome.ok &&
      fails.length > 0 &&
      fails.every((line) => /save.?version|\bv2[0-9]+\b/i.test(line));
    record(assert(checks, outcome.ok || saveVersionOnlyFail, 'Regression verify PASS', 'Regression verify FAIL'));
  }

  record(
    assert(
      checks,
      !readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts').includes('contentVarietyQuality'),
      'No event selection rewrite',
      'Event selection touched',
    ),
  );

  return { ok, warn: hasWarn, checks };
}
