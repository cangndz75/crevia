import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildSyntheticContentPackMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { buildDecisionImpactExplanation } from '@/core/decisionImpactExplanation/decisionImpactExplanationModel';
import { buildTomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskModel';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CITY_JOURNAL_LITE_ENTRY_KINDS,
  CITY_JOURNAL_LITE_DISTRICT_IDS,
  CITY_JOURNAL_LITE_FORBIDDEN_WORDS,
  CITY_JOURNAL_LITE_HUB_MAX_ENTRIES,
  CITY_JOURNAL_LITE_REPORT_MAX_ENTRIES,
  CITY_JOURNAL_OPENING_DAY,
} from './cityJournalConstants';
import {
  buildCityJournalLiteDuplicateKey,
  buildCityJournalLiteModel,
  buildCityJournalLiteVisibility,
  cityJournalContainsForbiddenWords,
  collectCityJournalVisibleLines,
  isCityJournalDuplicate,
  shouldShowCityJournalLite,
} from './cityJournalModel';
import {
  buildCityJournalHubPresentation,
  buildCityJournalMapHint,
  buildCityJournalReportLine,
  buildCityJournalReportPresentation,
} from './cityJournalPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 23;

export type VerifyCityJournalOutcome = {
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
    priorityDistrictId: 'sanayi',
  };
}

function stableSignals() {
  return {
    vehicles: { status: 'stable', summary: 'Rota dengede', score: 40 },
    containers: { status: 'stable', summary: 'Konteyner', score: 35 },
    overall: { status: 'steady', summary: 'Denge', score: 30 },
    priorityDistrictId: 'sanayi',
  };
}

