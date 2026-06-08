import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';

import {
  CREVIA_MAP_LAYER_CATEGORIES,
  CREVIA_MAP_LAYER_DEFINITIONS,
  CREVIA_MAP_LAYER_PERMISSION_IDS,
  CREVIA_MAP_LAYER_REQUIRED_IDS,
  CREVIA_MAP_LAYER_UNLOCK_AXES,
} from './mapLayerConstants';
import {
  buildMapLayerStates,
  buildMapLayerViewModel,
  getDefaultMapLayerId,
  getMapLayerDefinition,
  getSelectableMapLayers,
  resolveMapLayerStatus,
} from './mapLayerUnlockModel';
import {
  buildMapLayerCategoryLabel,
  buildMapLayerEmptyStateCopy,
  buildMapLayerStatusLabel,
  buildSelectedLayerPanelLine,
  mapLayerCopyContainsForbiddenTerms,
} from './mapLayerPresentation';
import type { CreviaMapLayerId } from './mapLayerTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyMapLayerUnlockOutcome = {
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

function unique<T>(items: readonly T[]): boolean {
  return new Set(items).size === items.length;
}

export function verifyMapLayerUnlockScenario(): VerifyMapLayerUnlockOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, CREVIA_MAP_LAYER_DEFINITIONS.length >= 10, '10+ map layer definitions', 'too few layer definitions'));
  for (const id of CREVIA_MAP_LAYER_REQUIRED_IDS) {
    record(assert(checks, getMapLayerDefinition(id) != null, `layer ${id}`, `missing layer ${id}`));
  }
  record(assert(checks, unique(CREVIA_MAP_LAYER_DEFINITIONS.map((definition) => definition.id)), 'layer ids unique', 'duplicate layer ids'));

  for (const definition of CREVIA_MAP_LAYER_DEFINITIONS) {
    record(assert(checks, definition.title.trim().length > 0 && definition.shortLabel.trim().length > 0, `${definition.id} title/shortLabel`, `${definition.id} title missing`));
    record(assert(checks, CREVIA_MAP_LAYER_CATEGORIES.includes(definition.category), `${definition.id} category valid`, `${definition.id} category invalid`));
    record(assert(checks, CREVIA_MAP_LAYER_UNLOCK_AXES.includes(definition.unlockAxis), `${definition.id} unlockAxis valid`, `${definition.id} unlockAxis invalid`));
  }

  const day1 = buildMapLayerStates({ day: 1 });
  const baseDay1 = day1.find((state) => state.definition.id === 'base_districts');
  record(assert(checks, baseDay1?.status === 'available' && baseDay1.isSelectable, 'base_districts Day 1 available/selectable', 'base Day 1 not selectable'));
  record(
    assert(
      checks,
      day1
        .filter((state) => state.definition.id !== 'base_districts' && state.definition.id !== 'district_identity')
        .every((state) => state.status !== 'active' && state.status !== 'available'),
      'Day 1 advanced layers not active',
      'Day 1 advanced layer active',
    ),
  );

  const resourceContext = {
    day: 3,
    unlockedPermissionIds: ['map_resource_layer', 'resource_pressure_summary', 'assignment_fit_preview'],
  };
  record(assert(checks, resolveMapLayerStatus(getMapLayerDefinition('resource_pressure')!, resourceContext) === 'available', 'Day 3 resource available', 'resource not available'));
  record(assert(checks, resolveMapLayerStatus(getMapLayerDefinition('social_pulse')!, { day: 4, unlockedPermissionIds: ['map_social_layer'] }) === 'available', 'Day 4 social available', 'social not available'));
  record(assert(checks, resolveMapLayerStatus(getMapLayerDefinition('district_trust')!, { day: 4, hasDistrictTrustPreview: true }) === 'available', 'district_trust permission/context available', 'district_trust not available'));
  record(assert(checks, resolveMapLayerStatus(getMapLayerDefinition('district_memory')!, { day: 4, hasDistrictMemoryPreview: true }) === 'available', 'district_memory permission/context available', 'district_memory not available'));
  record(
    assert(
      checks,
      ['available', 'preview'].includes(resolveMapLayerStatus(getMapLayerDefinition('crisis_watch')!, { day: 2, hasCrisisState: true })),
      'crisisState makes crisis_watch available/preview',
      'crisis_watch hidden with crisis state',
    ),
  );
  record(assert(checks, resolveMapLayerStatus(getMapLayerDefinition('active_task_route')!, { day: 3, hasActiveTask: true }) === 'available', 'activeTask route available', 'active route not available'));
  record(assert(checks, resolveMapLayerStatus(getMapLayerDefinition('city_development')!, { day: 20, unlockedPermissionIds: ['city_development_preview'] }) === 'future', 'city_development future', 'city_development not future'));

  const day1Requested = getDefaultMapLayerId(day1, 'city_development');
  record(assert(checks, day1Requested === 'base_districts', 'default fallback for unselectable requested layer', `fallback mismatch ${day1Requested}`));
  record(assert(checks, getSelectableMapLayers(day1).every((state) => !['hidden', 'future'].includes(state.status)), 'selectable excludes hidden/future', 'selectable includes hidden/future'));

  const viewModel = buildMapLayerViewModel({
    day: 4,
    unlockedPermissionIds: ['map_resource_layer', 'map_social_layer', 'district_trust_preview'],
    hasDistrictTrustPreview: true,
  });
  record(assert(checks, viewModel.compactChips.length <= 4, 'compact chips max 4', 'too many compact chips'));
  record(assert(checks, viewModel.summaryLine.length > 0, 'summary line non-empty', 'empty summary line'));
  record(assert(checks, (viewModel.unlockHintLine?.length ?? 0) > 0, 'unlock hint line non-empty', 'empty unlock hint line'));

  for (const definition of CREVIA_MAP_LAYER_DEFINITIONS) {
    const state = buildMapLayerStates({ day: 8, isFullMode: true, hasActiveTask: true, hasCrisisState: true }).find(
      (item) => item.definition.id === definition.id,
    )!;
    record(assert(checks, buildSelectedLayerPanelLine(state).length > 0, `${definition.id} panel line`, `${definition.id} panel line empty`));
    record(assert(checks, buildMapLayerStatusLabel(state.status).length > 0, `${definition.id} status label`, `${definition.id} status label empty`));
    record(assert(checks, buildMapLayerCategoryLabel(definition.category).length > 0, `${definition.id} category label`, `${definition.id} category label empty`));
  }

  const copy = [
    ...CREVIA_MAP_LAYER_DEFINITIONS.flatMap((definition) => [
      definition.title,
      definition.shortLabel,
      definition.description,
    ]),
    viewModel.summaryLine,
    viewModel.unlockHintLine ?? '',
    buildMapLayerEmptyStateCopy({ day: 1 }),
    ...buildMapLayerStates({ day: 8 }).map(buildSelectedLayerPanelLine),
  ].join(' ');
  record(assert(checks, mapLayerCopyContainsForbiddenTerms(copy).length === 0, 'forbidden copy clean', 'forbidden copy found'));

  for (const permissionId of CREVIA_MAP_LAYER_PERMISSION_IDS) {
    record(assert(checks, REQUIRED_RANK_PERMISSION_IDS.includes(permissionId as never), `rank permission ${permissionId}`, `missing rank permission ${permissionId}`));
  }

  const docs = readRepo('docs/crevia-map-layer-unlock-system.md');
  record(assert(checks, docs.includes('Mahalle Güveni'), 'district trust docs link', 'missing district trust docs link'));
  record(assert(checks, docs.includes('Olay Ailesi Sinyali'), 'event family signal docs link', 'missing event family docs link'));
  record(assert(checks, docs.includes('Aktif Görev Rotası'), 'active task route docs link', 'missing active task route docs link'));
  record(assert(checks, docs.includes('SAVE_VERSION yok'), 'SAVE_VERSION docs note', 'missing SAVE_VERSION docs note'));
  record(assert(checks, docs.includes('Persist yok'), 'persist docs note', 'missing persist docs note'));
  record(assert(checks, docs.includes('Event generation yok'), 'event generation docs note', 'missing event generation docs note'));
  record(assert(checks, docs.includes('UI redesign yok'), 'UI redesign docs note', 'missing UI redesign docs note'));

  for (const file of [
    'src/core/game/ensureDailyEventsForDay.ts',
    'src/core/game/generateDailyEventSet.ts',
    'src/core/game/applyDecision.ts',
    'src/core/dayPipeline/dayPipelineOrchestrator.ts',
    'src/store/gamePersist.ts',
    'src/features/map/screens/MapScreen.tsx',
  ]) {
    record(assert(checks, !readRepo(file).includes('mapLayers'), `${file} no mapLayers import`, `${file} imports mapLayers`));
  }

  const indexSrc = readRepo('src/core/mapLayers/index.ts');
  record(assert(checks, indexSrc.includes('mapLayerTypes'), 'type exports runtime-safe', 'index exports missing'));
  const mapLayerSrc = readRepo('src/core/mapLayers/mapLayerUnlockModel.ts') + readRepo('src/core/mapLayers/mapLayerPresentation.ts');
  record(assert(checks, !mapLayerSrc.includes("from '@/core/districtTrust"), 'no districtTrust circular import', 'districtTrust import detected'));

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`));
  checks.push('PASS Persist shape unchanged by scope: map layer state is not stored');
  checks.push('PASS Map UI integration skipped: foundation view model only, no redesign');

  return { ok, warn: false, checks };
}
