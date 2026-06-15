import { ACTIVE_OPERATION_MAP_PHASES } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { verifyActiveOperationMapBindingScenario } from '@/core/activeOperationMapBinding/verifyActiveOperationMapBindingScenario';
import { verifyDistrictPersonalityScenario } from '@/core/districtPersonality/verifyDistrictPersonalityScenario';
import { verifyMapGameplayBindingScenario } from '@/core/mapGameplayBinding/verifyMapGameplayBindingScenario';
import { verifyMapUiScenario } from '@/features/map/verifyMapUiScenario';
import { DISTRICT_CRITERION_IDS } from '@/core/districtPersonality/districtPersonalityTypes';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  MAP_SIGNAL_COPY_MAX_TEMPLATE_LENGTH,
  MAP_SIGNAL_COPY_MIN_TEMPLATE_LENGTH,
  MAP_SIGNAL_COPY_PANIC_TERMS,
  MAP_SIGNAL_COPY_PROHIBITED_TERMS,
  MAP_SIGNAL_COPY_TECHNICAL_ENUM_PATTERNS,
  MAP_SIGNAL_COPY_ACCESSIBILITY_MAX_LENGTH,
} from './mapSignalCopyConstants';
import { getMapSignalCopyTemplates } from './mapSignalCopyLines';
import {
  countActiveOperationPhaseTemplates,
  countDistrictCriterionTemplates,
  filterRepeatedMapSignalCopy,
  selectMapSignalCopy,
  satisfiesMapSignalSourceGuard,
} from './mapSignalCopyModel';
import {
  buildMapSignalAccessibilityLabel,
  selectActiveOperationMapCopy,
} from './mapSignalCopyPresentation';
import {
  MAP_SIGNAL_COPY_CONTEXTS,
  MAP_SIGNAL_COPY_DAY_POLICIES,
  MAP_SIGNAL_COPY_LINE_KINDS,
  MAP_SIGNAL_COPY_SOURCE_GUARDS,
  MAP_SIGNAL_COPY_TONES,
} from './mapSignalCopyTypes';

export type VerifyMapSignalCopyOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `✓ ${ok}` : `✗ ${fail}`);
  return pass;
}

function warn(checks: string[], pass: boolean, ok: string, message: string): void {
  checks.push(pass ? `✓ ${ok}` : `WARN ${message}`);
}

