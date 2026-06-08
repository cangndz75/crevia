import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES,
  buildMapDistrictIntelligenceChips,
  buildMapDistrictIntelligenceDebugRows,
  buildMapDistrictIntelligenceModel,
  buildMapDistrictIntelligenceVisibility,
  buildSelectedDistrictMemoryMapLine,
  buildSelectedDistrictOperationMapLine,
  buildSelectedDistrictTrustMapLine,
  mapDistrictIntelligenceCopyContainsForbiddenTerms,
  mapDistrictIntelligenceCopyContainsPanicTerms,
  resolveMapDistrictIntelligenceLayerFocus,
  validateMapDistrictIntelligenceCopy,
} from './mapDistrictIntelligencePresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyMapDistrictIntelligenceOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export function verifyMapDistrictIntelligenceScenario(): VerifyMapDistrictIntelligenceOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  let emptyCrash = false;
  try {
    buildMapDistrictIntelligenceModel({});
    buildMapDistrictIntelligenceModel({ selectedDistrictId: undefined });
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty state no crash', 'empty state crash'));

  for (const id of MAP_DISTRICT_IDENTITY_IDS) {
    const model = buildMapDistrictIntelligenceModel({ selectedDistrictId: id, day: 10, isPostPilot: true });
    record(assert(checks, model.districtId === id, `model ${id}`, `missing ${id}`));
    record(assert(checks, model.isHintOnly === true, `${id} hint only`, `${id} not hint`));
  }

  const day1 = buildMapDistrictIntelligenceModel({ selectedDistrictId: 'merkez', day: 1 });
  record(
    assert(
      checks,
      day1.visibility.mode === 'identity_only' &&
        !day1.memoryLine &&
        !day1.operationLine &&
        day1.visibleLines.length <= 1,
      'day 1 simplified',
      'day1 complexity exposed',
    ),
  );

  const day2 = buildMapDistrictIntelligenceModel({ selectedDistrictId: 'merkez', day: 2 });
  record(
    assert(
      checks,
      day2.visibility.showOperation === false && day2.visibleLines.length <= 2,
      'day 2-3 operation hidden',
      'day2 operation exposed',
    ),
  );

  const day5 = buildMapDistrictIntelligenceModel({ selectedDistrictId: 'merkez', day: 5 });
  record(
    assert(
      checks,
      !!buildSelectedDistrictTrustMapLine({ selectedDistrictId: 'merkez', day: 5 }),
      'day 4+ trust line',
      'day4 trust missing',
    ),
  );
  record(
    assert(
      checks,
      !!buildSelectedDistrictMemoryMapLine({ selectedDistrictId: 'merkez', day: 5 }),
      'day 4+ memory line',
      'day4 memory missing',
    ),
  );
  record(
    assert(
      checks,
      !!buildSelectedDistrictOperationMapLine({ selectedDistrictId: 'merkez', day: 5 }),
      'day 4+ operation line',
      'day4 operation missing',
    ),
  );

  const postPilot = buildMapDistrictIntelligenceModel({
    selectedDistrictId: 'sanayi',
    day: POST_PILOT_FIRST_OPERATION_DAY,
    isPostPilot: true,
    rankKey: 'operations_director',
    unlockedPermissionIds: ['district_specific_operations_preview'],
  });
  record(
    assert(
      checks,
      postPilot.visibility.mode === 'detailed' && postPilot.visibleLines.length >= 2,
      'post-pilot detailed visibility',
      'post-pilot visibility wrong',
    ),
  );

  const crisisModel = buildMapDistrictIntelligenceModel({
    selectedDistrictId: 'merkez',
    day: 10,
    crisisOverlayVisible: true,
    crisisState: { riskLevel: 'watch', trend: 'elevated' },
  });
  record(
    assert(
      checks,
      crisisModel.crisisPriorityActive && crisisModel.visibleLines.length <= 1,
      'crisis priority compact',
      'crisis priority wrong',
    ),
  );
  record(
    assert(
      checks,
      !mapDistrictIntelligenceCopyContainsPanicTerms(crisisModel.visibleLines[0]?.text ?? 'izleniyor'),
      'crisis no panic copy',
      'panic copy',
    ),
  );

  const trustFocus = buildMapDistrictIntelligenceModel({
    selectedDistrictId: 'cumhuriyet',
    day: 10,
    activeMapLayerId: 'district_trust',
  });
  record(
    assert(
      checks,
      trustFocus.layerFocus === 'trust' && trustFocus.visibleLines[0]?.kind === 'trust',
      'trust layer focus',
      'trust focus wrong',
    ),
  );

  const memoryFocus = buildMapDistrictIntelligenceModel({
    selectedDistrictId: 'cumhuriyet',
    day: 10,
    activeMapLayerId: 'district_memory',
  });
  record(
    assert(
      checks,
      memoryFocus.layerFocus === 'memory' && memoryFocus.visibleLines[0]?.kind === 'memory',
      'memory layer focus',
      'memory focus wrong',
    ),
  );

  const operationFocus = buildMapDistrictIntelligenceModel({
    selectedDistrictId: 'sanayi',
    day: 10,
    activeMapLayerId: 'district_identity',
  });
  record(
    assert(
      checks,
      operationFocus.layerFocus === 'operation' &&
        operationFocus.visibleLines.some((line) => line.kind === 'operation'),
      'operation layer focus',
      'operation focus wrong',
    ),
  );

  const baseFocus = buildMapDistrictIntelligenceModel({
    selectedDistrictId: 'merkez',
    day: 10,
    activeMapLayerId: 'base_districts',
  });
  record(
    assert(
      checks,
      baseFocus.visibleLines.length <= 1,
      'base layer max one line',
      'base layer too many lines',
    ),
  );

  record(
    assert(
      checks,
      day5.visibleLines.length <= MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES,
      'max 3 lines',
      'too many lines',
    ),
  );

  record(assert(checks, validateMapDistrictIntelligenceCopy(day5), 'copy validation', 'copy invalid'));
  record(
    assert(
      checks,
      day5.visibleLines.every((line) => line.text.length <= 89),
      'copy max length',
      'copy too long',
    ),
  );
  record(
    assert(
      checks,
      !mapDistrictIntelligenceCopyContainsForbiddenTerms(day5.visibleLines[0]?.text ?? ''),
      'forbidden copy guard',
      'forbidden copy',
    ),
  );

  const opLine = day5.operationLine?.text ?? '';
  record(
    assert(
      checks,
      !opLine.toLocaleLowerCase('tr-TR').includes('başlat') && day5.operationLine?.isHintOnly === true,
      'operation not activation copy',
      'activation copy leak',
    ),
  );

  const uniqueLines = new Set(day5.visibleLines.map((line) => line.text.toLocaleLowerCase('tr-TR')));
  record(assert(checks, uniqueLines.size === day5.visibleLines.length, 'unique surface copy', 'duplicate copy'));

  const chips = buildMapDistrictIntelligenceChips({ selectedDistrictId: 'merkez', day: 10 });
  record(assert(checks, chips.length <= 2, 'strip chips max 2', 'too many chips'));

  record(assert(checks, resolveMapDistrictIntelligenceLayerFocus('district_trust') === 'trust', 'resolve trust layer', 'resolve fail'));
  record(assert(checks, buildMapDistrictIntelligenceDebugRows({ day: 10 }).length >= 5, 'debug rows', 'debug short'));

  const visibility = buildMapDistrictIntelligenceVisibility({ day: 1 });
  record(assert(checks, visibility.maxVisibleLines === 1, 'day1 visibility max 1', 'day1 max wrong'));

  record(assert(checks, !readRepo('src/core/game/ensureDailyEventsForDay.ts').includes('mapDistrictIntelligence'), 'ensureDaily untouched', 'ensureDaily touched'));
  record(assert(checks, readRepo('src/features/map/screens/MapScreen.tsx').includes('mapDistrictIntelligence'), 'MapScreen binding', 'MapScreen missing binding'));
  record(assert(checks, !readRepo('src/core/districtTrustRuntime/districtTrustRuntimeModel.ts').includes('mapDistrictIntelligence'), 'trustRuntime no circular', 'trust circular'));
  record(assert(checks, !readRepo('src/core/districtMemoryRuntime/districtMemoryRuntimeModel.ts').includes('mapDistrictIntelligence'), 'memoryRuntime no circular', 'memory circular'));
  record(assert(checks, !readRepo('src/core/districtOperationsRuntime/districtOperationsRuntimeModel.ts').includes('mapDistrictIntelligence'), 'operationsRuntime no circular', 'operations circular'));

  const docs = readRepo('docs/crevia-district-specific-operations-runtime-lite.md');
  record(assert(checks, docs.length > 0, 'runtime docs exist', 'docs missing'));

  return { ok, warn: false, checks };
}
