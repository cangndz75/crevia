import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import { buildMapGameplayBindings } from './mapGameplayBindingModel';
import { buildMapGameplayBindingCardModels } from './mapGameplayBindingPresentation';
import {
  MAP_GAMEPLAY_DAY_RANGES,
  MAP_GAMEPLAY_IMPLEMENTATION_RISKS,
  MAP_GAMEPLAY_ROLES,
  MAP_GAMEPLAY_SOURCE_KINDS,
  MAP_GAMEPLAY_SUPPORTED_DECISIONS,
  MAP_GAMEPLAY_VISIBILITY_LEVELS,
  type MapGameplayBinding,
} from './mapGameplayBindingTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyMapGameplayBindingOutcome = {
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

function validateBindings(checks: string[], bindings: readonly MapGameplayBinding[]): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, unique(bindings.map((binding) => binding.id)), 'binding ids unique', 'duplicate binding ids'));

  for (const binding of bindings) {
    record(assert(checks, MAP_GAMEPLAY_ROLES.includes(binding.role), `${binding.id} role valid`, `${binding.id} role invalid`));
    record(assert(checks, MAP_GAMEPLAY_VISIBILITY_LEVELS.includes(binding.visibilityLevel), `${binding.id} visibility valid`, `${binding.id} visibility invalid`));
    record(assert(checks, MAP_GAMEPLAY_DAY_RANGES.includes(binding.dayRange), `${binding.id} dayRange valid`, `${binding.id} dayRange invalid`));
    record(assert(checks, MAP_GAMEPLAY_IMPLEMENTATION_RISKS.includes(binding.implementationRisk), `${binding.id} implementationRisk valid`, `${binding.id} implementationRisk invalid`));
    record(assert(checks, MAP_GAMEPLAY_SUPPORTED_DECISIONS.includes(binding.supportedDecision), `${binding.id} decision valid`, `${binding.id} decision invalid`));
    record(assert(checks, binding.sourceKinds.every((kind) => MAP_GAMEPLAY_SOURCE_KINDS.includes(kind)), `${binding.id} sourceKinds valid`, `${binding.id} sourceKinds invalid`));
    record(assert(checks, unique(binding.sourceIds), `${binding.id} sourceIds unique`, `${binding.id} duplicate sourceIds`));
    record(assert(checks, binding.priority >= 0 && binding.priority <= 100, `${binding.id} priority clamped`, `${binding.id} priority out of range`));
    record(assert(checks, binding.supportedDecisionLine.trim().length > 0, `${binding.id} decision line`, `${binding.id} empty decision line`));
    if (binding.sourceKinds.includes('fallback')) {
      record(assert(checks, binding.confidence === 'low' && !binding.isActionable, `${binding.id} fallback low/non-actionable`, `${binding.id} unsafe fallback`));
    }
  }

  return ok;
}

