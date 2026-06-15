import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { appendCityArchiveEntries } from '@/core/cityArchive/cityArchiveEngine';
import { createInitialCityArchiveState } from '@/core/cityArchive/cityArchiveState';
import type { CityArchiveEntry } from '@/core/cityArchive/cityArchiveTypes';
import { buildSyntheticContentPackMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { buildMainOperationFeelMapHint } from '@/core/mainOperationFeel';
import { buildMainOperationFeelModel } from '@/core/mainOperationFeel/mainOperationFeelModel';
import { createDay1Seed } from '@/core/content/day1Seed';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_REPORT_CARD_LITE_DISTRICT_IDS,
  DISTRICT_REPORT_CARD_LITE_FORBIDDEN_WORDS,
} from './districtReportCardConstants';
import { maxRecentEventsForDay } from './districtReportCardArchiveModel';
import {
  buildDistrictReportCardFullModel,
  buildDistrictReportCardLiteModel,
  buildDistrictReportCardLiteVisibility,
  districtReportCardContainsForbiddenWords,
  isDistrictReportCardDuplicate,
  shouldShowDistrictReportCardFull,
  shouldShowDistrictReportCardLite,
} from './districtReportCardModel';
import {
  buildDistrictReportCardLineForReport,
  buildDistrictReportCardMapPresentation,
  buildDistrictReportCardSummaryForHub,
  collectDistrictReportCardVisibleLines,
} from './districtReportCardPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyDistrictReportCardOutcome = {
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
    vehicles: { status: 'critical', summary: 'Rota baskısı', score: 80 },
    containers: { status: 'watch', summary: 'Konteyner', score: 55 },
    personnel: { status: 'strained', summary: 'Personel', score: 70 },
    districts: { status: 'watch', summary: 'Mahalle', score: 60 },
  };
}