export function verifyMapSignalCopyScenario(): VerifyMapSignalCopyOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const templates = getMapSignalCopyTemplates();
  const ids = templates.map((template) => template.id);
  record(assert(checks, new Set(ids).size === ids.length, 'template ids unique', 'duplicate template ids'));
  record(
    assert(
      checks,
      templates.every((template) => MAP_SIGNAL_COPY_CONTEXTS.includes(template.context)),
      'context enum valid',
      'invalid context enum',
    ),
  );
  record(
    assert(
      checks,
      templates.every((template) => MAP_SIGNAL_COPY_LINE_KINDS.includes(template.kind)),
      'kind enum valid',
      'invalid kind enum',
    ),
  );
  record(
    assert(
      checks,
      templates.every((template) => MAP_SIGNAL_COPY_TONES.includes(template.tone)),
      'tone enum valid',
      'invalid tone enum',
    ),
  );
  record(
    assert(
      checks,
      templates.every((template) => MAP_SIGNAL_COPY_DAY_POLICIES.includes(template.dayPolicy)),
      'dayPolicy enum valid',
      'invalid dayPolicy enum',
    ),
  );
  record(
    assert(
      checks,
      templates.every((template) =>
        template.sourceGuards.every((guard) => MAP_SIGNAL_COPY_SOURCE_GUARDS.includes(guard)),
      ),
      'sourceGuards enum valid',
      'invalid sourceGuards enum',
    ),
  );
  record(
    assert(
      checks,
      templates.every((template) => template.text.trim().length > 0),
      'text not empty',
      'empty template text',
    ),
  );
  record(
    assert(
      checks,
      templates.every((template) => {
        const min =
          template.kind === 'next_action_line' ? 12 : MAP_SIGNAL_COPY_MIN_TEMPLATE_LENGTH;
        return (
          template.text.length >= min &&
          template.text.length <= template.maxLength &&
          template.maxLength <= MAP_SIGNAL_COPY_MAX_TEMPLATE_LENGTH
        );
      }),
      'text length within bounds',
      'text length violation',
    ),
  );
  record(
    assert(
      checks,
      templates.every(
        (template) => template.priority >= 0 && template.priority <= 100,
      ),
      'priority 0-100',
      'priority out of range',
    ),
  );

  const allText = templates.map((template) => template.text).join(' ').toLocaleLowerCase('tr-TR');
  record(
    assert(
      checks,
      !MAP_SIGNAL_COPY_TECHNICAL_ENUM_PATTERNS.some((pattern) => pattern.test(allText)),
      'no technical enum in copy',
      'technical enum leaked into copy',
    ),
  );
  record(
    assert(
      checks,
      !MAP_SIGNAL_COPY_PROHIBITED_TERMS.some((term) => allText.includes(term)),
      'no prohibited profiling terms',
      'prohibited profiling term found',
    ),
  );
  record(
    assert(
      checks,
      !MAP_SIGNAL_COPY_PANIC_TERMS.some((term) => allText.includes(term)),
      'no panic language in pack',
      'panic language found',
    ),
  );

  for (const phase of ACTIVE_OPERATION_MAP_PHASES) {
    record(
      assert(
        checks,
        countActiveOperationPhaseTemplates(phase, 'map_line') >= 3,
        `active operation ${phase} has 3+ map lines`,
        `active operation ${phase} missing map lines`,
      ),
    );
    record(
      assert(
        checks,
        countActiveOperationPhaseTemplates(phase, 'decision_line') >= 3,
        `active operation ${phase} has 3+ decision lines`,
        `active operation ${phase} missing decision lines`,
      ),
    );
  }

  for (const criterionId of DISTRICT_CRITERION_IDS) {
    record(
      assert(
        checks,
        countDistrictCriterionTemplates(criterionId, 'map_line') >= 5,
        `district ${criterionId} map_signal coverage`,
        `district ${criterionId} missing map_signal lines`,
      ),
    );
    record(
      assert(
        checks,
        countDistrictCriterionTemplates(criterionId, 'decision_line') >= 5,
        `district ${criterionId} decision_line coverage`,
        `district ${criterionId} missing decision lines`,
      ),
    );
    record(
      assert(
        checks,
        countDistrictCriterionTemplates(criterionId, 'next_action_line') >= 3,
        `district ${criterionId} next_action coverage`,
        `district ${criterionId} missing next_action lines`,
      ),
    );
  }

  const memoryWithoutSource = selectMapSignalCopy({
    context: 'district_memory',
    kind: 'map_line',
    day: 8,
  });
  record(
    assert(
      checks,
      memoryWithoutSource.isFallback,
      'memory line blocked without source',
      'memory line selected without source',
    ),
  );

  const memoryWithSource = selectMapSignalCopy({
    context: 'district_memory',
    kind: 'map_line',
    day: 8,
    sourceKinds: ['district_memory'],
    sourceIds: ['memory:merkez'],
  });
  record(
    assert(
      checks,
      !memoryWithSource.isFallback,
      'memory line allowed with source',
      'memory line blocked with source',
    ),
  );

  const routeWithoutSource = selectMapSignalCopy({
    context: 'route_support',
    kind: 'route_line',
    day: 8,
  });
  record(
    assert(
      checks,
      routeWithoutSource.isFallback,
      'route line blocked without source',
      'route line selected without source',
    ),
  );

  const routeWithSource = selectMapSignalCopy({
    context: 'route_support',
    kind: 'route_line',
    day: 8,
    sourceKinds: ['active_task_route'],
    sourceIds: ['route:evt_1'],
  });
  record(
    assert(
      checks,
      !routeWithSource.isFallback,
      'route line allowed with source',
      'route line blocked with source',
    ),
  );

  const tomorrowWithoutSource = selectMapSignalCopy({
    context: 'tomorrow_risk',
    kind: 'decision_line',
    day: 8,
  });
  record(
    assert(
      checks,
      tomorrowWithoutSource.isFallback,
      'tomorrow line blocked without pressure source',
      'tomorrow line selected without source',
    ),
  );

  const tomorrowWithSource = selectMapSignalCopy({
    context: 'tomorrow_risk',
    kind: 'decision_line',
    day: 8,
    pressureKind: 'route_pressure',
    sourceKinds: ['tomorrow_risk'],
    sourceIds: ['tomorrow:route'],
  });
  record(
    assert(
      checks,
      !tomorrowWithSource.isFallback,
      'tomorrow line allowed with pressure source',
      'tomorrow line blocked with source',
    ),
  );

  const authorityWithoutPermission = selectMapSignalCopy({
    context: 'authority_layer',
    kind: 'locked_teaser',
    day: 10,
    permissionAvailable: false,
    visibilityLevel: 'summary',
    sourceKinds: ['authority_permission'],
    sourceIds: ['permission:map_trust_layer'],
  });
  record(
    assert(
      checks,
      authorityWithoutPermission.isFallback,
      'authority detailed blocked without permission',
      'authority detailed without permission',
    ),
  );

  const authorityWithPermission = selectMapSignalCopy({
    context: 'authority_layer',
    kind: 'locked_teaser',
    day: 10,
    permissionAvailable: true,
    visibilityLevel: 'detailed',
    sourceKinds: ['authority_permission'],
    sourceIds: ['permission:map_trust_layer'],
  });
  record(
    assert(
      checks,
      !authorityWithPermission.isFallback,
      'authority detailed allowed with permission',
      'authority detailed blocked with permission',
    ),
  );

  const fallbackLine = selectMapSignalCopy({
    context: 'fallback',
    kind: 'map_line',
    day: 3,
  });
  record(
    assert(
      checks,
      fallbackLine.isFallback || fallbackLine.confidence === 'low',
      'fallback does not fake live claim',
      'fallback claims live source',
    ),
  );

  const day1Copy = selectActiveOperationMapCopy({
    phase: 'before_inspect',
    day: 1,
    sourceIds: ['event:evt_1'],
    sourceKinds: ['active_event'],
  });
  record(
    assert(
      checks,
      day1Copy.mapLine.length <= 76,
      'day 1 active operation line stays mobile-short',
      'day 1 line too long',
    ),
  );

  const day8Strategic = selectMapSignalCopy({
    context: 'resource_pressure',
    kind: 'pressure_line',
    day: 8,
    pressureKind: 'resource_pressure',
    sourceKinds: ['resource_pressure'],
    sourceIds: ['resource:merkez'],
  });
  record(
    assert(
      checks,
      !day8Strategic.isFallback,
      'day 8+ sourced strategic line selectable',
      'day 8 strategic line missing',
    ),
  );

  const first = selectMapSignalCopy({
    context: 'active_operation',
    kind: 'map_line',
    day: 8,
    operationPhase: 'planning',
    sourceIds: ['event:evt_a'],
    sourceKinds: ['active_event'],
  });
  const second = selectMapSignalCopy({
    context: 'active_operation',
    kind: 'map_line',
    day: 8,
    operationPhase: 'planning',
    sourceIds: ['event:evt_a'],
    sourceKinds: ['active_event'],
    recentTemplateIds: [first.sourceTemplateId],
  });
  record(
    assert(
      checks,
      second.sourceTemplateId !== first.sourceTemplateId,
      'repetition guard avoids immediate duplicate',
      'repetition guard failed',
    ),
  );

  const repeated = filterRepeatedMapSignalCopy(
    [first, { ...first, id: 'dup' }],
    [],
  );
  record(
    assert(
      checks,
      repeated.length === 1,
      'filterRepeatedMapSignalCopy removes exact duplicate',
      'duplicate filter failed',
    ),
  );

  const a11y = buildMapSignalAccessibilityLabel({
    phaseLabel: 'Plan hazırlanıyor: Rota daralması',
    mapLine: 'Harita baskısı plan seçimini önemli kılıyor.',
    decisionLine: 'Ekip, araç ve yaklaşım uyumunu kontrol et.',
    ctaLabel: 'Takip Et',
  });
  record(assert(checks, a11y.trim().length > 0, 'accessibility label not empty', 'empty a11y label'));
  record(
    assert(
      checks,
      a11y.length <= MAP_SIGNAL_COPY_ACCESSIBILITY_MAX_LENGTH,
      'accessibility label within 140 chars',
      'a11y label too long',
    ),
  );

  record(assert(checks, templates.length >= 4, 'core gameplay copy pool exists', 'template pool too small'));
  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged', `SAVE_VERSION is ${SAVE_VERSION}`));

  const nested: Array<{ name: string; run: () => { ok: boolean } }> = [
    { name: 'verify:active-operation-map-binding', run: verifyActiveOperationMapBindingScenario },
    { name: 'verify:map-gameplay-binding', run: verifyMapGameplayBindingScenario },
    { name: 'verify:district-personality', run: verifyDistrictPersonalityScenario },
    { name: 'verify:map-ui', run: verifyMapUiScenario },
  ];

  for (const item of nested) {
    const outcome = item.run();
    record(
      assert(
        checks,
        outcome.ok,
        `${item.name} nested — ok`,
        `${item.name} nested — failed`,
      ),
    );
  }

  const repetitionCounts = new Map<string, number>();
  for (let day = 1; day <= 10; day += 1) {
    const result = selectActiveOperationMapCopy({
      phase: 'planning',
      day,
      sourceIds: [`event:sample_${day}`],
      sourceKinds: ['active_event'],
    });
    repetitionCounts.set(result.mapLine, (repetitionCounts.get(result.mapLine) ?? 0) + 1);
  }
  const maxRepeat = Math.max(...repetitionCounts.values(), 0);
  warn(
    checks,
    maxRepeat <= 3,
    '10-day sample repetition within threshold',
    `same exact text repeated ${maxRepeat} times in 10-day sample`,
  );

  return { ok, warn: checks.some((line) => line.startsWith('WARN')), checks };
}