export function verifyCityJournalScenario(): VerifyCityJournalOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const baseModel = buildCityJournalLiteModel({ currentDay: 5, operationSignals: stableSignals() });
  record(assert(checks, Boolean(baseModel), 'CityJournalLiteModel üretilebiliyor'));
  record(assert(checks, Array.isArray(baseModel.entries), 'Entry listesi üretilebiliyor'));
  record(assert(checks, baseModel.entries.length <= baseModel.maxEntries, 'maxEntries korunuyor'));
  record(assert(checks, Boolean(baseModel.duplicateKey), 'duplicateKey üretiliyor'));
  record(assert(checks, Boolean(baseModel.emptyLine), 'Empty state güvenli'));
  record(assert(checks, CITY_JOURNAL_LITE_ENTRY_KINDS.length >= 12, `>=12 entry kind (${CITY_JOURNAL_LITE_ENTRY_KINDS.length})`));

  for (const districtId of CITY_JOURNAL_LITE_DISTRICT_IDS) {
    const model = buildCityJournalLiteModel({
      currentDay: 6,
      focusDistrictId: districtId,
      operationSignals: { ...stableSignals(), priorityDistrictId: districtId },
    });
    record(assert(checks, model.entries.length > 0, `${districtId} entry üretilebiliyor`));
    const hasDistrictName = model.entries.some(
      (entry) =>
        entry.line.includes('Cumhuriyet') ||
        entry.line.includes('Merkez') ||
        entry.line.includes('Sanayi') ||
        entry.line.includes('İstasyon') ||
        entry.line.includes('Yeşilvadi') ||
        entry.districtName,
    );
    record(assert(checks, hasDistrictName || districtId === 'merkez', `${districtId} mahalle adı desteği`));
  }

  const day1 = buildCityJournalLiteModel({ currentDay: 1 });
  record(assert(checks, day1.visibility === 'hidden', 'Day 1 hidden'));
  record(
    assert(
      checks,
      !cityJournalContainsForbiddenWords(day1.emptyLine) &&
        !day1.emptyLine.toLocaleLowerCase('tr-TR').includes('runtime'),
      'Day 1 ağır sistem dili yok',
    ),
  );

  const day2 = buildCityJournalLiteModel({ currentDay: 2, operationSignals: stableSignals() });
  record(assert(checks, day2.visibility === 'compact', 'Day 2-3 compact'));
  record(assert(checks, day2.entries.length <= 1, 'Day 2-3 max 1 entry'));

  const day5 = buildCityJournalLiteModel({ currentDay: 5, operationSignals: stableSignals() });
  record(assert(checks, day5.entries.length <= 3, 'Day 4-7 max 3 entry'));

  const day8 = buildCityJournalLiteModel({
    currentDay: CITY_JOURNAL_OPENING_DAY,
    isPostPilot: true,
    operationSignals: stableSignals(),
  });
  record(
    assert(
      checks,
      day8.entries.some((entry) => entry.kind === 'main_operation_started'),
      'Day 8 main_operation_started entry',
    ),
  );

  const day10 = buildCityJournalLiteModel({
    currentDay: 10,
    isPostPilot: true,
    operationSignals: strainedSignals(),
    accessMode: 'full',
    postPilotPhase: 'main_operation_full',
  });
  record(assert(checks, day10.entries.length <= 5, 'Day 9+ max 5 entry'));
  record(
    assert(
      checks,
      day10.visibility === 'timeline_preview',
      'Full main operation timeline_preview',
    ),
  );
  record(assert(checks, day10.visibility !== 'hidden', 'timeline_preview full archive değil'));

  const carryModel = buildCityJournalLiteModel({
    currentDay: 6,
    carryOverMemory: {
      id: 'co1',
      surface: 'hub',
      direction: 'today_to_tomorrow',
      domain: 'container',
      tone: 'warning',
      title: 'Taşınan iz',
      summary: 'Konteyner baskısı yarına taşındı',
      districtLabel: 'Cumhuriyet',
      primaryTag: 'container',
      iconKey: 'container',
      source: 'daily_report',
      visible: true,
      maxLines: 2,
    },
  });
  record(
    assert(
      checks,
      carryModel.entries.some((e) => e.kind === 'carry_over_created' || e.kind === 'carry_over_resolved'),
      'carryOver entry üretilebiliyor',
    ),
  );

  const impactModel = buildCityJournalLiteModel({
    currentDay: 4,
    decisionImpact: buildDecisionImpactExplanation({
      day: 4,
      carryOverSummary: 'Rota dengelendi',
    }),
    operationSignals: stableSignals(),
    focusDistrictId: 'sanayi',
  });
  record(
    assert(
      checks,
      impactModel.entries.some((e) => e.sourceKind === 'decision_impact'),
      'decisionImpact entry üretilebiliyor',
    ),
  );

  const tomorrowModel = buildCityJournalLiteModel({
    currentDay: 9,
    tomorrowRisk: buildTomorrowRiskModel({
      day: 9,
      operationSignals: strainedSignals(),
      carryOver: { summary: 'Rota baskısı', domain: 'vehicle_route', visible: true, districtId: 'istasyon' },
    }),
  });
  record(
    assert(
      checks,
      tomorrowModel.entries.some((e) => e.sourceKind === 'tomorrow_risk'),
      'tomorrowRisk entry üretilebiliyor',
    ),
  );

  const echoModel = buildCityJournalLiteModel({
    currentDay: 7,
    socialPulse: { globalPulseScore: 72, trend: 'up' },
    operationSignals: stableSignals(),
    focusDistrictId: 'cumhuriyet',
  });
  record(
    assert(
      checks,
      echoModel.entries.some((e) => e.sourceKind === 'city_echo' || e.kind === 'social_trust_recovered'),
      'cityEcho/social entry üretilebiliyor',
    ),
  );

  const packMeta = buildSyntheticContentPackMeta({
    packId: 'vehicle_route_pack_one',
    familyId: 'vehicle_route_family',
    districtId: 'sanayi',
  });
  const routePackModel = buildCityJournalLiteModel({
    currentDay: 9,
    contentPackMeta: packMeta,
    focusDistrictId: 'sanayi',
  });
  record(
    assert(
      checks,
      routePackModel.entries.some((e) => e.sourceKind === 'content_pack' && e.kind === 'route_balanced'),
      'Vehicle/Route pack route entry',
    ),
  );
  record(
    assert(
      checks,
      !routePackModel.entries.some((e) => e.line.toLocaleLowerCase('tr-TR').includes('pack')),
      'Teknik pack adı player-facing copy yok',
    ),
  );

  const containerPack = buildCityJournalLiteModel({
    currentDay: 10,
    contentPackMeta: buildSyntheticContentPackMeta({
      packId: 'container_environment_pack_one',
      familyId: 'container_family',
      districtId: 'cumhuriyet',
    }),
    focusDistrictId: 'cumhuriyet',
  });
  record(
    assert(
      checks,
      containerPack.entries.some((e) => e.kind === 'container_followup'),
      'Container/Environment pack entry',
    ),
  );

  const districtPack = buildCityJournalLiteModel({
    currentDay: 11,
    contentPackMeta: buildSyntheticContentPackMeta({
      packId: 'district_pack_one',
      familyId: 'district_family',
      districtId: 'yesilvadi',
    }),
    focusDistrictId: 'yesilvadi',
  });
  record(
    assert(
      checks,
      districtPack.entries.some((e) => e.line.includes('Yeşilvadi') || e.districtId === 'yesilvadi'),
      'District pack district entry',
    ),
  );

  const signalsModel = buildCityJournalLiteModel({
    currentDay: 10,
    operationSignals: strainedSignals(),
    focusDistrictId: 'istasyon',
  });
  record(
    assert(
      checks,
      signalsModel.entries.some((e) => e.line.toLocaleLowerCase('tr-TR').includes('rota')),
      'operationSignals entry üretilebiliyor',
    ),
  );

  const hub = buildCityJournalHubPresentation(day10, []);
  record(assert(checks, Boolean(hub.title), 'Hub compact helper var'));
  record(assert(checks, hub.visible === shouldShowCityJournalLite(day10), 'Hub visibility tutarlı'));

  const reportLine = buildCityJournalReportLine(day10, []);
  record(assert(checks, Boolean(reportLine?.includes('Günlüğe işlendi')), 'Report line helper var'));

  const mapHint = buildCityJournalMapHint(day10, 'sanayi', []);
  record(assert(checks, mapHint.visible === false || Boolean(mapHint.line), 'Map helper optional'));

  const duplicateMain = 'Rota baskısı bugün öne çıkıyor.';
  const deduped = buildCityJournalLiteModel({
    currentDay: 9,
    operationSignals: strainedSignals(),
    existingLines: [duplicateMain],
    decisionImpact: buildDecisionImpactExplanation({
      day: 9,
    }),
  });
  record(
    assert(
      checks,
      !deduped.entries.some((e) => isCityJournalDuplicate(e.line, [duplicateMain]) && e.line.includes(duplicateMain.slice(0, 20))),
      'Duplicate guard aktif',
    ),
  );

  for (const word of CITY_JOURNAL_LITE_FORBIDDEN_WORDS.slice(0, 6)) {
    record(assert(checks, cityJournalContainsForbiddenWords(`Bu metinde ${word} geçiyor`), `Forbidden: ${word}`));
  }

  const gamePersist = readRepo('src/store/gamePersist.ts');
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi'));
  record(assert(checks, !gamePersist.includes('cityJournalState'), 'persist shape değişmedi'));

  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  const dayPipeline = readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts');
  const eventGen = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  record(assert(checks, !applyDecision.includes('cityJournal'), 'applyDecision değişmedi'));
  record(assert(checks, !dayPipeline.includes('cityJournal'), 'dayPipeline değişmedi'));
  record(assert(checks, !eventGen.includes('cityJournal'), 'event generation değişmedi'));

  const hubUi = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  const reportUi = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  record(assert(checks, hubUi.includes('HubCityJournalStrip') || hubUi.includes('cityJournal'), 'Hub UI entegrasyonu'));
  record(assert(checks, reportUi.includes('cityJournal') || reportUi.includes('CityJournal'), 'Report UI entegrasyonu'));
  record(assert(checks, !readRepo('src/app/_layout.tsx').includes('city-journal'), 'Yeni route yok'));

  const pkg = readRepo('package.json');
  record(assert(checks, pkg.includes('verify:city-journal'), 'verify:city-journal script'));

  const docs = readRepo('docs/crevia-city-journal-lite.md');
  record(assert(checks, docs.length > 400, 'city journal docs mevcut'));

  const dupKey = buildCityJournalLiteDuplicateKey({
    day: 9,
    districtId: 'sanayi',
    kind: 'route_balanced',
    sourceKind: 'content_pack',
    contentPackFamilyId: 'family',
  });
  record(assert(checks, dupKey.includes('sanayi'), 'duplicateKey district içerir'));

  const visibility = buildCityJournalLiteVisibility({ currentDay: 3 });
  record(assert(checks, visibility.maxEntries === 1, 'visibility maxEntries day 3'));

  const reportPresentation = buildCityJournalReportPresentation(day10, [reportLine ?? '']);
  record(assert(checks, reportPresentation.label.length > 0, 'Report presentation label'));

  const visibleLines = collectCityJournalVisibleLines(day10);
  record(assert(checks, visibleLines.length <= CITY_JOURNAL_LITE_REPORT_MAX_ENTRIES + 2, 'visible lines capped'));

  record(
    assert(
      checks,
      hub.primaryLine ? hub.primaryLine.split('Gün').length - 1 <= CITY_JOURNAL_LITE_HUB_MAX_ENTRIES + 1 : true,
      'Hub kart yoğunluğu sınırlı',
    ),
  );

  return { ok, checks };
}
