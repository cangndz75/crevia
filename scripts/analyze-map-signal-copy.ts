/**
 * Map Signal Copy diagnostic audit.
 * Calistir: npm run analyze:map-signal-copy
 */

import { ACTIVE_OPERATION_MAP_PHASES } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import { DISTRICT_CRITERION_IDS } from '@/core/districtPersonality/districtPersonalityTypes';
import {
  MAP_SIGNAL_COPY_IDEAL_LENGTH_BY_KIND,
  MAP_SIGNAL_COPY_PROHIBITED_TERMS,
  MAP_SIGNAL_COPY_TECHNICAL_ENUM_PATTERNS,
} from '@/core/mapSignalCopy/mapSignalCopyConstants';
import { getMapSignalCopyTemplates } from '@/core/mapSignalCopy/mapSignalCopyLines';
import {
  countActiveOperationPhaseTemplates,
  countDistrictCriterionTemplates,
  selectMapSignalCopy,
} from '@/core/mapSignalCopy/mapSignalCopyModel';
import { selectActiveOperationMapCopy } from '@/core/mapSignalCopy/mapSignalCopyPresentation';

// eslint-disable-next-line no-console
console.log('Map Signal Copy audit\n');

const templates = getMapSignalCopyTemplates();
// eslint-disable-next-line no-console
console.log(`Templates total=${templates.length}`);

const byContext = new Map<string, number>();
for (const template of templates) {
  byContext.set(template.context, (byContext.get(template.context) ?? 0) + 1);
}
// eslint-disable-next-line no-console
console.log('\nContext counts:');
for (const [context, count] of [...byContext.entries()].sort((a, b) => b[1] - a[1])) {
  // eslint-disable-next-line no-console
  console.log(`  ${context}: ${count}`);
}

// eslint-disable-next-line no-console
console.log('\nDay policy samples:');
for (const day of [1, 4, 8, 12]) {
  const copy = selectActiveOperationMapCopy({
    phase: 'planning',
    day,
    sourceIds: [`event:audit_${day}`],
    sourceKinds: ['active_event'],
  });
  // eslint-disable-next-line no-console
  console.log(`  Day ${day}: ${copy.mapLine}`);
}

const warnings: string[] = [];
const failures: string[] = [];

for (const phase of ACTIVE_OPERATION_MAP_PHASES) {
  if (countActiveOperationPhaseTemplates(phase, 'map_line') < 3) {
    failures.push(`phase ${phase} has <3 map_line templates`);
  }
}

for (const criterionId of DISTRICT_CRITERION_IDS) {
  if (countDistrictCriterionTemplates(criterionId, 'map_line') < 5) {
    failures.push(`criterion ${criterionId} has <5 map_line templates`);
  }
}

const textCounts = new Map<string, number>();
for (let day = 1; day <= 10; day += 1) {
  const result = selectMapSignalCopy({
    context: 'active_operation',
    kind: 'map_line',
    day,
    operationPhase: 'inspecting',
    sourceIds: [`event:rep_${day}`],
    sourceKinds: ['active_event'],
  });
  textCounts.set(result.text, (textCounts.get(result.text) ?? 0) + 1);
}
const maxRepeat = Math.max(...textCounts.values(), 0);
if (maxRepeat > 3) {
  warnings.push(`exact text repeated ${maxRepeat} times in 10-day inspecting sample`);
}

let blockedWithoutSource = 0;
const guardedContexts = [
  ['district_memory', 'map_line'],
  ['route_support', 'route_line'],
  ['tomorrow_risk', 'decision_line'],
] as const;
for (const [context, kind] of guardedContexts) {
  const blocked = selectMapSignalCopy({ context, kind, day: 8 });
  if (!blocked.isFallback) {
    failures.push(`${context} selected without required source`);
  } else {
    blockedWithoutSource += 1;
  }
}

const allText = templates.map((template) => template.text).join(' ').toLocaleLowerCase('tr-TR');
if (MAP_SIGNAL_COPY_PROHIBITED_TERMS.some((term) => allText.includes(term))) {
  failures.push('prohibited profiling term detected');
}
if (MAP_SIGNAL_COPY_TECHNICAL_ENUM_PATTERNS.some((pattern) => pattern.test(allText))) {
  failures.push('technical enum detected in copy');
}

for (const template of templates) {
  const ideal = MAP_SIGNAL_COPY_IDEAL_LENGTH_BY_KIND[template.kind];
  if (template.text.length > ideal.max) {
    warnings.push(`${template.id} exceeds ideal max (${template.text.length}>${ideal.max})`);
  }
}

// eslint-disable-next-line no-console
console.log(`\nSource guard blocked samples: ${blockedWithoutSource}/${guardedContexts.length}`);

if (failures.length) {
  // eslint-disable-next-line no-console
  console.log(`\nFAIL: ${failures.join('; ')}`);
  process.exit(1);
}

if (warnings.length) {
  // eslint-disable-next-line no-console
  console.log(`\nWARN: ${warnings.join('; ')}`);
}

// eslint-disable-next-line no-console
console.log('\nMap signal copy audit complete.');
