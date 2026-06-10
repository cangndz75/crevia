import { buildAuthorityRankLabel } from '@/core/authority/authorityPresentation';
import { createInitialAuthorityState, normalizeAuthorityState } from '@/core/authority/authoritySeed';
import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeModel';
import {
  MAIN_OPERATION_UI_COPY,
  resolveDistrictStatusForSeasonDay,
} from '@/core/mainOperation/mainOperationConstants';
import {
  getMainOperationSeasonDay,
  normalizeMainOperationSeasonState,
} from '@/core/mainOperation/mainOperationState';
import type { MainOperationAccessMode, MainOperationDistrictStatus } from '@/core/mainOperation/mainOperationTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  buildDistrictAuthorityRequirementLabel,
  buildDistrictOperationRequirementLabel,
  buildDistrictPlayerBenefit,
  buildDistrictRelatedSystems,
  buildDistrictSubtitle,
  buildDistrictUnlockCategoryLabel,
  buildDistrictUnlockDetailBody,
  buildDistrictUnlockDetailTitle,
  buildDistrictUnlockHeadline,
  buildDistrictUnlockHint,
  buildDistrictUnlockPhaseLabel,
  buildDistrictUnlockReason,
  buildDistrictUnlockStatePill,
  buildDistrictUnlockSubline,
  buildDistrictUnlockTitle,
  buildTrustBandLabel,
  DISTRICT_UNLOCK_CATEGORY_ORDER,
  DISTRICT_UNLOCK_CATEGORY_SUBTITLES,
  DISTRICT_UNLOCK_EMPTY_STATE,
  DISTRICT_UNLOCK_HUB_LINE_PREFIX,
  DISTRICT_UNLOCK_PROFILE_CTA,
  mapDistrictIdToCategory,
  mapDistrictIdToKind,
  mapMainOperationStatusToBindingState,
  mapProgressionPreviewStatusToBindingState,
} from './districtOperationUnlockBindingPresentation';
import {
  buildProgressionUnlockPreview,
  PROGRESSION_PREVIEW_DEFINITIONS,
} from './progressionBridge';
import type {
  BuildDistrictOperationUnlockBindingInput,
  DistrictOperationUnlockBindingCompactSummary,
  DistrictOperationUnlockBindingSummary,
  DistrictUnlockBindingItem,
  DistrictUnlockBindingState,
  DistrictUnlockCategoryBlock,
  DistrictUnlockPresentationCategory,
  MainOperationBindingItem,
} from './districtOperationUnlockBindingTypes';

const MAX_ACTIVE = 4;
const MAX_NEXT = 3;
const MAX_LOCKED = 4;
const MAX_CATEGORY_PREVIEW = 3;

function resolvePilotDistrictStatus(
  districtId: MapDistrictId,
  day: number,
): MainOperationDistrictStatus {
  switch (districtId) {
    case 'merkez':
    case 'cumhuriyet':
      return 'active';
    case 'sanayi':
      return day >= 3 ? 'active' : 'agenda';
    case 'istasyon':
      return day >= 5 ? 'preview' : 'inactive';
    case 'yesilvadi':
      return 'inactive';
    default:
      return 'inactive';
  }
}

function resolveDistrictMainOpStatus(
  districtId: MapDistrictId,
  day: number,
  accessMode: MainOperationAccessMode,
  seasonDay: number,
  isPostPilot: boolean,
): MainOperationDistrictStatus {
  if (!isPostPilot) {
    return resolvePilotDistrictStatus(districtId, day);
  }
  if (accessMode === 'none') {
    return resolvePilotDistrictStatus(districtId, day);
  }
  return resolveDistrictStatusForSeasonDay(
    districtId,
    seasonDay,
    accessMode === 'full' ? 'full' : 'limited',
  );
}

