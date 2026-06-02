import { getDistrictOperationDefinitions } from '@/core/districtOperations/districtOperationModel';
import type { DistrictOperationDefinition } from '@/core/districtOperations/districtOperationTypes';
import {
  EVENT_FAMILY_VERIFY_FIXTURES,
  EVENT_FAMILY_VERIFY_VARIANTS,
} from '@/core/eventFamilies/eventFamilyConstants';
import type {
  EventFamilyDefinition,
  EventFamilyVariantDefinition,
} from '@/core/eventFamilies/eventFamilyTypes';
import { getOperationEraDefinitions } from '@/core/operationEra/operationEraModel';
import type { OperationEraDefinition } from '@/core/operationEra/operationEraTypes';

import {
  CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS,
  CONTENT_PRODUCTION_VERIFY_PACK_ID,
} from './contentProductionConstants';
import type {
  ContentPackValidationResult,
  CreviaContentCopyBlock,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionIssue,
  CreviaContentProductionSurface,
} from './contentProductionTypes';

function containsForbiddenCopy(text: string, isPlayerFacing: boolean): boolean {
  if (!isPlayerFacing) return false;
  const normalized = text.toLocaleLowerCase('tr-TR');
  return CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

function issue(
  id: string,
  severity: CreviaContentProductionIssue['severity'],
  kind: CreviaContentProductionIssue['kind'],
  message: string,
  extra?: Partial<CreviaContentProductionIssue>,
): CreviaContentProductionIssue {
  return { id, severity, kind, message, ...extra };
}

function mapEchoSurface(surface: string): CreviaContentProductionSurface {
  switch (surface) {
    case 'advisor':
      return 'advisor_echo';
    case 'report':
      return 'report_echo';
    case 'social':
      return 'social_echo';
    case 'map':
      return 'map_hint';
    case 'tomorrow_preview':
      return 'tomorrow_preview';
    case 'operation_result':
      return 'operation_result';
    case 'hub':
      return 'hub';
    default:
      return 'report_echo';
  }
}

function buildEchoCopyBlocks(
  itemId: string,
  surfaces: CreviaContentProductionSurface[],
  baseText: string,
): CreviaContentCopyBlock[] {
  return surfaces.map((surface) => ({
    id: `${itemId}_${surface}`,
    surface,
    text: `${baseText} (${surface})`,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

export function defineCreviaContentPackItem(
  item: CreviaContentPackItem,
): ContentPackValidationResult {
  const issues: CreviaContentProductionIssue[] = [];

  if (!item.id) issues.push(issue('item_missing_id', 'fail', 'stale_pack', 'Item id eksik.'));
  if (!item.packId) issues.push(issue('item_missing_pack', 'fail', 'stale_pack', 'Item packId eksik.'));
  if (!item.title) issues.push(issue('item_missing_title', 'warn', 'weak_district_identity', 'Item title eksik.'));

  for (const block of item.copyBlocks) {
    if (containsForbiddenCopy(block.text, block.isPlayerFacing)) {
      issues.push(
        issue('item_forbidden_copy', 'blocker', 'forbidden_copy', 'Player-facing yasaklı ifade.', {
          itemId: item.id,
        }),
      );
    }
  }

  const status = issues.some((i) => i.severity === 'blocker' || i.severity === 'fail')
    ? 'fail'
    : issues.length > 0
      ? 'warn'
      : 'pass';

  return { status, issues };
}

export function defineCreviaContentPack(pack: CreviaContentPackDefinition): ContentPackValidationResult {
  return validateContentPackDefinition(pack);
}

export function buildContentPackItemFromEventFamily(
  family: EventFamilyDefinition,
  variants: readonly EventFamilyVariantDefinition[] = EVENT_FAMILY_VERIFY_VARIANTS.filter(
    (variant) => variant.familyId === family.id,
  ),
  packId = CONTENT_PRODUCTION_VERIFY_PACK_ID,
): CreviaContentPackItem {
  const echoSurfaces = [
    'advisor_echo',
    'report_echo',
    'social_echo',
    'map_hint',
    'tomorrow_preview',
  ] as CreviaContentProductionSurface[];

  const variantKinds = variants.length > 0 ? variants.map((v) => v.kind) : ['normal'];

  return {
    id: `cp_item_ef_${family.id}`,
    packId,
    surface: 'event_family',
    title: family.title,
    districtIds: [...family.primaryDistrictIds],
    domains: [family.domain],
    operationEraIds: family.domain === 'operation_era' ? ['core_city_operations'] : [],
    eventFamilyIds: [family.id],
    variantKinds,
    echoSurfaces,
    mapLayerIds: ['resource_pressure'],
    rankPermissionIds: family.unlockRankPermissionId ? [family.unlockRankPermissionId] : [],
    tags: [...family.qualityTags, family.domain],
    copyBlocks: buildEchoCopyBlocks(
      `cp_item_ef_${family.id}`,
      echoSurfaces,
      family.description,
    ),
    metadata: { source: 'event_family_foundation' },
  };
}

export function buildContentPackItemFromDistrictOperation(
  operation: DistrictOperationDefinition,
  packId = CONTENT_PRODUCTION_VERIFY_PACK_ID,
): CreviaContentPackItem {
  const echoSurfaces: CreviaContentProductionSurface[] = [
    'report_echo',
    'map_hint',
    'advisor_echo',
  ];

  return {
    id: `cp_item_do_${operation.id}`,
    packId,
    surface: 'district_operation',
    title: operation.title,
    districtIds: [operation.districtId],
    domains: operation.relatedEventFamilyDomains,
    operationEraIds: [],
    echoSurfaces,
    mapLayerIds: operation.relatedMapLayerIds,
    rankPermissionIds: operation.requiredPermissionId ? [operation.requiredPermissionId] : [],
    tags: [operation.kind, operation.districtId],
    copyBlocks: buildEchoCopyBlocks(
      `cp_item_do_${operation.id}`,
      echoSurfaces,
      operation.description,
    ),
    metadata: { source: 'district_operation_foundation', kind: operation.kind },
  };
}

export function buildContentPackItemFromOperationEra(
  era: OperationEraDefinition,
  packId = CONTENT_PRODUCTION_VERIFY_PACK_ID,
): CreviaContentPackItem {
  const echoSurfaces: CreviaContentProductionSurface[] = ['hub', 'report_echo', 'advisor_echo'];

  return {
    id: `cp_item_oe_${era.id}`,
    packId,
    surface: 'operation_era',
    title: era.title,
    districtIds: [],
    domains: era.relatedEventFamilyDomains,
    operationEraIds: [era.id],
    echoSurfaces,
    mapLayerIds: era.relatedMapLayerIds,
    rankPermissionIds: era.requiredPermissionId ? [era.requiredPermissionId] : [],
    tags: [...era.contentHooks, ...era.focusDomains],
    copyBlocks: buildEchoCopyBlocks(`cp_item_oe_${era.id}`, echoSurfaces, era.flavorLine),
    metadata: { source: 'operation_era_foundation', futureOnly: era.isFutureOnly },
  };
}

export function buildContentPackDefinition(
  input: Omit<CreviaContentPackDefinition, 'items'> & { items?: CreviaContentPackItem[] },
): CreviaContentPackDefinition {
  return {
    ...input,
    items: input.items ?? [],
  };
}

export function validateContentPackDefinition(pack: CreviaContentPackDefinition): ContentPackValidationResult {
  const issues: CreviaContentProductionIssue[] = [];

  if (!pack.id) issues.push(issue('pack_missing_id', 'fail', 'stale_pack', 'Pack id eksik.', { packId: pack.id }));
  if (!pack.title) issues.push(issue('pack_missing_title', 'fail', 'stale_pack', 'Pack title eksik.', { packId: pack.id }));
  if (!pack.version) issues.push(issue('pack_missing_version', 'warn', 'stale_pack', 'Pack version eksik.', { packId: pack.id }));
  if (!pack.status) issues.push(issue('pack_missing_status', 'warn', 'stale_pack', 'Pack status eksik.', { packId: pack.id }));
  if (pack.targetDistrictIds.length === 0) {
    issues.push(issue('pack_missing_districts', 'warn', 'missing_district_coverage', 'targetDistrictIds boş.', { packId: pack.id }));
  }
  if (pack.targetDomains.length === 0) {
    issues.push(issue('pack_missing_domains', 'warn', 'missing_domain_coverage', 'targetDomains boş.', { packId: pack.id }));
  }
  if (pack.targetSurfaces.length === 0) {
    issues.push(issue('pack_missing_surfaces', 'warn', 'missing_echo_surface', 'targetSurfaces boş.', { packId: pack.id }));
  }
  if (!/^\d+\.\d+\.\d+$/.test(pack.version) && pack.version !== 'verify-1') {
    issues.push(issue('pack_version_format', 'info', 'stale_pack', 'Version semver önerilir.', { packId: pack.id }));
  }

  for (const item of pack.items) {
    if (item.packId !== pack.id) {
      issues.push(
        issue('pack_item_mismatch', 'fail', 'stale_pack', 'Item packId uyumsuz.', {
          packId: pack.id,
          itemId: item.id,
        }),
      );
    }
    const itemResult = defineCreviaContentPackItem(item);
    issues.push(...itemResult.issues);
  }

  for (const item of pack.items) {
    for (const block of item.copyBlocks) {
      if (containsForbiddenCopy(block.text, block.isPlayerFacing)) {
        issues.push(
          issue('pack_forbidden_copy', 'blocker', 'forbidden_copy', 'Pack player-facing yasaklı ifade.', {
            packId: pack.id,
            itemId: item.id,
          }),
        );
      }
    }
  }

  const status = issues.some((i) => i.severity === 'blocker' || i.severity === 'fail')
    ? 'fail'
    : issues.length > 0
      ? 'warn'
      : 'pass';

  return { status, issues };
}

export function buildVerifyOnlyFoundationContentPack(): CreviaContentPackDefinition {
  const eventItems = EVENT_FAMILY_VERIFY_FIXTURES.map((family) =>
    buildContentPackItemFromEventFamily(family),
  );
  const districtItems = getDistrictOperationDefinitions().slice(0, 6).map((operation) =>
    buildContentPackItemFromDistrictOperation(operation),
  );
  const eraItems = getOperationEraDefinitions().slice(0, 6).map((era) =>
    buildContentPackItemFromOperationEra(era),
  );

  const items = [...eventItems, ...districtItems, ...eraItems];

  const targetDistrictIds = [...new Set(items.flatMap((item) => item.districtIds))];
  const targetDomains = [...new Set(items.flatMap((item) => item.domains))];
  const targetOperationEraIds = [...new Set(items.flatMap((item) => item.operationEraIds))];
  const targetSurfaces = [...new Set(items.map((item) => item.surface))];

  return buildContentPackDefinition({
    id: CONTENT_PRODUCTION_VERIFY_PACK_ID,
    title: 'Content Production Verify Foundation Pack',
    description: 'Verify-only internal fixture; runtime’a bağlanmaz.',
    kind: 'open_operation_core',
    status: 'qa',
    version: 'verify-1',
    owner: 'content_production_foundation',
    targetDistrictIds,
    targetDomains,
    targetOperationEraIds,
    targetSurfaces,
    relatedRankPermissionIds: ['event_family_rotation_preview', 'operation_era_preview'],
    relatedMapLayerIds: ['operation_era', 'district_trust', 'resource_pressure'],
    releaseNotes: 'Foundation verify fixture only.',
    createdForPhase: 'content_production_mvp',
    isRuntimeLinked: false,
    isFutureOnly: false,
    items,
  });
}

export const CONTENT_PRODUCTION_VERIFY_PACK = buildVerifyOnlyFoundationContentPack();

export { mapEchoSurface };
