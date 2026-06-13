import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDevJumpPilotCompletedGameState } from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  MAIN_OPERATION_FEEL_FORBIDDEN_WORDS,
  MAIN_OPERATION_FEEL_OPENING_DAY,
} from './mainOperationFeelConstants';
import {
  buildMainOperationFeelFallbackModel,
  buildMainOperationFeelModel,
  isMainOperationFeelDuplicate,
  mainOperationFeelContainsForbiddenWords,
  shouldShowMainOperationFeel,
} from './mainOperationFeelModel';
import {
  buildMainOperationFeelFromStore,
  buildMainOperationFeelHubPresentation,
  buildMainOperationFeelInputFromStore,
  buildMainOperationFeelMapHint,
  buildMainOperationFeelReportPresentation,
} from './mainOperationFeelPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;

export type VerifyMainOperationFeelOutcome = {
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

function completedDay8GameState() {
  const gs = buildDevJumpPilotCompletedGameState(createDay1Seed().gameState);
  return {
    ...gs,
    city: { ...gs.city, day: 8 },
  };
}

export function verifyMainOperationFeelScenario(): VerifyMainOperationFeelOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const day3 = buildMainOperationFeelModel({ day: 3, isPilotCompleted: true });
  record(assert(checks, !day3.visible, 'Day 1-7 ana operasyon feel görünmez (day 3)'));
  record(assert(checks, !shouldShowMainOperationFeel({ day: 5, isPilotCompleted: true }), 'Day 5 feel kapalı'));

  const day7 = buildMainOperationFeelModel({
    day: 7,
    isPilotCompleted: true,
    postPilotPhase: 'pilot_complete_idle',
  });
  record(assert(checks, !day7.visible, 'Day 7 pilot completion duplicate yok — feel kapalı'));

  const day8Light = buildMainOperationFeelModel({
    day: 8,
    isPilotCompleted: true,
    accessMode: 'limited',
    postPilotPhase: 'main_operation_light',
    mainOperationSeason: createFullMainOperationSeasonState(8),
    operationSignals: {
      vehicles: { status: 'watch', summary: 'Rota baskısı' },
      containers: { status: 'watch', summary: 'Konteyner baskısı' },
    },
  });
  record(assert(checks, day8Light.visible, 'Day 8 feel görünür'));
  record(assert(checks, day8Light.tone === 'opening', 'Day 8 opening tone'));
  record(assert(checks, day8Light.accessMode === 'light', 'Day 8 light access'));
  record(assert(checks, day8Light.scopeLine.length > 10, 'scopeLine üretiliyor'));
  record(assert(checks, Boolean(day8Light.eceLine), 'eceLine üretilebiliyor'));
  record(assert(checks, Boolean(day8Light.reportLine), 'reportLine üretilebiliyor'));
  record(assert(checks, Boolean(day8Light.mapLine), 'mapLine üretilebiliyor'));
  record(assert(checks, day8Light.shouldShowHubHero, 'Day 8 hub hero açık'));

  const day9Full = buildMainOperationFeelModel({
    day: 9,
    isPilotCompleted: true,
    accessMode: 'full',
    postPilotPhase: 'main_operation_full',
    mainOperationSeason: createFullMainOperationSeasonState(9),
    operationSignals: {
      priorityDistrictId: 'merkez',
      districts: { status: 'watch', summary: 'Mahalle baskısı' },
    },
    districtTrustRuntime: { merkez: { state: 'fragile' } },
  });
  record(assert(checks, day9Full.tone !== 'opening', 'Day 9+ compact tone'));
  record(assert(checks, day9Full.accessMode === 'full', 'full access mode'));
  record(assert(checks, Boolean(day9Full.districtFocusLine), 'districtFocusLine üretilebiliyor'));
  record(
    assert(
      checks,
      day9Full.subtitle.includes('geniş') || day9Full.subtitle.includes('Şehir'),
      'full access sezon/kapsam hissi',
    ),
  );

  const day9Light = buildMainOperationFeelModel({
    day: 9,
    isPilotCompleted: true,
    accessMode: 'limited',
    postPilotPhase: 'main_operation_light',
    mainOperationSeason: createFullMainOperationSeasonState(9),
  });
  record(
    assert(
      checks,
      day9Light.subtitle.includes('önizleme') || day9Light.subtitle.includes('sınırlı'),
      'light access sakin ton',
    ),
  );

  for (const word of MAIN_OPERATION_FEEL_FORBIDDEN_WORDS) {
    record(
      assert(
        checks,
        !mainOperationFeelContainsForbiddenWords(`${day8Light.title} ${day8Light.subtitle}`),
        `forbidden word guard (${word})`,
        `forbidden word sızıntısı: ${word}`,
      ),
    );
  }
  record(
    assert(
      checks,
      !mainOperationFeelContainsForbiddenWords(day9Light.subtitle) &&
        !mainOperationFeelContainsForbiddenWords(day8Light.primaryCTA ?? ''),
      'light access satış baskısı yok',
    ),
  );

  const fallback = buildMainOperationFeelFallbackModel(8);
  record(
    assert(
      checks,
      fallback.scopeLine.includes('sınırlı') || fallback.subtitle.includes('sınırlı'),
      'fallback güvenli',
    ),
  );

  const duplicateGuard = isMainOperationFeelDuplicate(day8Light.scopeLine, [day8Light.scopeLine]);
  record(assert(checks, duplicateGuard, 'Duplicate guard çalışır'));

  const tomorrowDup = buildMainOperationFeelModel({
    day: 8,
    isPilotCompleted: true,
    accessMode: 'full',
    postPilotPhase: 'main_operation_full',
    mainOperationSeason: createFullMainOperationSeasonState(8),
    tomorrowRisk: {
      id: 'tr-dup',
      kind: 'operation_era_hint',
      title: 'Operasyon',
      mainLine: day8Light.scopeLine,
      tone: 'watch',
      priority: 'medium',
      sourceSignals: ['operation_era'],
      maxVisibleLines: 2,
      shouldShowInHub: true,
      shouldShowInReport: true,
      shouldShowAsCompact: true,
    },
    existingLines: [day8Light.scopeLine],
  });
  record(
    assert(
      checks,
      !tomorrowDup.reportLine?.includes(day8Light.scopeLine.slice(0, 20)) ||
        tomorrowDup.reportLine !== day8Light.scopeLine,
      'TomorrowRisk duplicate guard',
    ),
  );

  const progressionDup = buildMainOperationFeelModel({
    day: 8,
    isPilotCompleted: true,
    accessMode: 'full',
    postPilotPhase: 'main_operation_full',
    mainOperationSeason: createFullMainOperationSeasonState(8),
    progressionBridgeScopeLine: day8Light.subtitle,
    existingLines: [day8Light.subtitle],
  });
  record(assert(checks, progressionDup.visible, 'ProgressionBridge duplicate guard — model üretilir'));

  const hubPresentation = buildMainOperationFeelHubPresentation(day8Light);
  record(assert(checks, hubPresentation.visible, 'Hub integration helper var'));

  const reportPresentation = buildMainOperationFeelReportPresentation(day8Light);
  record(assert(checks, reportPresentation.visible, 'Report integration helper var'));

  const mapPresentation = buildMainOperationFeelMapHint(day8Light);
  record(assert(checks, mapPresentation.visible, 'Map hint helper var'));

  const gsDay8 = completedDay8GameState();
  const monFull = mockPurchaseMainOperationPack(createInitialMonetizationState(), 8);
  const storeModel = buildMainOperationFeelFromStore({
    gameState: gsDay8,
    monetization: monFull,
    mainOperationSeason: createFullMainOperationSeasonState(8),
  });
  record(assert(checks, storeModel.visible, 'store input builder çalışır'));

  const gsDay8Limited = completedDay8GameState();
  const monLimited = selectLimitedContinue(createInitialMonetizationState(), 8);
  const limitedModel = buildMainOperationFeelFromStore({
    gameState: gsDay8Limited,
    monetization: monLimited,
    mainOperationSeason: createFullMainOperationSeasonState(8),
  });
  record(assert(checks, limitedModel.accessMode === 'light', 'limited store access'));

  record(assert(checks, MAIN_OPERATION_FEEL_OPENING_DAY === 8, 'opening day = 8'));
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi', 'SAVE_VERSION değişti'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('mainOperationFeel'), 'gamePersist değişmedi'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('mainOperationFeel'), 'applyDecision değişmedi'));
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('mainOperationFeel'),
      'event generation değişmedi',
    ),
  );
  record(assert(checks, readRepo('package.json').includes('verify:main-operation-feel'), 'package.json script var'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-main-operation-feel.md')), 'docs var'));
  record(
    assert(
      checks,
      readRepo('docs/crevia-main-operation-feel.md').includes('Content Pack Runtime Activation Lite'),
      'content variety doc notu',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/hub/components/HubMainOperationFeelCard.tsx').includes('HubMainOperationFeelCard'),
      'Hub integration component var',
    ),
  );
  record(
    assert(
      checks,
      (() => {
        const hubHome = readRepo('src/features/hub/components/HubReferenceHome.tsx');
        const centerHome = readRepo('src/features/hub/utils/centerHomePresentation.ts');
        const opFocusPresentation = readRepo(
          'src/features/hub/utils/centerOperationFocusPresentation.ts',
        );
        const hubScreen = readRepo('src/features/hub/screens/HubScreen.tsx');
        return (
          hubHome.includes('CenterOperationFocusSection') &&
          hubHome.includes('presentation.operationFocus') &&
          centerHome.includes('mainOperationFeelPresentation') &&
          opFocusPresentation.includes('input.mainOperationFeelPresentation') &&
          hubScreen.includes('buildMainOperationFeelHubPresentation')
        );
      })(),
      'HubReferenceHome entegrasyonu',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/reports/components/ReportMainOperationSeasonCard.tsx').includes('mainOperationFeel'),
      'Report entegrasyonu',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/screens/MapScreen.tsx').includes('mainOperationFeel') ||
        readRepo('src/features/map/utils/mapUiPresentation.ts').includes('mainOperationScopeHintLine'),
      'Map hint entegrasyonu',
    ),
  );

  const inputBuilder = buildMainOperationFeelInputFromStore({
    gameState: gsDay8,
    monetization: monFull,
    mainOperationSeason: createFullMainOperationSeasonState(8),
  });
  record(assert(checks, inputBuilder.day === 8, 'input from store day'));

  return { ok, checks };
}