function buildBindingItem(
  districtId: MapDistrictId,
  state: DistrictUnlockBindingState,
  input: BuildDistrictOperationUnlockBindingInput,
  trustBand?: string,
  pressureLabel?: string,
): DistrictUnlockBindingItem {
  const isPostPilot = (input.currentDay ?? 1) >= POST_PILOT_FIRST_OPERATION_DAY;
  const subtitle = buildDistrictSubtitle(districtId);
  const unlockReason = buildDistrictUnlockReason(state, districtId);
  const unlockHint = buildDistrictUnlockHint(state, districtId);
  const playerBenefit = buildDistrictPlayerBenefit(state, districtId);
  const category = mapDistrictIdToCategory(districtId);

  return {
    id: `district_${districtId}`,
    districtId,
    title: buildDistrictUnlockTitle(districtId),
    subtitle,
    state,
    districtKind: mapDistrictIdToKind(districtId),
    presentationCategory: category,
    trustLabel: trustBand,
    pressureLabel,
    unlockReason,
    unlockHint,
    authorityRequirementLabel: buildDistrictAuthorityRequirementLabel(districtId, state),
    operationRequirementLabel: buildDistrictOperationRequirementLabel(state, isPostPilot),
    playerBenefit,
    relatedSystems: buildDistrictRelatedSystems(districtId),
    detailTitle: buildDistrictUnlockDetailTitle(districtId),
    detailBody: buildDistrictUnlockDetailBody(state, subtitle, unlockHint, playerBenefit),
    ctaLabel: state === 'next' ? 'İlerlemeni gör' : undefined,
    statePillLabel: buildDistrictUnlockStatePill(state),
    categoryLabel: buildDistrictUnlockCategoryLabel(category),
  };
}

function buildMainOperationLinks(
  input: BuildDistrictOperationUnlockBindingInput,
  authorityState: ReturnType<typeof normalizeAuthorityState>,
  isPostPilot: boolean,
  accessMode: MainOperationAccessMode,
): MainOperationBindingItem[] {
  const links: MainOperationBindingItem[] = [];

  if (!isPostPilot) {
    links.push({
      id: 'main_op_pilot',
      title: 'Pilot Operasyon Hattı',
      subtitle: 'Ana operasyon hattı pilot bölgedeki kararlarla şekilleniyor.',
      state: 'active',
      linkedDistrictIds: ['merkez', 'cumhuriyet'],
      linkedSystemLabels: ['Operasyon', 'Güven', 'Rapor'],
      unlockReason: 'Pilot döneminde aktif',
      playerBenefit: 'İlk kararların operasyon tarzını ve güven etkisini belirlersin.',
      detailTitle: 'Pilot Operasyon Hattı',
      detailBody:
        'Pilot bölgedeki kararlar ana operasyon hattının temelini oluşturur. Günlük operasyonları tamamladıkça şehir sinyalleri güçlenir.',
      statePillLabel: 'Aktif',
    });
    return links;
  }

  const limitedState: DistrictUnlockBindingState =
    accessMode === 'full' ? 'active' : accessMode === 'limited' ? 'next' : 'locked';

  links.push({
    id: 'main_op_open_ended',
    title: isPostPilot ? 'Açık Uçlu Ana Operasyon' : MAIN_OPERATION_UI_COPY.hubTitle,
    subtitle: 'Günlük kararların uzun vadeli şehir planına bağlanır.',
    state: limitedState,
    linkedDistrictIds: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
    linkedSystemLabels: ['Mahalle Güveni', 'Harita', 'Rapor', 'Şehir Hafızası'],
    unlockReason: 'Pilot dönem sonrası ana operasyon hattı genişler.',
    playerBenefit:
      'Tek olay çözmek yerine şehirde kalıcı operasyon izi oluşturursun.',
    riskLabel: accessMode === 'limited' ? 'Sınırlı gündem aktif' : undefined,
    detailTitle: 'Açık Uçlu Ana Operasyon',
    detailBody:
      'Ana operasyon hattı mahalle sinyallerini, milestone hedeflerini ve şehir hafızasını birbirine bağlar.',
    statePillLabel: buildDistrictUnlockStatePill(limitedState),
  });

  for (const definition of PROGRESSION_PREVIEW_DEFINITIONS) {
    const preview = buildProgressionUnlockPreview(authorityState, definition);
    const state = mapProgressionPreviewStatusToBindingState(preview.status);
    const linkedDistricts =
      definition.id === 'neighborhood_istasyon'
        ? ['istasyon']
        : definition.id === 'neighborhood_yesilvadi'
          ? ['yesilvadi']
          : ['merkez', 'cumhuriyet', 'sanayi'];

    links.push({
      id: definition.id,
      title: definition.title.replace(' Önizlemesi', '').replace(' Kapsamı', ''),
      subtitle: definition.subtitle,
      state,
      linkedDistrictIds: linkedDistricts,
      linkedSystemLabels: ['Yetki', 'Operasyon', 'Harita'],
      unlockReason: preview.reasonLine,
      playerBenefit:
        state === 'active'
          ? 'Bu kapsam bugün operasyon derinliğine katkı verir.'
          : 'Terfiyle birlikte yeni mahalle ve sistem bağları açılır.',
      detailTitle: definition.title,
      detailBody: `${definition.reasonLine} ${preview.reasonLine}`,
      statePillLabel: buildDistrictUnlockStatePill(state),
    });
  }

  return links.slice(0, 5);
}