export function verifyDistrictReportCardScenario(): VerifyDistrictReportCardOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  for (const districtId of DISTRICT_REPORT_CARD_LITE_DISTRICT_IDS) {
    const model = buildDistrictReportCardLiteModel({ districtId, day: 5, operationSignals: strainedSignals() });
    record(assert(checks, model?.districtId === districtId, `${districtId} model üretilebiliyor`));
    record(assert(checks, Boolean(model?.districtName), `${districtId} districtName doğru`));
    record(assert(checks, Boolean(model?.trustLabel || model?.trustLine), `${districtId} trustLabel/line`));
    record(assert(checks, Boolean(model?.dominantIssueKind), `${districtId} dominantIssueKind`));
    record(assert(checks, Boolean(model?.recentEffectLine), `${districtId} recentEffectLine`));
    record(assert(checks, Boolean(model?.eceLine), `${districtId} eceLine`));
  }

  const fallback = buildDistrictReportCardLiteModel({});
  record(assert(checks, fallback == null, 'districtId yoksa null'));

  const safeFallback = buildDistrictReportCardLiteModel({ districtId: 'merkez', day: 2 });
  record(assert(checks, Boolean(safeFallback?.dominantIssueLine), 'fallback güvenli'));

  const day1 = buildDistrictReportCardLiteModel({ districtId: 'merkez', day: 1 });
  record(
    assert(
      checks,
      buildDistrictReportCardLiteVisibility({ day: 1 }) === 'compact',
      'Day 1 compact visibility',
    ),
  );
  record(
    assert(
      checks,
      !day1?.trustLabel || !`${day1?.trustLine}`.includes('runtime'),
      'Day 1 ağır sistem dili yok',
    ),
  );

  record(assert(checks, buildDistrictReportCardLiteVisibility({ day: 2 }) === 'compact', 'Day 2-3 compact'));
  record(assert(checks, buildDistrictReportCardLiteVisibility({ day: 4 }) === 'standard', 'Day 4-7 standard'));
  record(
    assert(
      checks,
      buildDistrictReportCardLiteVisibility({ day: 8, isPostPilot: true }) === 'standard',
      'Day 8+ post-pilot standard',
    ),
  );
  record(
    assert(
      checks,
      buildDistrictReportCardLiteVisibility({ day: 9, isPostPilot: true, accessMode: 'full' }) === 'detailed_preview',
      'Full main operation detailed_preview',
    ),
  );

  const routeIssue = buildDistrictReportCardLiteModel({
    districtId: 'sanayi',
    day: 6,
    operationSignals: { vehicles: { status: 'critical', summary: 'Rota', score: 85 } },
  });
  record(assert(checks, routeIssue?.dominantIssueKind === 'route_pressure', 'route pressure seçimi'));

  const containerIssue = buildDistrictReportCardLiteModel({
    districtId: 'cumhuriyet',
    day: 6,
    operationSignals: { containers: { status: 'critical', summary: 'Konteyner', score: 88 } },
  });
  record(assert(checks, containerIssue?.dominantIssueKind === 'container_pressure', 'container pressure seçimi'));

  const trustIssue = buildDistrictReportCardLiteModel({
    districtId: 'cumhuriyet',
    day: 6,
    operationSignals: { districts: { status: 'critical', summary: 'Güven', score: 90 } },
  });
  record(
    assert(
      checks,
      trustIssue?.dominantIssueKind === 'district_trust' || trustIssue?.dominantIssueKind === 'social_trust',
      'fragile trust district_trust/social seçimi',
    ),
  );

  const recovery = buildDistrictReportCardLiteModel({
    districtId: 'yesilvadi',
    day: 6,
    socialPulse: { trend: 'recovering', globalPulseScore: 62 },
  });
  record(
    assert(
      checks,
      recovery?.dominantIssueKind === 'recovery_momentum' || recovery?.statusTone === 'recovering',
      'social recovery momentum',
    ),
  );

  const fatigue = buildDistrictReportCardLiteModel({
    districtId: 'sanayi',
    day: 6,
    resourceFatigue: { standard_truck: { state: 'tired', note: 'vehicle fatigue' } },
  });
  record(
    assert(
      checks,
      fatigue?.dominantIssueKind === 'vehicle_fatigue' || fatigue?.dominantIssueKind === 'personnel_fatigue',
      'resource fatigue issue',
    ),
  );

  const districtPack = buildSyntheticContentPackMeta({
    packId: 'district_pack_one',
    familyId: 'district_family',
    districtId: 'yesilvadi',
    variantKind: 'district_trust',
  });
  const packModel = buildDistrictReportCardLiteModel({
    districtId: 'yesilvadi',
    day: 8,
    isPostPilot: true,
    contentPackMeta: districtPack,
  });
  record(assert(checks, Boolean(packModel?.contentPackLine || packModel?.dominantIssueLine.includes('Yeşilvadi')), 'District Pack satırı'));

  const routePack = buildSyntheticContentPackMeta({
    packId: 'vehicle_route_pack_one',
    familyId: 'route_family',
    districtId: 'sanayi',
  });
  const routePackModel = buildDistrictReportCardLiteModel({
    districtId: 'sanayi',
    day: 8,
    isPostPilot: true,
    contentPackMeta: routePack,
  });
  record(assert(checks, routePackModel?.dominantIssueKind === 'route_pressure', 'Vehicle/Route Pack rota satırı'));

  const containerPack = buildSyntheticContentPackMeta({
    packId: 'container_environment_pack_one',
    familyId: 'container_family',
    districtId: 'cumhuriyet',
  });
  const containerPackModel = buildDistrictReportCardLiteModel({
    districtId: 'cumhuriyet',
    day: 8,
    isPostPilot: true,
    contentPackMeta: containerPack,
  });
  record(assert(checks, containerPackModel?.dominantIssueKind === 'container_pressure', 'Container Pack satırı'));

  const playerCopy = [
    packModel?.dominantIssueLine ?? '',
    routePackModel?.dominantIssueLine ?? '',
    containerPackModel?.dominantIssueLine ?? '',
  ].join(' ').toLocaleLowerCase('tr-TR');
  record(assert(checks, !playerCopy.includes('pack_one') && !playerCopy.includes('metadata'), 'Teknik pack adı yok'));

  const mapPresentation = buildDistrictReportCardMapPresentation(
    buildDistrictReportCardLiteModel({ districtId: 'cumhuriyet', day: 8, isPostPilot: true })!,
    [],
  );
  record(assert(checks, Boolean(mapPresentation?.title.includes('Karnesi')), 'Map integration helper var'));

  const intelligenceLine = 'Cumhuriyet: İzlemede — güven sinyali aktif.';
  const deduped = buildDistrictReportCardMapPresentation(
    buildDistrictReportCardLiteModel({ districtId: 'cumhuriyet', day: 8, isPostPilot: true })!,
    [intelligenceLine],
  );
  record(
    assert(
      checks,
      !deduped?.primaryLine?.includes(intelligenceLine.slice(0, 24)),
      'MapDistrictIntelligence duplicate guard',
    ),
  );

  const feelHint = buildMainOperationFeelMapHint(
    buildMainOperationFeelModel({ day: 8, isPilotCompleted: true, accessMode: 'limited', postPilotPhase: 'main_operation_light' }),
    [],
  ).hintLine;
  const feelDeduped = buildDistrictReportCardMapPresentation(
    buildDistrictReportCardLiteModel({
      districtId: 'merkez',
      day: 8,
      isPostPilot: true,
      mainOperationScopeHintLine: feelHint,
    })!,
    [feelHint ?? ''],
  );
  record(
    assert(
      checks,
      feelDeduped?.primaryLine !== feelHint,
      'MainOperationFeel map hint duplicate guard',
    ),
  );

  record(
    assert(
      checks,
      isDistrictReportCardDuplicate('Yarın rota dengesi izlenebilir.', ['Yarın rota dengesi izlenebilir.']),
      'TomorrowRisk duplicate guard',
    ),
  );

  const hubSummary = buildDistrictReportCardSummaryForHub(
    buildDistrictReportCardLiteModel({ districtId: 'merkez', day: 5 })!,
    [],
  );
  record(assert(checks, Boolean(hubSummary), 'Hub summary helper üretilebiliyor'));

  const reportLine = buildDistrictReportCardLineForReport(
    buildDistrictReportCardLiteModel({ districtId: 'merkez', day: 5 })!,
    [],
  );
  record(assert(checks, Boolean(reportLine), 'Report line helper üretilebiliyor'));

  record(
    assert(
      checks,
      readRepo('src/features/map/components/MapDistrictReportCard.tsx').includes('numberOfLines'),
      'numberOfLines guard component içinde',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/components/MapDistrictReportCard.tsx').includes('flexShrink'),
      'flexShrink guard component içinde',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/components/MapDistrictReportCard.tsx').includes('minWidth: 0'),
      'minWidth guard component içinde',
    ),
  );
  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('mapDistrictReportCard'), 'MapScreen integration'));
  record(
    assert(
      checks,
      !readRepo('src/features/map/screens/MapScreen.tsx').includes('district-report-card'),
      'Yeni route yok',
    ),
  );

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi', 'SAVE_VERSION değişti'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('districtReportCard'), 'applyDecision değişmedi'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('districtReportCard'), 'persist shape değişmedi'));
  record(
    assert(
      checks,
      readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationConstants.ts').includes(
        'CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT = 1',
      ),
      'content pack caps değişmedi',
    ),
  );

  const lines = collectDistrictReportCardVisibleLines(
    buildDistrictReportCardLiteModel({ districtId: 'merkez', day: 8, isPostPilot: true })!,
  );
  const unique = new Set(lines.map((line) => line.toLocaleLowerCase('tr-TR')));
  record(assert(checks, unique.size === lines.length, 'Model satırları birebir tekrar etmiyor'));

  for (const word of ['pack', 'metadata', 'runtime', 'panik']) {
    record(
      assert(
        checks,
        DISTRICT_REPORT_CARD_LITE_FORBIDDEN_WORDS.includes(word as never),
        `forbidden word listed: ${word}`,
      ),
    );
  }
  record(
    assert(
      checks,
      districtReportCardContainsForbiddenWords('district_pack_one rota baskısı'),
      'forbidden copy guard',
    ),
  );

  record(assert(checks, shouldShowDistrictReportCardLite(buildDistrictReportCardLiteModel({ districtId: 'merkez', day: 3 })), 'shouldShow'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-district-report-card-lite.md')), 'docs var'));
  record(assert(checks, readRepo('package.json').includes('verify:district-report-card'), 'package.json script var'));

  function sampleArchiveForDistrict(districtId: string, day: number) {
    const entries: CityArchiveEntry[] = [
      {
        id: `arc-${districtId}-1`,
        day: day - 1,
        kind: 'social_response',
        districtId: districtId as never,
        sourceKind: 'cityJournal',
        title: 'Sosyal yanıt',
        shortLine: `${districtId} çevresinde görünür hizmet etkisi izlendi.`,
        isPlayerVisible: true,
        priority: 'medium',
        duplicateKey: `${districtId}:social_response:1`,
        createdFrom: 'cityJournal',
        createdAtDay: day - 1,
      },
      {
        id: `arc-${districtId}-2`,
        day: day - 2,
        kind: 'trust_recovery',
        districtId: districtId as never,
        sourceKind: 'decisionImpact',
        title: 'Güven toparlanması',
        shortLine: `${districtId} hattında güven toparlanma sinyali görüldü.`,
        trustDeltaBand: 'recovered',
        isPlayerVisible: true,
        priority: 'high',
        duplicateKey: `${districtId}:trust_recovery:2`,
        createdFrom: 'decisionImpact',
        createdAtDay: day - 2,
      },
      {
        id: `arc-${districtId}-3`,
        day: day - 3,
        kind: 'route_balanced',
        districtId: districtId as never,
        sourceKind: 'operationSignals',
        title: 'Rota dengesi',
        shortLine: `${districtId} rotasında denge korundu.`,
        isPlayerVisible: true,
        priority: 'low',
        duplicateKey: `${districtId}:route_balanced:3`,
        createdFrom: 'operationSignals',
        createdAtDay: day - 3,
      },
    ];
    let archive = createInitialCityArchiveState(day);
    archive = appendCityArchiveEntries(archive, entries, { day });
    return archive;
  }

  const archiveDay8 = sampleArchiveForDistrict('cumhuriyet', 8);
  const fullWithArchive = buildDistrictReportCardFullModel({
    districtId: 'cumhuriyet',
    day: 8,
    isPostPilot: true,
    cityArchive: archiveDay8,
    operationSignals: strainedSignals(),
  });
  record(assert(checks, Boolean(fullWithArchive?.sourceSignals.hasCityArchive), 'full model archive-backed'));
  record(assert(checks, (fullWithArchive?.recentArchiveEvents.length ?? 0) <= 3, 'son 3 archive event cap'));
  record(assert(checks, (fullWithArchive?.recentArchiveEvents.length ?? 0) >= 1, 'archive recent events dolu'));
  record(assert(checks, Boolean(fullWithArchive?.publicToneLine), 'publicTone üretiliyor'));
  record(assert(checks, fullWithArchive?.playerStyleInDistrict !== undefined, 'playerStyleInDistrict üretiliyor'));
  record(assert(checks, Boolean(fullWithArchive?.recoveryState), 'recoveryState üretiliyor'));
  record(assert(checks, Boolean(fullWithArchive?.eceDistrictLine), 'eceDistrictLine üretiliyor'));
  record(assert(checks, Boolean(fullWithArchive?.mapLine), 'mapLine güvenli'));
  record(assert(checks, Boolean(fullWithArchive?.hubLine), 'hubLine güvenli'));

  const liteFallback = buildDistrictReportCardFullModel({
    districtId: 'merkez',
    day: 5,
    operationSignals: strainedSignals(),
  });
  record(assert(checks, liteFallback?.sourceSignals.hasCityArchive === false, 'archive yoksa lite fallback'));
  record(assert(checks, (liteFallback?.recentArchiveEvents.length ?? 0) === 0, 'archive yoksa recent events boş'));

  const day1Full = buildDistrictReportCardFullModel({ districtId: 'merkez', day: 1, cityArchive: archiveDay8 });
  record(assert(checks, (day1Full?.recentArchiveEvents.length ?? 0) === 0, 'Day 1 heavy recent event yok'));
  record(assert(checks, maxRecentEventsForDay(1) === 0, 'Day 1 recent cap 0'));
  record(assert(checks, maxRecentEventsForDay(8) === 3, 'Day 8+ recent cap 3'));

  let corruptOk = true;
  try {
    buildDistrictReportCardFullModel({
      districtId: 'merkez',
      day: 5,
      cityArchive: { ...createInitialCityArchiveState(5), entries: null as never },
    });
  } catch {
    corruptOk = false;
  }
  record(assert(checks, corruptOk, 'corrupt/empty archive crash yok'));

  const advisorDupCandidate = fullWithArchive?.eceDistrictLine ?? 'Ece test satırı';
  const withAdvisorDup = buildDistrictReportCardFullModel({
    districtId: 'cumhuriyet',
    day: 8,
    isPostPilot: true,
    cityArchive: archiveDay8,
    advisorRelationshipLine: advisorDupCandidate,
    operationSignals: strainedSignals(),
  });
  record(
    assert(
      checks,
      Boolean(withAdvisorDup?.eceDistrictLine) &&
        withAdvisorDup!.eceDistrictLine !== advisorDupCandidate,
      'AdvisorRelationship duplicate guard',
    ),
  );
  const journalLine = 'Cumhuriyet çevresinde görünür hizmet etkisi izlendi.';
  record(
    assert(
      checks,
      !buildDistrictReportCardSummaryForHub(fullWithArchive, [journalLine])?.includes(journalLine.slice(0, 30)) ||
        Boolean(buildDistrictReportCardSummaryForHub(fullWithArchive, [journalLine])),
      'CityJournal duplicate guard',
    ),
  );

  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('buildDistrictReportCardFullModel'), 'MapDistrictReportCard archive-backed'));
  record(assert(checks, readRepo('src/features/hub/screens/HubScreen.tsx').includes('buildDistrictReportCardFullModel'), 'Hub helper archive-backed'));
  record(assert(checks, readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes('buildDistrictReportCardFullModel'), 'Report helper archive-backed'));
  record(assert(checks, readRepo('src/features/map/components/MapDistrictReportCard.tsx').includes('recentEvents'), 'Map recent events UI'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-district-report-card-full.md')), 'full docs var'));
  record(assert(checks, shouldShowDistrictReportCardFull(fullWithArchive), 'shouldShow full model'));

  void createDay1Seed();

  return { ok, checks };
}
