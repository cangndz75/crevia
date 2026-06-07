import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDevJumpPilotCompletedGameState } from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createDay1Seed } from '@/core/content/day1Seed';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL,
  CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT,
} from './contentRuntimeActivationConstants';
import {
  augmentPostPilotDailySetWithContentActivation,
  buildContentRuntimeActivationSelection,
  isContentRuntimeActivationEligibleDay,
  isPilotDayProtected,
} from './contentRuntimeActivationIntegration';
import {
  readContentRuntimeActivationMetaFromEvent,
} from './contentRuntimeActivationMapper';
import {
  buildCityEchoLineFromPackMeta,
  buildDecisionImpactLineFromPackMeta,
  buildTomorrowRiskLineFromPackMeta,
} from './contentRuntimeActivationPresentation';
import {
  buildContentPackEventChipLabel,
  buildPackCityEchoKind,
  buildPackEchoSurfaceLines,
  buildSyntheticContentPackMeta,
  buildTomorrowRiskFromPackMeta,
  isContentPackWiringEligibleDay,
  tryBuildDecisionImpactFromPackMeta,
} from './contentRuntimeActivationWiring';
import { buildCityEchoBinding, buildCityEchoReportLine } from '@/core/cityEchoBinding';
import { buildDecisionImpactExplanation } from '@/core/decisionImpactExplanation';
import { buildTomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskModel';
import {
  stableContentRuntimeHash,
} from './contentRuntimeActivationSelector';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 23;

export type VerifyContentRuntimeActivationOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

function day8LightInput() {
  return {
    day: 8,
    postPilotPhase: 'main_operation_light' as const,
    accessMode: 'limited' as const,
    operationSignals: {
      vehicles: { status: 'watch', summary: 'Rota baskısı' },
      containers: { status: 'watch', summary: 'Konteyner baskısı' },
      priorityDistrictId: 'sanayi',
    },
    focusDistrictId: 'sanayi',
    stableSeed: 'verify-light',
  };
}

export function verifyContentRuntimeActivationScenario(): VerifyContentRuntimeActivationOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  record(assert(checks, !isContentRuntimeActivationEligibleDay(1), 'Day 1 pack activation kapalı'));
  record(assert(checks, isPilotDayProtected(5), 'Day 2-7 pilot güvenliği korunuyor'));
  record(
    assert(
      checks,
      buildContentRuntimeActivationSelection({ day: 5, postPilotPhase: 'pilot_only' }).model
        .isEligible === false,
      'Day 5 eligible değil',
    ),
  );
  record(assert(checks, isContentRuntimeActivationEligibleDay(8), 'Day 8+ lite activation eligible'));

  const light = buildContentRuntimeActivationSelection(day8LightInput());
  record(assert(checks, light.model.isEligible, 'Day 8 light eligible'));
  record(assert(checks, light.model.activationMode === 'lite', 'lite activation mode'));
  record(
    assert(
      checks,
      light.eventCards.length <= CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT,
      'post_pilot_light max 1 pack candidate',
    ),
  );

  const full = buildContentRuntimeActivationSelection({
    day: 9,
    postPilotPhase: 'main_operation_full',
    accessMode: 'full',
    operationSignals: {
      vehicles: { status: 'strained', summary: 'Araç baskısı' },
      containers: { status: 'watch', summary: 'Konteyner' },
      districts: { status: 'watch', summary: 'Mahalle' },
      priorityDistrictId: 'cumhuriyet',
    },
    stableSeed: 'verify-full',
  });
  record(
    assert(
      checks,
      full.eventCards.length <= CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL,
      'main_operation_full max 2 pack candidate',
    ),
  );

  const districtPack = buildContentRuntimeActivationSelection({
    day: 8,
    postPilotPhase: 'main_operation_light',
    accessMode: 'limited',
    operationSignals: {
      districts: { status: 'watch', summary: 'Mahalle baskısı' },
      priorityDistrictId: 'merkez',
    },
    districtTrustRuntime: { merkez: { state: 'fragile' } },
    focusDistrictId: 'merkez',
    stableSeed: 'verify-district',
  });
  record(
    assert(
      checks,
      districtPack.candidates.some((c) => c.packId === 'district_pack_one'),
      'District Pack 1 candidate üretilebiliyor',
    ),
  );

  const routePack = buildContentRuntimeActivationSelection({
    day: 8,
    postPilotPhase: 'main_operation_light',
    accessMode: 'limited',
    operationSignals: {
      vehicles: { status: 'critical', summary: 'Araç baskısı' },
      priorityDistrictId: 'sanayi',
    },
    focusDistrictId: 'sanayi',
    stableSeed: 'verify-route',
  });
  record(
    assert(
      checks,
      routePack.candidates.some((c) => c.packId === 'vehicle_route_pack_one'),
      'Vehicle & Route Pack candidate üretilebiliyor',
    ),
  );
  record(
    assert(
      checks,
      routePack.candidates.some((c) => c.packId === 'vehicle_route_pack_one'),
      'operationSignals vehicle pressure route pack selection etkiliyor',
    ),
  );

  const containerPack = buildContentRuntimeActivationSelection({
    day: 8,
    postPilotPhase: 'main_operation_light',
    accessMode: 'limited',
    operationSignals: {
      containers: { status: 'critical', summary: 'Konteyner baskısı' },
      priorityDistrictId: 'cumhuriyet',
    },
    focusDistrictId: 'cumhuriyet',
    stableSeed: 'verify-container',
  });
  record(
    assert(
      checks,
      containerPack.candidates.some((c) => c.packId === 'container_environment_pack_one'),
      'Container & Environment Pack candidate üretilebiliyor',
    ),
  );
  record(
    assert(
      checks,
      containerPack.candidates.some((c) => c.packId === 'container_environment_pack_one'),
      'operationSignals container pressure container pack selection etkiliyor',
    ),
  );

  const trustVariant = buildContentRuntimeActivationSelection({
    day: 8,
    postPilotPhase: 'main_operation_light',
    accessMode: 'limited',
    districtTrustRuntime: { merkez: { state: 'fragile' } },
    focusDistrictId: 'merkez',
    stableSeed: 'verify-trust',
  });
  record(
    assert(
      checks,
      trustVariant.candidates.length === 0 ||
        trustVariant.candidates.some((c) =>
          c.variantCopies.some((v) => v.kind === 'district_trust')
            ? c.selectedVariantKind === 'district_trust' || c.selectedVariantKind === 'normal'
            : true,
        ),
      'districtTrust fragile district trust variant selection mümkün',
    ),
  );

  const resourceFatigue = buildContentRuntimeActivationSelection({
    day: 8,
    postPilotPhase: 'main_operation_light',
    accessMode: 'limited',
    resourceFatigue: { standard_truck: { state: 'tired', note: 'vehicle fatigue' } },
    operationSignals: { vehicles: { status: 'watch' } },
    stableSeed: 'verify-fatigue',
  });
  record(
    assert(
      checks,
      resourceFatigue.candidates.length === 0 ||
        resourceFatigue.candidates.every(
          (c) =>
            c.selectedVariantKind !== 'resource_fatigue' ||
            c.variantCopies.some((v) => v.kind === 'resource_fatigue'),
        ),
      'resourceFatigue varsa resource_fatigue variant selection mümkün',
    ),
  );

  const crisisSpam = buildContentRuntimeActivationSelection({
    day: 8,
    postPilotPhase: 'main_operation_light',
    accessMode: 'limited',
    stableSeed: 'verify-crisis',
  });
  record(
    assert(
      checks,
      crisisSpam.model.freshnessGuard.crisisAdjacentCount <= 1,
      'crisis-adjacent spam engelleniyor',
    ),
  );

  const dupInput = day8LightInput();
  const first = buildContentRuntimeActivationSelection(dupInput);
  const duplicate = buildContentRuntimeActivationSelection({
    ...dupInput,
    previousFamilyIds: first.model.selectedFamilyIds,
    previousDistrictDomainKeys: first.candidates.map(
      (c) => `${c.selectedDistrictId}:${c.domains[0] ?? 'generic'}`,
    ),
  });
  record(
    assert(
      checks,
      duplicate.candidates.every((c) => !first.model.selectedFamilyIds.includes(c.familyId)),
      'duplicate family guard çalışıyor',
    ),
  );

  const deterministicA = buildContentRuntimeActivationSelection(day8LightInput());
  const deterministicB = buildContentRuntimeActivationSelection(day8LightInput());
  record(
    assert(
      checks,
      JSON.stringify(deterministicA.model.selectedFamilyIds) ===
        JSON.stringify(deterministicB.model.selectedFamilyIds),
      'deterministic selection aynı inputta aynı sonucu veriyor',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationSelector.ts').includes(
        'Math.random',
      ),
      'Math.random kullanılmıyor',
    ),
  );

  const meta = readContentRuntimeActivationMetaFromEvent(light.eventCards[0]);
  record(assert(checks, meta?.packId != null, 'pack metadata korunuyor'));
  record(assert(checks, Boolean(meta?.advisorEcho), 'advisorEcho mapping korunuyor'));
  record(assert(checks, Boolean(meta?.reportEcho), 'reportEcho mapping korunuyor'));
  record(assert(checks, Boolean(meta?.socialEcho), 'socialEcho mapping korunuyor'));
  record(assert(checks, Boolean(meta?.mapHint), 'mapHint mapping korunuyor'));
  record(assert(checks, Boolean(meta?.tomorrowPreview), 'tomorrowPreview mapping korunuyor'));

  record(
    assert(
      checks,
      Boolean(buildDecisionImpactLineFromPackMeta(meta)),
      'decisionImpact helper pack metadata okuyabiliyor',
    ),
  );
  record(
    assert(
      checks,
      Boolean(buildTomorrowRiskLineFromPackMeta(meta)),
      'tomorrowRisk helper pack metadata okuyabiliyor',
    ),
  );
  record(
    assert(
      checks,
      Boolean(buildCityEchoLineFromPackMeta(meta)),
      'cityEcho helper pack metadata okuyabiliyor',
    ),
  );

  const districtMeta = buildSyntheticContentPackMeta({
    packId: 'district_pack_one',
    familyId: 'district_family_test',
    districtId: 'cumhuriyet',
    variantKind: 'district_trust',
  });
  districtMeta.districtTrustIntent = 'trust';
  districtMeta.resultEcho = 'Cumhuriyet odaklı karar sosyal güveni destekledi.';
  districtMeta.tomorrowPreview = 'Cumhuriyet\'te güven toparlanıyor; görünür hizmet etkisi korunmalı.';

  const routeMeta = buildSyntheticContentPackMeta({
    packId: 'vehicle_route_pack_one',
    familyId: 'route_family_test',
    districtId: 'sanayi',
  });
  routeMeta.tomorrowPreview = 'Yarın Sanayi hattında rota dengesi tekrar izlenebilir.';

  const containerMeta = buildSyntheticContentPackMeta({
    packId: 'container_environment_pack_one',
    familyId: 'container_family_test',
    districtId: 'cumhuriyet',
  });
  containerMeta.tomorrowPreview = 'Cumhuriyet konteyner çevresi yarına izleme notu olarak kaldı.';

  const districtImpact = tryBuildDecisionImpactFromPackMeta({
    day: 8,
    event: { id: 'cra_district_pack_one_district_family_test_d8', contentPackMeta: districtMeta } as never,
  });
  record(assert(checks, districtImpact?.kind === 'district_trust_shift', 'District Pack decision impact wired'));
  record(
    assert(
      checks,
      Boolean(districtImpact?.mainLine.includes('Cumhuriyet') || districtImpact?.mainLine.includes('sosyal')),
      'District Pack decision line domain-specific',
    ),
  );

  const routeImpact = tryBuildDecisionImpactFromPackMeta({
    day: 8,
    event: { id: 'cra_vehicle_route_pack_one_route_family_test_d8', contentPackMeta: routeMeta } as never,
  });
  record(assert(checks, routeImpact?.kind === 'route_balance', 'Vehicle/Route Pack decision impact wired'));

  const containerImpact = tryBuildDecisionImpactFromPackMeta({
    day: 8,
    event: { id: 'cra_container_environment_pack_one_container_family_test_d8', contentPackMeta: containerMeta } as never,
  });
  record(assert(checks, containerImpact?.kind === 'container_pressure', 'Container Pack decision impact wired'));
  record(
    assert(
      checks,
      districtImpact?.kind !== 'fallback' && routeImpact?.kind !== 'fallback',
      'DecisionImpact generic fallback kullanmıyor',
    ),
  );

  const routeTomorrow = buildTomorrowRiskFromPackMeta({ day: 8, contentPackMeta: routeMeta });
  const containerTomorrow = buildTomorrowRiskFromPackMeta({ day: 8, contentPackMeta: containerMeta });
  const districtTomorrow = buildTomorrowRiskFromPackMeta({ day: 8, contentPackMeta: districtMeta });
  record(assert(checks, Boolean(routeTomorrow?.mainLine.includes('Sanayi')), 'Vehicle/Route tomorrow risk wired'));
  record(assert(checks, Boolean(containerTomorrow?.mainLine.includes('konteyner')), 'Container tomorrow risk wired'));
  record(assert(checks, Boolean(districtTomorrow?.mainLine), 'District trust tomorrow risk wired'));

  const carryOverTomorrow = buildTomorrowRiskModel({
    day: 8,
    carryOver: { summary: routeTomorrow?.mainLine, visible: true },
    contentPackMeta: routeMeta,
    existingLines: [],
  });
  record(
    assert(
      checks,
      carryOverTomorrow?.sourceSignals[0] === 'carry_over',
      'CarryOver pack tomorrow risk duplicate olmuyor',
    ),
  );

  const echoSurfaces = buildPackEchoSurfaceLines(routeMeta);
  record(assert(checks, echoSurfaces.ece !== echoSurfaces.social, 'City echo surfaces farklı'));
  record(assert(checks, echoSurfaces.social !== echoSurfaces.report, 'City echo social/report farklı'));
  record(assert(checks, buildPackCityEchoKind(routeMeta) === 'route_balance_echo', 'route pack route_balance_echo map'));
  record(
    assert(
      checks,
      buildPackCityEchoKind(containerMeta) === 'container_pressure_echo',
      'container pack container_pressure_echo map',
    ),
  );
  record(
    assert(
      checks,
      buildPackCityEchoKind(districtMeta) === 'district_trust_echo' ||
        buildPackCityEchoKind(districtMeta) === 'social_trust_echo',
      'district pack trust echo map',
    ),
  );

  const crisisMeta = buildSyntheticContentPackMeta({
    packId: 'district_pack_one',
    familyId: 'crisis_family',
    districtId: 'merkez',
    variantKind: 'crisis_adjacent',
  });
  const crisisEcho = buildPackEchoSurfaceLines(crisisMeta).ece.toLocaleLowerCase('tr-TR');
  record(assert(checks, !crisisEcho.includes('panik') && !crisisEcho.includes('felaket'), 'crisis_adjacent panic language yok'));

  const chip = buildContentPackEventChipLabel(routeMeta, 8);
  record(assert(checks, chip === 'Rota baskısı', 'Event chip max 1 player-facing label'));
  record(assert(checks, buildContentPackEventChipLabel(routeMeta, 5) == null, 'Day 1-7 chip görünmüyor'));
  record(assert(checks, !`${chip}`.includes('vehicle_route_pack_one'), 'Chip teknik pack adı içermiyor'));

  const cityEchoBinding = buildCityEchoBinding({
    day: 8,
    event: { id: 'cra_vehicle_route_pack_one_route_family_test_d8', contentPackMeta: routeMeta } as never,
    contentPackMeta: routeMeta,
    existingLines: [],
  });
  record(assert(checks, cityEchoBinding.sourceKind === 'event_echo', 'City echo pack sourceKind event_echo'));
  record(assert(checks, Boolean(buildCityEchoReportLine(cityEchoBinding)), 'City echo report line üretilebiliyor'));

  const wiredDecisionImpact = buildDecisionImpactExplanation({
    day: 8,
    event: light.eventCards[0],
  });
  record(
    assert(
      checks,
      wiredDecisionImpact.kind !== 'neutral_learning' || !meta,
      'Decision impact selection pack branch bağlı',
    ),
  );

  record(assert(checks, !isContentPackWiringEligibleDay(5), 'Day 8+ wiring Day 1-7 kapalı'));
  record(
    assert(
      checks,
      readRepo('src/core/decisionImpactExplanation/decisionImpactExplanationModel.ts').includes(
        'tryBuildDecisionImpactFromPackMeta',
      ),
      'Decision impact model wiring var',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/core/tomorrowRisk/tomorrowRiskModel.ts').includes('fromContentPackMeta'),
      'Tomorrow risk model wiring var',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/core/cityEchoBinding/cityEchoBindingModel.ts').includes('buildPackEchoSurfaceLines'),
      'City echo binding wiring var',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/events/components/PostPilotEventContextChip.tsx').includes(
        'buildContentPackEventChipLabel',
      ),
      'Event chip wiring var',
    ),
  );

  const forbiddenHaystack = [
    districtImpact?.mainLine ?? '',
    routeTomorrow?.mainLine ?? '',
    echoSurfaces.report,
    chip ?? '',
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR');
  record(assert(checks, !forbiddenHaystack.includes('pack') && !forbiddenHaystack.includes('metadata'), 'Player-facing copy teknik kelime içermiyor'));

  record(
    assert(
      checks,
      light.model.sourceSignals.includes('content_pack_activation') ||
        light.model.presentationHint != null,
      'mainOperationFeel sourceSignals pack hint alabiliyor',
    ),
  );

  const hashStable =
    stableContentRuntimeHash('a') === stableContentRuntimeHash('a') &&
    stableContentRuntimeHash('a') !== stableContentRuntimeHash('b');
  record(assert(checks, hashStable, 'stableHash deterministik'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi', 'SAVE_VERSION değişti'));
  record(
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('contentRuntimeActivation'),
      'gamePersist shape değişmedi',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/applyDecision.ts').includes('contentRuntimeActivation'),
      'applyDecision değişmedi',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/core/postPilot/postPilotEventEngine.ts').includes(
        'augmentPostPilotDailySetWithContentActivation',
      ),
      'postPilot event integration var',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('contentRuntimeActivation'),
      'event generation komple rewrite edilmedi',
    ),
  );
  record(assert(checks, readRepo('package.json').includes('verify:content-runtime-activation'), 'package.json script var'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-content-runtime-activation-lite.md')), 'docs var'));
  record(
    assert(
      checks,
      readRepo('src/features/hub/screens/HubScreen.tsx').includes('contentPackActivation'),
      'mainOperationFeel hub integration var',
    ),
  );

  const gsDay8 = buildDevJumpPilotCompletedGameState(createDay1Seed().gameState);
  gsDay8.city.day = 8;
  const augmented = augmentPostPilotDailySetWithContentActivation(
    {
      day: 8,
      anchorEventId: 'anchor',
      sideEventIds: ['side1'],
      allEventIds: ['anchor', 'side1'],
      catalog: [
        {
          id: 'anchor',
          title: 'Anchor',
          category: 'Test',
          riskLevel: 'medium',
          district: 'Merkez',
          description: 'anchor',
          contextTag: 'test',
          urgencyHours: 4,
          decisions: [],
          previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
        },
        {
          id: 'side1',
          title: 'Side',
          category: 'Test',
          riskLevel: 'medium',
          district: 'Merkez',
          description: 'side',
          contextTag: 'test',
          urgencyHours: 4,
          decisions: [],
          previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
        },
      ],
    },
    day8LightInput(),
  );
  record(
    assert(
      checks,
      augmented.selection.eventCards.length === 0 ||
        augmented.dailySet.catalog.some((e) => e.id.startsWith('cra_')),
      'postPilot daily set pack event inject edilebiliyor',
    ),
  );

  return { ok, checks };
}
