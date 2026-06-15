import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildSyntheticContentPackMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { buildCityJournalLiteModel } from '@/core/cityJournal/cityJournalModel';
import { createDay1Seed } from '@/core/content/day1Seed';
import { buildOperationalResourcePresenceLiteModel } from '@/core/operationalResourcePresence/operationalResourcePresenceModel';
import {
  applyOperationalResourceEffects,
} from '@/core/operationalResources/operationalResourceEngine';
import {
  createInitialOperationalResourcesState,
} from '@/core/operationalResources/operationalResourceState';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  MAP_REACTION_LITE_DISTRICT_IDS,
  MAP_REACTION_LITE_FORBIDDEN_WORDS,
} from './mapReactionConstants';
import {
  buildMapReactionLiteModel,
  buildMapReactionLiteVisibility,
  collectMapReactionVisibleLines,
  mapReactionContainsForbiddenWords,
  MAP_REACTION_KIND_COUNT,
  shouldShowMapReactionLite,
} from './mapReactionModel';
import {
  buildMapReactionHighlightDistrictIds,
  buildMapReactionPanelPresentation,
} from './mapReactionPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyMapReactionOutcome = {
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

function strainedSignals() {
  return {
    vehicles: { status: 'critical', summary: 'Rota', score: 85 },
    containers: { status: 'watch', summary: 'Konteyner', score: 55 },
    personnel: { status: 'strained', summary: 'Personel', score: 72 },
    districts: { status: 'watch', summary: 'Mahalle', score: 60 },
  };
}

function strainedResources(day = 6) {
  let state = createInitialOperationalResourcesState(day);
  state = applyOperationalResourceEffects(
    state,
    [
      {
        domain: 'vehicles',
        targetId: 'route_support_vehicle',
        delta: 30,
        metric: 'route',
        reason: 'test',
        sourceTags: [],
      },
    ],
    day,
  );
  return state;
}