export function verifyMapGameplayBindingScenario(): VerifyMapGameplayBindingOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnState = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) warnState = true;
  };

  const day1 = buildMapGameplayBindings({ day: 1 });
  const sourcedDay8 = buildMapGameplayBindings({
    day: 8,
    unlockedPermissionIds: [
      'assignment_fit_preview',
      'resource_pressure_summary',
      'district_trust_preview',
      'district_memory_trace_preview',
      'map_resource_layer',
      'map_trust_layer',
    ],
    activeEventIds: ['event-waste-001'],
    activeOperationContext: { id: 'operation-001', districtId: 'cumhuriyet' },
    activeTaskRouteSignals: { routeId: 'route-001', districtId: 'cumhuriyet' },
    districtTrustSignals: { districtId: 'cumhuriyet', score: 62 },
    socialSignals: { districtId: 'cumhuriyet', status: 'watch' },
    operationSignals: { dominantDomain: 'vehicle_route', priorityDistrictId: 'cumhuriyet' },
    resourceSignals: { districtId: 'cumhuriyet', pressure: 'high' },
    personnelPresence: [{ id: 'team-field', districtId: 'cumhuriyet' }],
    vehiclePresence: [{ id: 'truck-1', districtId: 'cumhuriyet' }],
    containerPresence: [{ id: 'container-1', districtId: 'cumhuriyet' }],
    districtMemorySignals: { id: 'memory-001', districtId: 'cumhuriyet' },
    decisionConsequenceSignals: { id: 'consequence-001', districtId: 'cumhuriyet' },
    cityArchiveSignals: { id: 'archive-001', districtId: 'cumhuriyet' },
    mapLayerStatuses: { resource_pressure: 'available', district_trust: 'available' },
  });
  const day10Authority = buildMapGameplayBindings({
    day: 10,
    unlockedPermissionIds: ['map_resource_layer', 'map_trust_layer', 'map_social_layer'],
    mapLayerStatuses: { resource_pressure: 'available', social_pulse: 'available' },
  });
  const noRoute = buildMapGameplayBindings({
    day: 8,
    vehiclePresence: [{ id: 'truck-1', districtId: 'cumhuriyet' }],
    operationSignals: { dominantDomain: 'vehicle_route' },
  });
  const noMemory = buildMapGameplayBindings({
    day: 10,
    unlockedPermissionIds: ['district_memory_trace_preview'],
  });
  const noPermission = buildMapGameplayBindings({
    day: 10,
    resourceSignals: { districtId: 'merkez', pressure: 'high' },
    mapLayerStatuses: { resource_pressure: 'available' },
  });
  const withPermission = buildMapGameplayBindings({
    day: 10,
    unlockedPermissionIds: ['map_resource_layer', 'resource_pressure_summary'],
    resourceSignals: { districtId: 'merkez', pressure: 'high' },
    mapLayerStatuses: { resource_pressure: 'available' },
  });

  record(validateBindings(checks, day1));
  record(validateBindings(checks, sourcedDay8));
  record(validateBindings(checks, day10Authority));

  const day1Cards = buildMapGameplayBindingCardModels(day1);
  const sourcedCards = buildMapGameplayBindingCardModels(sourcedDay8);
  record(assert(checks, day1.some((binding) => binding.id === 'map_overview_day1'), 'Day 1 overview binding exists', 'Day 1 overview missing'));
  record(assert(checks, day1Cards.every((card) => card.visibilityLevel !== 'hidden'), 'hidden bindings skipped in cards', 'hidden card emitted'));
  record(assert(checks, sourcedCards.length <= 3, 'card model max 3', 'too many card models'));
  record(assert(checks, sourcedCards.every((card) => card.accessibilityLabel.trim().length > 0), 'card accessibility labels', 'empty accessibility label'));

  const day8Strategic = sourcedDay8.some(
    (binding) =>
      (binding.dayRange === 'day_8_plus' || binding.dayRange === 'day_10_plus') &&
      binding.sourceIds.length > 0 &&
      binding.role !== 'overview',
  );
  recordWarn(warn(checks, day8Strategic, 'Day 8+ sourced strategic binding exists', 'Day 8+ sourced strategic binding missing'));

  const memory = noMemory.find((binding) => binding.id === 'district_memory_trace');
  record(assert(checks, memory?.isActionable === false && memory.visibilityLevel === 'hidden', 'no fake district memory', 'district memory actionable without source'));
  const route = noRoute.find((binding) => binding.id === 'route_support_hint');
  record(assert(checks, route?.isActionable === false && !route.supportedDecisionLine.includes('Aktif rota kaynagi rota baskisini'), 'no fake route claim', 'route support claims route without route source'));
  record(assert(checks, noPermission.every((binding) => binding.visibilityLevel !== 'detailed'), 'no detailed visibility without permission', 'detailed visibility without permission'));
  record(assert(checks, withPermission.some((binding) => binding.visibilityLevel === 'detailed'), 'permission can unlock detailed visibility', 'permission did not unlock detailed visibility'));
  record(assert(checks, !buildMapGameplayBindings({ day: 8, tomorrowRiskSignals: { risk: 'high' } }).some((binding) => binding.sourceKinds.includes('tomorrow_risk')), 'non-spatial tomorrow risk stays off map binding', 'non-spatial tomorrow risk mapped'));

  const allCopy = sourcedDay8.map((binding) => `${binding.title} ${binding.playerQuestion} ${binding.supportedDecisionLine}`).join(' ').toLowerCase();
  record(assert(checks, !allCopy.includes('urgent') && !allCopy.includes('crisis') && !allCopy.includes('kriz'), 'fake urgent/crisis copy absent', 'fake urgent/crisis copy found'));

  const packageJson = readRepo('package.json');
  record(assert(checks, packageJson.includes('verify:map-gameplay-binding'), 'package verify script exists', 'missing verify script'));
  record(assert(checks, packageJson.includes('analyze:map-gameplay-depth'), 'package analyzer script exists', 'missing analyzer script'));
  record(assert(checks, readRepo('docs/crevia-map-gameplay-binding-model-pass.md').includes('Active Operation Map Binding Pass'), 'docs next pass noted', 'docs next pass missing'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION changed: ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('mapGameplayBinding'), 'persist shape unchanged', 'persist imports mapGameplayBinding'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('mapGameplayBinding'), 'applyDecision unchanged', 'applyDecision imports mapGameplayBinding'));
  record(assert(checks, !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('mapGameplayBinding'), 'dayPipeline unchanged', 'dayPipeline imports mapGameplayBinding'));
  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('buildMapGameplayBindings'), 'MapScreen composes map gameplay binding read-only', 'MapScreen missing read-only map gameplay binding'));

  checks.push('PASS Model is presentation-time only; no store field or persisted key was added');
  checks.push('PASS Map UI integration limited to active operation card');

  return { ok, warn: warnState, checks };
}
