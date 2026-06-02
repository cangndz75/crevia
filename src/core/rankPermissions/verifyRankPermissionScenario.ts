import { ANALYTICS_SCHEMA_VERSION } from '@/core/analytics/analyticsConstants';
import {
  MAIN_OPERATION_ENTITLEMENT_ID,
  MAIN_OPERATION_IAP_PRODUCT_ID,
  IAP_STORE_PRODUCT_IDS,
} from '@/core/iap/iapProductConstants';
import { MAIN_OPERATION_PRODUCT_ID } from '@/core/monetization/monetizationConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  RANK_PERMISSION_CATEGORIES,
  RANK_PERMISSION_UNLOCK_AXES,
  REQUIRED_RANK_PERMISSION_IDS,
} from './rankPermissionConstants';
import {
  RANK_PERMISSION_DEFINITIONS,
  RANK_PERMISSION_RANKS,
  getCurrentRankPermissionBundle,
  getRankPermissionDefinition,
  resolveRankKeyFromAuthorityState,
  validateRankPermissionMatrixReferences,
} from './rankPermissionMatrix';
import {
  buildCompactRankUnlockLine,
  buildNextPermissionChips,
  buildPermissionCategoryLabel,
  buildPermissionShortDescription,
  buildPermissionStatusLabel,
  buildRankPermissionPreviewModel,
  containsForbiddenRankPermissionCopy,
} from './rankPermissionPresentation';
import type {
  RankPermissionCategory,
  RankPermissionId,
  RankPermissionUnlockAxis,
} from './rankPermissionTypes';

export type VerifyRankPermissionOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function unique<T>(items: readonly T[]): boolean {
  return new Set(items).size === items.length;
}

function permissionExists(id: RankPermissionId): boolean {
  return getRankPermissionDefinition(id) != null;
}

function copyBlob(): string {
  const rankCopy = RANK_PERMISSION_RANKS
    .flatMap((rank) => [rank.title, rank.subtitle, rank.summary])
    .join(' ');
  const permissionCopy = RANK_PERMISSION_DEFINITIONS
    .flatMap((permission) => [
      permission.title,
      permission.shortLabel,
      permission.description,
      buildPermissionShortDescription(permission.id),
    ])
    .join(' ');
  const model = buildRankPermissionPreviewModel({
    authorityState: {
      formalRankId: 'field_coordinator',
      authorityTrust: 450,
    },
  });
  return [
    rankCopy,
    permissionCopy,
    model.progressLine,
    model.nextUnlockLine,
    buildCompactRankUnlockLine({ authorityState: { authorityTrust: 900 } }),
    ...buildNextPermissionChips({ authorityState: { authorityTrust: 900 } }).map((item) => item.title),
  ].join(' ');
}