function buildCategoryBlocks(
  allItems: DistrictUnlockBindingItem[],
): DistrictUnlockCategoryBlock[] {
  return DISTRICT_UNLOCK_CATEGORY_ORDER.map((categoryId) => {
    const items = allItems.filter((item) => item.presentationCategory === categoryId);
    const activeCount = items.filter((item) => item.state === 'active').length;
    return {
      id: categoryId,
      title: buildDistrictUnlockCategoryLabel(categoryId),
      subtitle: DISTRICT_UNLOCK_CATEGORY_SUBTITLES[categoryId],
      activeCount,
      totalCount: items.length,
      items,
      previewItems: items.slice(0, MAX_CATEGORY_PREVIEW),
    };
  }).filter((block) => block.totalCount > 0);
}

function sortByStatePriority(
  a: DistrictUnlockBindingItem,
  b: DistrictUnlockBindingItem,
): number {
  const weight = { active: 0, next: 1, locked: 2 };
  return weight[a.state] - weight[b.state];
}

export function buildDistrictOperationUnlockBindingSummary(
  input: BuildDistrictOperationUnlockBindingInput = {},
): DistrictOperationUnlockBindingSummary {
  const currentDay = Math.max(1, input.currentDay ?? input.pilotDay ?? 1);
  const authorityState = normalizeAuthorityState(
    input.authorityState ?? createInitialAuthorityState(currentDay),
    currentDay,
  );
  const isPostPilot = currentDay >= POST_PILOT_FIRST_OPERATION_DAY;

  const season = normalizeMainOperationSeasonState(input.mainOperationSeason, currentDay);
  const accessMode = season.accessMode ?? 'none';
  const seasonDay =
    season.currentSeasonDay > 0
      ? season.currentSeasonDay
      : getMainOperationSeasonDay(season, currentDay);

  const trustSnapshot = buildDistrictTrustRuntimeSnapshot({
    day: currentDay,
    operationSignals: input.operationSignals,
    socialPulse: input.socialPulse,
    crisisState: input.crisisState,
    resourceFatigue: input.resourceFatigue,
    dailyReport: input.dailyReport,
    carryOverMemory: input.carryOverMemory,
    unlockedPermissionIds: authorityState.unlockedPermissionIds,
  });

  const allDistrictItems: DistrictUnlockBindingItem[] = MAP_DISTRICT_IDENTITY_IDS.map(
    (districtId) => {
      const mainOpStatus = resolveDistrictMainOpStatus(
        districtId,
        currentDay,
        accessMode,
        seasonDay,
        isPostPilot,
      );
      const state = mapMainOperationStatusToBindingState(mainOpStatus);
      const trustDistrict = trustSnapshot.districts.find((d) => d.districtId === districtId);
      const trustLabel = buildTrustBandLabel(trustDistrict?.band);
      const pressureLabel =
        trustDistrict && (trustDistrict.band === 'fragile' || trustDistrict.band === 'strained')
          ? 'Baskı yüksek'
          : undefined;

      return buildBindingItem(districtId, state, { ...input, currentDay }, trustLabel, pressureLabel);
    },
  );

  const activeDistricts = allDistrictItems
    .filter((item) => item.state === 'active')
    .sort(sortByStatePriority);
  const nextDistricts = allDistrictItems
    .filter((item) => item.state === 'next')
    .sort(sortByStatePriority);
  const lockedDistricts = allDistrictItems
    .filter((item) => item.state === 'locked')
    .sort(sortByStatePriority);

  const mainOperationLinks = buildMainOperationLinks(
    { ...input, currentDay },
    authorityState,
    isPostPilot,
    accessMode,
  );

  const nextDistrict = nextDistricts[0];
  const recommendedNextStep = nextDistrict
    ? {
        title: nextDistrict.title,
        hint: nextDistrict.unlockHint,
        ctaLabel: 'Yetkilere bak',
      }
    : undefined;

  const activeCount = activeDistricts.length;
  const totalCount = allDistrictItems.length;

  return {
    headline: buildDistrictUnlockHeadline(activeCount, nextDistricts.length > 0, isPostPilot),
    subline: buildDistrictUnlockSubline(activeCount),
    currentPhaseLabel: buildDistrictUnlockPhaseLabel(currentDay, isPostPilot, accessMode),
    currentAuthorityLabel: buildAuthorityRankLabel(authorityState.formalRankId),
    activeDistrictCount: activeCount,
    totalDistrictCount: totalCount,
    activeDistricts: activeDistricts.slice(0, MAX_ACTIVE),
    nextDistricts: nextDistricts.slice(0, MAX_NEXT),
    lockedDistricts: lockedDistricts.slice(0, MAX_LOCKED),
    mainOperationLinks,
    recommendedNextStep,
    categoryBlocks: buildCategoryBlocks(allDistrictItems),
    emptyState: {
      visible: activeCount === 0 && nextDistricts.length === 0,
      title: DISTRICT_UNLOCK_EMPTY_STATE.title,
      body: DISTRICT_UNLOCK_EMPTY_STATE.body,
    },
    allDistrictItems,
  };
}

