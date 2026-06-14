/**
 * Diagnostic analyzer for map gameplay binding depth.
 * Calistir: npm run analyze:map-gameplay-depth
 */

import { buildMapGameplayBindings } from '../src/core/mapGameplayBinding/mapGameplayBindingModel';
import { buildMapGameplayBindingCardModels } from '../src/core/mapGameplayBinding/mapGameplayBindingPresentation';
import type { MapGameplayBindingInput } from '../src/core/mapGameplayBinding/mapGameplayBindingTypes';

type Scenario = {
  label: string;
  input: MapGameplayBindingInput;
};

const scenarios: Scenario[] = [
  { label: 'Day 1', input: { day: 1 } },
  {
    label: 'Day 3',
    input: {
      day: 3,
      activeEventIds: ['event-003'],
      activeOperationContext: { id: 'operation-003', districtId: 'merkez' },
      districtTrustSignals: { districtId: 'merkez', score: 58 },
      socialSignals: { districtId: 'merkez', heat: 'medium' },
    },
  },
  {
    label: 'Day 7',
    input: {
      day: 7,
      unlockedPermissionIds: ['assignment_fit_preview', 'district_trust_preview'],
      activeEventIds: ['event-007'],
      activeTaskRouteSignals: { routeId: 'route-007', districtId: 'sanayi' },
      operationSignals: { dominantDomain: 'vehicle_route', priorityDistrictId: 'sanayi' },
      districtTrustSignals: { districtId: 'sanayi', score: 49 },
    },
  },
  {
    label: 'Day 8',
    input: {
      day: 8,
      unlockedPermissionIds: ['assignment_fit_preview', 'resource_pressure_summary', 'district_trust_preview'],
      activeEventIds: ['event-008'],
      activeTaskRouteSignals: { routeId: 'route-008', districtId: 'cumhuriyet' },
      resourceSignals: { districtId: 'cumhuriyet', pressure: 'high' },
      personnelPresence: [{ id: 'team-008', districtId: 'cumhuriyet' }],
      vehiclePresence: [{ id: 'truck-008', districtId: 'cumhuriyet' }],
      containerPresence: [{ id: 'container-008', districtId: 'cumhuriyet' }],
      districtTrustSignals: { districtId: 'cumhuriyet', score: 52 },
    },
  },
  {
    label: 'Day 10',
    input: {
      day: 10,
      unlockedPermissionIds: [
        'assignment_fit_preview',
        'resource_pressure_summary',
        'district_trust_preview',
        'district_memory_trace_preview',
        'map_resource_layer',
        'map_trust_layer',
      ],
      activeEventIds: ['event-010'],
      activeTaskRouteSignals: { routeId: 'route-010', districtId: 'istasyon' },
      resourceSignals: { districtId: 'istasyon', pressure: 'medium' },
      districtTrustSignals: { districtId: 'istasyon', score: 67 },
      districtMemorySignals: { id: 'memory-010', districtId: 'istasyon' },
      decisionConsequenceSignals: { id: 'consequence-010', districtId: 'istasyon' },
      cityArchiveSignals: { id: 'archive-010', districtId: 'istasyon' },
      mapLayerStatuses: { district_trust: 'available', resource_pressure: 'available' },
    },
  },
];

let hasWarn = false;

for (const scenario of scenarios) {
  const bindings = buildMapGameplayBindings(scenario.input);
  const cards = buildMapGameplayBindingCardModels(bindings);
  const visible = bindings.filter((binding) => binding.visibilityLevel !== 'hidden');
  const roles = new Set(bindings.map((binding) => binding.role));
  const hiddenByGuard = bindings.filter((binding) => binding.visibilityLevel === 'hidden' && binding.guardReason).length;
  const strategic = bindings.some(
    (binding) =>
      scenario.input.day >= 8 &&
      binding.role !== 'overview' &&
      binding.sourceIds.length > 0 &&
      binding.visibilityLevel !== 'hidden',
  );
  const teaserCount = bindings.filter((binding) => binding.visibilityLevel === 'teaser').length;
  const detailedCount = bindings.filter((binding) => binding.visibilityLevel === 'detailed').length;
  const actionableCount = bindings.filter((binding) => binding.isActionable).length;

  // eslint-disable-next-line no-console
  console.log(`\n${scenario.label}`);
  // eslint-disable-next-line no-console
  console.log(`questions: ${visible.map((binding) => binding.playerQuestion).join(' | ') || 'none'}`);
  // eslint-disable-next-line no-console
  console.log(`roles=${roles.size} visible=${visible.length} cards=${cards.length} actionable=${actionableCount} teaser=${teaserCount} detailed=${detailedCount} hiddenByGuard=${hiddenByGuard}`);

  if (scenario.input.day === 1 && visible.filter((binding) => binding.role !== 'overview').length > 1) {
    hasWarn = true;
    // eslint-disable-next-line no-console
    console.log('WARN Day 1 too many non-overview bindings.');
  }
  if (scenario.input.day >= 8 && !strategic) {
    hasWarn = true;
    // eslint-disable-next-line no-console
    console.log('WARN Day 8+ strategic sourced binding yok.');
  } else if (scenario.input.day >= 8) {
    // eslint-disable-next-line no-console
    console.log('PASS Day 8+ sourced strategic binding var.');
  }
  if (teaserCount > 5) {
    hasWarn = true;
    // eslint-disable-next-line no-console
    console.log('WARN Too many teaser bindings.');
  }
  if (actionableCount > 8) {
    hasWarn = true;
    // eslint-disable-next-line no-console
    console.log('WARN Actionable binding count may become marker spam.');
  }
}

const allRoles = new Set(
  scenarios.flatMap((scenario) => buildMapGameplayBindings(scenario.input).map((binding) => binding.role)),
);

// eslint-disable-next-line no-console
console.log(`\nRole coverage: ${allRoles.size}`);
if (allRoles.size >= 5) {
  // eslint-disable-next-line no-console
  console.log('PASS 5+ MapGameplayRole can be produced.');
} else {
  hasWarn = true;
  // eslint-disable-next-line no-console
  console.log('WARN Fewer than 5 MapGameplayRole produced.');
}

// eslint-disable-next-line no-console
console.log(hasWarn ? '\nAnalyzer completed with WARN.' : '\nAnalyzer completed with PASS.');