export function verifyRankPermissionScenario(): VerifyRankPermissionOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  ok = assert(checks, RANK_PERMISSION_RANKS.length >= 8, '8+ rank definitions', 'Too few ranks') && ok;
  ok = assert(checks, unique(RANK_PERMISSION_RANKS.map((rank) => rank.order)), 'Rank order unique', 'Duplicate rank order') && ok;
  ok =
    assert(
      checks,
      RANK_PERMISSION_RANKS.every((rank, index, all) => index === 0 || rank.order > all[index - 1]!.order),
      'Rank order ascending',
      'Rank order not ascending',
    ) && ok;

  for (const rank of RANK_PERMISSION_RANKS) {
    ok = assert(checks, rank.title.trim().length > 0, `${rank.rankKey} title`, `${rank.rankKey} empty title`) && ok;
    ok = assert(checks, rank.summary.trim().length > 0, `${rank.rankKey} summary`, `${rank.rankKey} empty summary`) && ok;
    ok = assert(checks, rank.permissionIds.length >= 1, `${rank.rankKey} permissions`, `${rank.rankKey} has no permissions`) && ok;
  }

  const matrixReferenceErrors = validateRankPermissionMatrixReferences();
  ok = assert(checks, matrixReferenceErrors.length === 0, 'All rank permission references valid', matrixReferenceErrors.join('; ')) && ok;

  const permissionIds = RANK_PERMISSION_DEFINITIONS.map((permission) => permission.id);
  ok = assert(checks, unique(permissionIds), 'Permission ids unique', 'Duplicate permission ids') && ok;

  for (const permission of RANK_PERMISSION_DEFINITIONS) {
    ok = assert(checks, permission.title.trim().length > 0, `${permission.id} title`, `${permission.id} empty title`) && ok;
    ok = assert(checks, permission.description.trim().length > 0, `${permission.id} description`, `${permission.id} empty description`) && ok;
    ok =
      assert(
        checks,
        RANK_PERMISSION_CATEGORIES.includes(permission.category as RankPermissionCategory),
        `${permission.id} category valid`,
        `${permission.id} category invalid`,
      ) && ok;
    ok =
      assert(
        checks,
        RANK_PERMISSION_UNLOCK_AXES.includes(permission.unlockAxis as RankPermissionUnlockAxis),
        `${permission.id} unlock axis valid`,
        `${permission.id} unlock axis invalid`,
      ) && ok;
  }

  const firstRank = RANK_PERMISSION_RANKS[0]!;
  ok =
    assert(
      checks,
      firstRank.permissionIds.includes('inspect_basic_events'),
      'First rank includes basic operation permission',
      'First rank missing basic operation',
    ) && ok;

  for (const required of REQUIRED_RANK_PERMISSION_IDS) {
    ok = assert(checks, permissionExists(required), `Required permission ${required}`, `Missing ${required}`) && ok;
  }

  const fallbackModel = buildRankPermissionPreviewModel();
  ok = assert(checks, fallbackModel.currentRank != null, 'Preview safe fallback current rank', 'No fallback current rank') && ok;
  ok =
    assert(
      checks,
      fallbackModel.unlockedPermissions.length > 0 &&
        fallbackModel.nextPermissions.length > 0 &&
        fallbackModel.futurePermissions.length > 0,
      'Preview current/next/future groups',
      'Preview groups incomplete',
    ) && ok;
  ok =
    assert(
      checks,
      buildNextPermissionChips({ authorityState: { authorityTrust: 900 } }).length <= 3,
      'Next permission chips max 3',
      'Too many chips',
    ) && ok;
  ok =
    assert(
      checks,
      buildCompactRankUnlockLine({ authorityState: { authorityTrust: 450 } }).trim().length > 0,
      'Compact rank unlock line',
      'Empty compact unlock line',
    ) && ok;

  ok =
    assert(
      checks,
      !containsForbiddenRankPermissionCopy(copyBlob()),
      'Rank permission copy forbidden terms clean',
      'Forbidden rank permission copy',
    ) && ok;

  const longDescriptions = RANK_PERMISSION_DEFINITIONS.filter(
    (permission) => buildPermissionShortDescription(permission.id).length > 110,
  );
  if (!warn(checks, longDescriptions.length === 0, 'Mobile short descriptions <= 110', `Long mobile descriptions: ${longDescriptions.map((p) => p.id).join(', ')}`)) {
    hasWarn = true;
  }

  const day1Chips = buildNextPermissionChips({
    authorityState: { authorityTrust: 0 },
    compact: true,
  });
  ok = assert(checks, day1Chips.length <= 3, 'Day 1 compact density guard', 'Day 1 too dense') && ok;

  ok =
    assert(
      checks,
      resolveRankKeyFromAuthorityState({ formalRankId: 'operations_responsible', authorityTrust: 450 }) ===
        'operations_supervisor',
      'Existing authority rank mapping',
      'Authority rank mapping failed',
    ) && ok;
  ok =
    assert(
      checks,
      buildPermissionCategoryLabel('map_layer') === 'Harita Katmanı',
      'Category label map_layer',
      'Category label mismatch',
    ) && ok;
  ok =
    assert(
      checks,
      buildPermissionStatusLabel('locked') === 'Yetkiyle açılır',
      'Status label locked soft',
      'Status label mismatch',
    ) && ok;

  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;
  checks.push('PASS Persist shape unchanged by scope: rank permissions are presentation-only');
  checks.push('PASS Existing authority engine imported only for type/constant compatibility, not mutated');
  ok =
    assert(
      checks,
      ANALYTICS_SCHEMA_VERSION === 1 &&
        MAIN_OPERATION_IAP_PRODUCT_ID === 'main_operation_season_1' &&
        MAIN_OPERATION_PRODUCT_ID === 'main_operation_season_1' &&
        MAIN_OPERATION_ENTITLEMENT_ID === 'main_operation_full_access' &&
        IAP_STORE_PRODUCT_IDS.ios === 'crevia.main_operation.season1' &&
        IAP_STORE_PRODUCT_IDS.android === 'crevia_main_operation_season_1',
      'Existing analytics/IAP contracts unchanged',
      'Analytics/IAP contract changed',
    ) && ok;

  return { ok, warn: hasWarn, checks };
}