export function buildDistrictOperationUnlockBindingCompactSummary(
  input: BuildDistrictOperationUnlockBindingInput = {},
): DistrictOperationUnlockBindingCompactSummary {
  const currentDay = Math.max(1, input.currentDay ?? input.pilotDay ?? 1);
  const summary = buildDistrictOperationUnlockBindingSummary({ ...input, currentDay });
  const nextItem = summary.nextDistricts[0] ?? summary.recommendedNextStep;

  const visible =
    currentDay > 1 &&
    nextItem != null &&
    (summary.nextDistricts.length > 0 || summary.activeDistrictCount > 0);

  const nextTitle =
    'title' in (nextItem ?? {})
      ? (nextItem as DistrictUnlockBindingItem).title
      : summary.recommendedNextStep?.title;

  return {
    visible,
    activeCountLabel: `Aktif: ${summary.activeDistrictCount}`,
    nextExpansionTitle: nextTitle,
    nextExpansionLine: nextTitle
      ? `${DISTRICT_UNLOCK_HUB_LINE_PREFIX} ${nextTitle}`
      : undefined,
    ctaLabel: DISTRICT_UNLOCK_PROFILE_CTA,
    headline: summary.headline,
  };
}

/** Verify helper */
export function buildDistrictUnlockBindingItemForId(
  districtId: MapDistrictId,
  input: BuildDistrictOperationUnlockBindingInput = {},
): DistrictUnlockBindingItem | undefined {
  const summary = buildDistrictOperationUnlockBindingSummary(input);
  return summary.allDistrictItems.find((item) => item.districtId === districtId);
}
