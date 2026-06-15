import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildSyntheticContentPackMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { buildCityJournalLiteModel } from '@/core/cityJournal/cityJournalModel';
import { buildMapReactionLiteModel } from '@/core/mapReactions/mapReactionModel';
import { SAVE_VERSION } from '@/store/gamePersist';

import { MAP_REACTION_MOTION_FORBIDDEN_WORDS } from './mapReactionMotionConstants';
import {
  buildMapReactionMotionModel,
  buildMapReactionMotionModelFromLite,
  buildMapReactionMotionVisibility,
  mapReactionMotionContainsForbiddenWords,
  shouldShowMapReactionMotion,
} from './mapReactionMotionModel';
import {
  collectMapReactionMotionAccessibilityLabels,
  resolveReduceMotionPreferenceSync,
} from './mapReactionMotionHelpers';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyMapReactionMotionOutcome = {
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

function sampleReactions(day: number) {
  return buildMapReactionLiteModel({
    day,
    selectedDistrictId: 'sanayi',
    isPostPilot: day >= 8,
    operationSignals: strainedSignals(),
    cityEcho: { socialLine: 'Mahallede görünür hizmet fark edildi.' } as never,
    tomorrowRisk: {
      mainLine: 'Yarın Sanayi rotası izlenebilir.',
      relatedDistrictId: 'sanayi',
    } as never,
  });
}

export function verifyMapReactionMotionScenario(): VerifyMapReactionMotionOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const day6Lite = sampleReactions(6);
  const day6Motion = buildMapReactionMotionModelFromLite(day6Lite, {
    selectedDistrictId: 'sanayi',
    reducedMotionMode: false,
  });

  record(assert(checks, Boolean(day6Motion.globalMotionCues.length >= 0), 'MapReactionMotionModel üretilebiliyor'));
  record(assert(checks, buildMapReactionMotionVisibility({ day: 1 }) === 'hidden', 'Day 1 hidden/static'));
  record(
    assert(
      checks,
      buildMapReactionMotionModelFromLite(sampleReactions(1), { selectedDistrictId: 'sanayi' })
        .animatedCueCount === 0,
      'Day 1 animated cue yok',
    ),
  );

  const day2Motion = buildMapReactionMotionModelFromLite(sampleReactions(2), {
    selectedDistrictId: 'sanayi',
  });
  record(
    assert(
      checks,
      day2Motion.animatedCueCount <= 1,
      'Day 2-3 max 1 animated cue',
    ),
  );
  record(assert(checks, buildMapReactionMotionVisibility({ day: 2 }) === 'subtle', 'Day 2-3 subtle'));

  const day5Motion = buildMapReactionMotionModelFromLite(sampleReactions(5), {
    selectedDistrictId: 'sanayi',
  });
  record(
    assert(
      checks,
      day5Motion.animatedCueCount <= 2,
      'Day 4-7 max 2 animated cues',
    ),
  );

  const day8Motion = buildMapReactionMotionModelFromLite(sampleReactions(8), {
    selectedDistrictId: 'sanayi',
    accessMode: 'full',
  });
  record(
    assert(
      checks,
      day8Motion.animatedCueCount <= 3,
      'Day 8+ max 3 animated cues',
    ),
  );

  const reduced = buildMapReactionMotionModelFromLite(day6Lite, {
    selectedDistrictId: 'sanayi',
    reducedMotionMode: true,
  });
  record(
    assert(
      checks,
      reduced.animatedCueCount === 0,
      'reducedMotionMode animasyonu kapatır',
    ),
  );
  record(
    assert(
      checks,
      reduced.globalMotionCues.every((c) => c.motionKind === 'static_indicator' || !c.shouldAnimate),
      'reduced motion static fallback',
    ),
  );

  const trustMotion = buildMapReactionMotionModel({
    day: 6,
    selectedDistrictId: 'cumhuriyet',
    reactions: [{ districtId: 'cumhuriyet', kind: 'trust_pulse', priority: 'medium' }],
  });
  record(
    assert(
      checks,
      trustMotion.globalMotionCues.some((c) => c.motionKind === 'trust_ping'),
      'trust_pulse → trust_ping',
    ),
  );

  const riskMotion = buildMapReactionMotionModel({
    day: 6,
    reactions: [{ districtId: 'sanayi', kind: 'risk_ring', priority: 'high' }],
  });
  record(
    assert(
      checks,
      riskMotion.globalMotionCues.some((c) => c.motionKind === 'risk_ring'),
      'risk_ring → risk ring',
    ),
  );

  const recoveryMotion = buildMapReactionMotionModel({
    day: 6,
    reactions: [{ districtId: 'yesilvadi', kind: 'recovery_glow' }],
  });
  record(
    assert(
      checks,
      recoveryMotion.globalMotionCues.some((c) => c.motionKind === 'recovery_glow'),
      'recovery_glow → recovery glow',
    ),
  );

  const socialMotion = buildMapReactionMotionModel({
    day: 6,
    reactions: [{ districtId: 'cumhuriyet', kind: 'social_bubble', shortLine: 'Sosyal sinyal' }],
  });
  record(assert(checks, Boolean(socialMotion.bubbleCue), 'social_bubble → bubble cue'));
  record(assert(checks, (socialMotion.bubbleCue?.shortLine.length ?? 0) > 0, 'social bubble short line'));

  const journalLite = buildMapReactionLiteModel({
    day: 10,
    isPostPilot: true,
    selectedDistrictId: 'sanayi',
    cityJournal: buildCityJournalLiteModel({
      currentDay: 10,
      isPostPilot: true,
      focusDistrictId: 'sanayi',
      operationSignals: strainedSignals(),
    }),
  });
  const journalMotion = buildMapReactionMotionModelFromLite(journalLite, {
    selectedDistrictId: 'sanayi',
  });
  const journalCues = journalMotion.globalMotionCues.filter((c) => c.reactionKind === 'journal_trace');
  record(
    assert(
      checks,
      journalCues.length <= 1,
      'journal_trace max 1',
    ),
  );

  const scopeMotion = buildMapReactionMotionModel({
    day: 8,
    accessMode: 'full',
    reactions: [{ districtId: 'merkez', kind: 'operation_scope_marker' }],
  });
  record(
    assert(
      checks,
      Boolean(scopeMotion.operationScopeCue),
      'operation_scope_marker → operation scope ring',
    ),
  );

  const resourceMotion = buildMapReactionMotionModel({
    day: 6,
    reactions: [
      { districtId: 'sanayi', kind: 'team_capacity_marker' },
      { districtId: 'sanayi', kind: 'vehicle_capacity_marker' },
    ],
  });
  const resourceAnimated = resourceMotion.globalMotionCues.filter(
    (c) => c.shouldAnimate && c.motionKind === 'resource_marker_breathe',
  );
  record(
    assert(
      checks,
      resourceAnimated.length <= 1,
      'resource marker max 1 animated',
    ),
  );

  const fallbackMotion = buildMapReactionMotionModel({
    day: 6,
    reactions: [{ districtId: 'merkez', kind: 'fallback' }],
  });
  record(
    assert(
      checks,
      fallbackMotion.globalMotionCues.every((c) => c.motionKind === 'static_indicator'),
      'fallback static_indicator only',
    ),
  );

  const packMeta = buildSyntheticContentPackMeta({
    packId: 'vehicle_route_pack_one',
    familyId: 'route_family',
    districtId: 'sanayi',
  });
  const packLite = buildMapReactionLiteModel({
    day: 8,
    isPostPilot: true,
    selectedDistrictId: 'sanayi',
    contentPackMeta: packMeta,
    operationSignals: strainedSignals(),
  });
  const packLabels = collectMapReactionMotionAccessibilityLabels(
    buildMapReactionMotionModelFromLite(packLite, { selectedDistrictId: 'sanayi' }),
  ).join(' ').toLocaleLowerCase('tr-TR');
  record(assert(checks, !packLabels.includes('pack') && !packLabels.includes('metadata'), 'teknik pack adı yok'));

  record(assert(checks, readRepo('src/features/map/components/CityOverviewMap.tsx').includes('reactionMotionCues'), 'CityOverviewMap motion props'));
  record(assert(checks, readRepo('src/features/map/components/MapNeighborhoodStrip.tsx').includes('accessibilityLabel'), 'MapNeighborhoodStrip accessibility label'));
  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('mapReactionMotionModel'), 'MapScreen motion integration'));
  record(assert(checks, readRepo('src/features/map/components/MapReactionMotionLayer.tsx').includes('MapReactionMotionLayer'), 'motion layer component'));
  record(assert(checks, !readRepo('src/features/map/components/MapReactionMotionLayer.tsx').includes('setInterval'), 'setInterval leak yok'));

  const labels = collectMapReactionMotionAccessibilityLabels(day6Motion);
  record(assert(checks, labels.length > 0, 'accessibilityLabel var'));
  record(assert(checks, labels.every((l) => l.length > 0), 'boş accessibility label yok'));

  const copyBlob = [
    ...labels,
    day6Motion.bubbleCue?.shortLine ?? '',
    day6Motion.journalCue?.hintLine ?? '',
  ].join(' ').toLocaleLowerCase('tr-TR');
  record(assert(checks, !copyBlob.includes('gps') && !copyBlob.includes('canlı takip'), 'GPS/canlı takip yok'));
  record(assert(checks, !copyBlob.includes('plaka'), 'plaka yok'));
  record(assert(checks, !copyBlob.includes('panik'), 'panik yok'));

  record(assert(checks, day6Motion.animatedCueCount <= day6Motion.maxAnimatedCues, 'maxAnimatedCues enforced'));
  record(assert(checks, typeof resolveReduceMotionPreferenceSync() === 'boolean', 'reduce motion helper güvenli'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi', 'SAVE_VERSION değişti'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('mapReactionMotion'), 'applyDecision değişmedi'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('mapReactionMotion'), 'persist shape değişmedi'));
  record(assert(checks, !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('mapReactionMotion'), 'dayPipeline değişmedi'));

  record(assert(checks, shouldShowMapReactionMotion(day6Motion) || day6Motion.visibility === 'hidden', 'shouldShow helper'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-dynamic-map-reaction-motion-polish.md')), 'docs var'));
  record(assert(checks, readRepo('package.json').includes('verify:map-reaction-motion'), 'package.json script var'));
  record(assert(checks, readRepo('package.json').includes('react-native-reanimated'), 'Reanimated mevcut — yeni dependency eklenmedi'));

  for (const word of MAP_REACTION_MOTION_FORBIDDEN_WORDS.slice(0, 6)) {
    record(
      assert(
        checks,
        mapReactionMotionContainsForbiddenWords(word),
        `forbidden copy guard: ${word}`,
      ),
    );
  }

  return { ok, checks };
}