export function verifyMapReactionScenario(): VerifyMapReactionOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const base = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'sanayi',
    operationSignals: strainedSignals(),
    resourceFatigue: strainedResources(),
    operationalResources: strainedResources(),
  });

  record(assert(checks, Boolean(base.reactions.length), 'MapReactionLiteModel üretilebiliyor'));
  record(assert(checks, MAP_REACTION_KIND_COUNT >= 15, `En az 15 reaction kind (${MAP_REACTION_KIND_COUNT})`));
  record(assert(checks, MAP_REACTION_LITE_DISTRICT_IDS.length === 5, '5 mahalle destekleniyor'));
  record(assert(checks, Boolean(base.selectedDistrictReaction), 'selectedDistrictReaction üretilebiliyor'));
  record(assert(checks, Boolean(base.globalMapHint), 'globalMapHint üretilebiliyor'));
  record(
    assert(
      checks,
      base.reactions.length <= base.maxVisibleReactions,
      'maxVisibleReactions korunuyor',
    ),
  );

  record(assert(checks, buildMapReactionLiteVisibility({ day: 1 }) === 'hidden', 'Day 1 hidden/minimal'));
  record(assert(checks, buildMapReactionLiteVisibility({ day: 2 }) === 'compact', 'Day 2-3 compact'));
  record(
    assert(
      checks,
      buildMapReactionLiteModel({ day: 2, selectedDistrictId: 'sanayi', operationSignals: strainedSignals() })
        .reactions.length <= 1,
      'Day 2-3 compact max 1 selected reaction',
    ),
  );
  record(
    assert(
      checks,
      buildMapReactionLiteModel({ day: 5, selectedDistrictId: 'sanayi', operationSignals: strainedSignals() })
        .maxVisibleReactions <= 3,
      'Day 4-7 max 3 reaction',
    ),
  );
  record(
    assert(
      checks,
      buildMapReactionLiteModel({ day: 8, isPostPilot: true, selectedDistrictId: 'sanayi', operationSignals: strainedSignals() })
        .maxVisibleReactions <= 4,
      'Day 8+ max 4 reaction',
    ),
  );
  record(
    assert(
      checks,
      buildMapReactionLiteModel({ day: 9, isPostPilot: true, accessMode: 'full', selectedDistrictId: 'sanayi' })
        .maxVisibleReactions <= 4,
      'Full mode hâlâ lite, heatmap yok',
    ),
  );

  const trustModel = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'cumhuriyet',
    districtReportCard: {
      districtId: 'cumhuriyet',
      districtName: 'Cumhuriyet',
      trustBand: 'recovering',
      dominantIssueKind: 'district_trust',
      dominantIssueLine: 'Cumhuriyet güveni toparlanıyor.',
    } as never,
  });
  record(
    assert(
      checks,
      trustModel.reactions.some((r) => r.kind === 'trust_pulse' || r.kind === 'risk_ring'),
      'districtTrust recovering/trust_pulse veya risk_ring',
    ),
  );

  const riskModel = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'sanayi',
    tomorrowRisk: { mainLine: 'Yarın Sanayi rotası izlenebilir.', relatedDistrictId: 'sanayi', kind: 'route_pressure_tomorrow' } as never,
  });
  record(assert(checks, riskModel.reactions.some((r) => r.kind === 'risk_ring'), 'TomorrowRisk/carryOver → risk_ring'));

  const echoModel = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'cumhuriyet',
    cityEcho: { socialLine: 'Cumhuriyet çevresinde görünür hizmet fark edildi.' } as never,
  });
  record(assert(checks, echoModel.reactions.some((r) => r.kind === 'social_bubble'), 'Social echo → social_bubble'));

  const routePack = buildSyntheticContentPackMeta({
    packId: 'vehicle_route_pack_one',
    familyId: 'route_family',
    districtId: 'sanayi',
  });
  const routeModel = buildMapReactionLiteModel({
    day: 8,
    isPostPilot: true,
    selectedDistrictId: 'sanayi',
    contentPackMeta: routePack,
    operationSignals: strainedSignals(),
  });
  record(
    assert(
      checks,
      routeModel.reactions.some(
        (r) => r.kind === 'route_pressure_marker' || r.kind === 'vehicle_capacity_marker',
      ),
      'Vehicle/Route content pack → route_pressure_marker veya vehicle_capacity_marker',
    ),
  );

  const containerPack = buildSyntheticContentPackMeta({
    packId: 'container_environment_pack_one',
    familyId: 'container_family',
    districtId: 'cumhuriyet',
  });
  const containerModel = buildMapReactionLiteModel({
    day: 8,
    selectedDistrictId: 'cumhuriyet',
    contentPackMeta: containerPack,
  });
  record(
    assert(
      checks,
      containerModel.reactions.some((r) => r.kind === 'container_pressure_marker'),
      'Container/Environment content pack → container_pressure_marker',
    ),
  );

  const fatigueModel = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'sanayi',
    resourceFatigue: { tired: true },
  });
  record(
    assert(
      checks,
      fatigueModel.reactions.some((r) => r.kind === 'resource_fatigue_marker'),
      'Resource fatigue → resource_fatigue_marker',
    ),
  );

  const presence = buildOperationalResourcePresenceLiteModel({
    day: 6,
    operationalResources: strainedResources(),
    operationSignals: strainedSignals(),
    focusDistrictId: 'sanayi',
  });
  const presenceModel = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'sanayi',
    operationalResourcePresence: presence,
  });
  record(
    assert(
      checks,
      presenceModel.reactions.some(
        (r) =>
          r.kind === 'team_capacity_marker' ||
          r.kind === 'vehicle_capacity_marker' ||
          r.kind === 'resource_presence_marker',
      ),
      'OperationalResourcePresence team/vehicle pressure marker',
    ),
  );

  const crisisPack = buildSyntheticContentPackMeta({
    packId: 'district_pack_one',
    familyId: 'district_family',
    districtId: 'merkez',
    variantKind: 'crisis_adjacent',
  });
  const crisisModel = buildMapReactionLiteModel({
    day: 8,
    selectedDistrictId: 'merkez',
    contentPackMeta: crisisPack,
  });
  record(
    assert(
      checks,
      crisisModel.reactions.some((r) => r.kind === 'crisis_watch_ring'),
      'Crisis-adjacent → crisis_watch_ring without panic copy',
    ),
  );
  record(
    assert(
      checks,
      !collectMapReactionVisibleLines(crisisModel).join(' ').includes('panik'),
      'Crisis-adjacent panik dili yok',
    ),
  );

  const scopeModel = buildMapReactionLiteModel({
    day: 8,
    isPostPilot: true,
    selectedDistrictId: 'merkez',
    mainOperationScopeHintLine: 'Ana operasyon kapsamı Merkez çevresinde genişliyor.',
  });
  record(
    assert(
      checks,
      scopeModel.reactions.some((r) => r.kind === 'operation_scope_marker'),
      'MainOperationFeel scope → operation_scope_marker',
    ),
  );

  const journal = buildCityJournalLiteModel({
    currentDay: 10,
    isPostPilot: true,
    focusDistrictId: 'sanayi',
    operationSignals: strainedSignals(),
  });
  const journalModel = buildMapReactionLiteModel({
    day: 10,
    isPostPilot: true,
    selectedDistrictId: 'sanayi',
    cityJournal: journal,
  });
  record(
    assert(
      checks,
      journalModel.reactions.some((r) => r.kind === 'journal_trace') || journal.entries.length === 0,
      'CityJournal map hint → journal_trace',
    ),
  );

  const panel = buildMapReactionPanelPresentation(base, [base.reactions[0]?.shortLine ?? '']);
  record(assert(checks, panel.visible === false || Boolean(panel.hintLine), 'MapOperationBottomPanel selected reaction line alabiliyor'));

  const deduped = buildMapReactionPanelPresentation(base, [base.selectedDistrictReaction?.shortLine ?? '']);
  record(assert(checks, deduped.visible === false, 'DistrictReportCard duplicate guard'));

  const intelLine = 'Sanayi: İzlemede — güven sinyali aktif.';
  const intelDeduped = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'sanayi',
    operationSignals: strainedSignals(),
    mapIntelligenceLines: [intelLine],
    existingLines: [intelLine],
  });
  record(
    assert(
      checks,
      !intelDeduped.reactions.some((r) => r.shortLine.includes(intelLine.slice(0, 20))),
      'MapDistrictIntelligence duplicate guard',
    ),
  );

  const overlayLine = 'Araç baskısı Sanayi hattında izleniyor.';
  const overlayDeduped = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'sanayi',
    operationSignals: strainedSignals(),
    resourceOverlayLines: [overlayLine],
    existingLines: [overlayLine],
  });
  record(
    assert(
      checks,
      !overlayDeduped.reactions.some((r) => r.shortLine === overlayLine),
      'Resource overlay duplicate guard',
    ),
  );

  const presenceLine = 'Ekip temposu Sanayi çevresinde yükseldi.';
  const presenceDeduped = buildMapReactionLiteModel({
    day: 6,
    selectedDistrictId: 'sanayi',
    operationalResourcePresence: presence,
    resourcePresenceMapLine: presenceLine,
    existingLines: [presenceLine],
  });
  record(
    assert(
      checks,
      !presenceDeduped.reactions.some((r) => r.shortLine === presenceLine),
      'OperationalResourcePresence map line duplicate guard',
    ),
  );

  const allCopy = collectMapReactionVisibleLines(base).join(' ').toLocaleLowerCase('tr-TR');
  record(assert(checks, !allCopy.includes('gps') && !allCopy.includes('plaka'), 'GPS/plaka yok'));
  record(assert(checks, !allCopy.includes('canlı takip'), 'canlı takip yok'));

  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('mapReactionLiteModel'), 'MapScreen integration var'));
  record(assert(checks, readRepo('src/features/map/components/MapOperationBottomPanel.tsx').includes('mapReactionHintLine'), 'MapOperationBottomPanel reaction line'));
  record(assert(checks, !readRepo('src/features/map/screens/MapScreen.tsx').includes('map-reactions-route'), 'Yeni route yok'));
  record(assert(checks, readRepo('src/features/map/components/MapNeighborhoodStrip.tsx').includes('reactionIndicatorLabel'), 'Strip reaction indicator'));
  record(assert(checks, readRepo('src/features/map/components/MapNeighborhoodStrip.tsx').includes('numberOfLines'), 'numberOfLines guard'));
  record(assert(checks, readRepo('src/features/map/components/MapNeighborhoodStrip.tsx').includes('flexShrink'), 'flexShrink guard'));
  record(assert(checks, readRepo('src/features/map/components/MapNeighborhoodStrip.tsx').includes('minWidth: 0'), 'minWidth guard'));
  record(assert(checks, readRepo('src/features/map/components/CityOverviewMap.tsx').includes('reactionHighlightDistrictIds'), 'Map reaction highlight'));
  record(assert(checks, base.reactions.some((r) => r.animationHint || r.pulseStyle !== 'none'), 'Animation hint veya style state var'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi', 'SAVE_VERSION değişti'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('mapReaction'), 'applyDecision değişmedi'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('mapReaction'), 'persist shape değişmedi'));
  record(
    assert(
      checks,
      readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationConstants.ts').includes(
        'CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT = 1',
      ),
      'content pack caps değişmedi',
    ),
  );

  record(assert(checks, shouldShowMapReactionLite(base), 'shouldShow'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-dynamic-map-reaction-lite.md')), 'docs var'));
  record(assert(checks, readRepo('package.json').includes('verify:map-reactions'), 'package.json script var'));

  for (const word of ['gps', 'pack', 'runtime', 'panik']) {
    record(
      assert(
        checks,
        MAP_REACTION_LITE_FORBIDDEN_WORDS.some((w) => w.includes(word)),
        `forbidden word listed: ${word}`,
      ),
    );
  }
  record(
    assert(
      checks,
      mapReactionContainsForbiddenWords('GPS canlı takip koordinat plaka'),
      'forbidden copy guard',
    ),
  );

  record(assert(checks, buildMapReactionHighlightDistrictIds(base).length > 0, 'highlight districts helper'));

  void createDay1Seed();

  return { ok, checks };
}
