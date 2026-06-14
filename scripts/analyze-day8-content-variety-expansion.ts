/**
 * Day 8+ Content Variety Expansion Pack II analyzer.
 */

import { CITY_RHYTHM_COPY } from '../src/core/cityRhythmDirector/cityRhythmDirectorConstants';
import { CITY_MEMORY_VISIBILITY_COPY_PACK } from '../src/core/cityMemoryVisibility/cityMemoryVisibilityConstants';
import { DAY8_OPERATION_FEED_BIAS_COPY } from '../src/core/day8OperationFeedBinding/day8OperationFeedBindingConstants';
import { DAY8_STRATEGIC_CONTENT_COPY } from '../src/core/day8StrategicContent/day8StrategicContentConstants';
import {
  DOMINANT_STRATEGY_REFLECTION_LINES,
} from '../src/core/dominantStrategyDetector/dominantStrategyDetectorConstants';
import { DISTRICT_NEGLECT_RECOVERY_COPY } from '../src/core/districtNeglectRecovery/districtNeglectRecoveryConstants';
import { ECE_STRATEGY_LINE_CONTENT_PACK } from '../src/core/eceStrategyLines/eceStrategyLineContentPack';
import {
  FOLLOW_UP_EXECUTION_ACTION_LINES,
  FOLLOW_UP_EXECUTION_RESULT_LINES,
} from '../src/core/followUpExecution/followUpExecutionConstants';
import { POSITIVE_COMEBACK_COPY } from '../src/core/positiveComeback/positiveComebackConstants';
import { DOMAIN_REASON_LINES } from '../src/core/resourcePressureDifferentiation/resourcePressureDifferentiationConstants';
import {
  auditCopyLines,
  detectRepeatedOpeningPhrases,
  detectRepeatedPhrases,
  detectTechnicalEnumLeak,
  selectDeterministicCopyVariant,
} from '../src/core/contentVarietyQuality';
import { verifyContentVarietyQualityScenario } from '../src/core/contentVarietyQuality/verifyContentVarietyQualityScenario';

function countLines(record: Record<string, readonly string[]>): number {
  return Object.values(record).reduce((sum, lines) => sum + lines.length, 0);
}

// eslint-disable-next-line no-console
console.log('=== Day 8+ Content Variety Expansion Analyzer ===\n');

// eslint-disable-next-line no-console
console.log('Total lines by module:');
// eslint-disable-next-line no-console
console.log(`  Ece: ${ECE_STRATEGY_LINE_CONTENT_PACK.length}`);
// eslint-disable-next-line no-console
console.log(`  CityRhythm: ${countLines(CITY_RHYTHM_COPY)}`);
// eslint-disable-next-line no-console
console.log(`  Day8Strategic: ${countLines(DAY8_STRATEGIC_CONTENT_COPY)}`);
// eslint-disable-next-line no-console
console.log(`  OperationFeed: ${countLines(DAY8_OPERATION_FEED_BIAS_COPY)}`);
// eslint-disable-next-line no-console
console.log(`  FollowUp action: ${countLines(FOLLOW_UP_EXECUTION_ACTION_LINES)}`);
// eslint-disable-next-line no-console
console.log(`  FollowUp result: ${countLines(FOLLOW_UP_EXECUTION_RESULT_LINES)}`);
// eslint-disable-next-line no-console
console.log(`  ResourcePressure: ${countLines(DOMAIN_REASON_LINES)}`);
// eslint-disable-next-line no-console
console.log(`  DominantStrategy: ${countLines(DOMINANT_STRATEGY_REFLECTION_LINES)}`);
// eslint-disable-next-line no-console
console.log(`  PositiveComeback: ${countLines(POSITIVE_COMEBACK_COPY)}`);
// eslint-disable-next-line no-console
console.log(`  DistrictNeglect: ${countLines(DISTRICT_NEGLECT_RECOVERY_COPY)}`);
// eslint-disable-next-line no-console
console.log(`  CityMemory: ${countLines(CITY_MEMORY_VISIBILITY_COPY_PACK)}`);

const eceDupes = detectRepeatedPhrases(ECE_STRATEGY_LINE_CONTENT_PACK.map((line) => line.text));
// eslint-disable-next-line no-console
console.log(`\nEce duplicate phrases: ${eceDupes.length}`);
const openings = detectRepeatedOpeningPhrases(ECE_STRATEGY_LINE_CONTENT_PACK.map((line) => line.text));
// eslint-disable-next-line no-console
console.log(`Ece repeated openings (>3): ${openings.length}`);

const enumLeaks = ECE_STRATEGY_LINE_CONTENT_PACK.filter((line) => detectTechnicalEnumLeak(line.text));
// eslint-disable-next-line no-console
console.log(`Technical enum leaks (ece): ${enumLeaks.length}`);

const sample = selectDeterministicCopyVariant({
  kind: 'social_trust_focus',
  surface: 'ece',
  day: 9,
  districtId: 'merkez',
  variants: DAY8_STRATEGIC_CONTENT_COPY.social_trust_focus,
});
// eslint-disable-next-line no-console
console.log(`\nDeterministic selector sample (day 9 social): ${sample}`);

const issues = auditCopyLines(DAY8_OPERATION_FEED_BIAS_COPY.follow_up_bias, {
  module: 'operation_feed',
  kind: 'follow_up_bias',
  surface: 'operation_feed',
});
// eslint-disable-next-line no-console
console.log(`Operation feed follow_up audit issues: ${issues.length}`);

const verify = verifyContentVarietyQualityScenario();
// eslint-disable-next-line no-console
console.log('\n=== verify summary ===');
// eslint-disable-next-line no-console
console.log(
  `${verify.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${verify.checks.filter((line) => line.startsWith('WARN')).length} WARN, ` +
    `${verify.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!verify.ok) {
  process.exit(1);
}
