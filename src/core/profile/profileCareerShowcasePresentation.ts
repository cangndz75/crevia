import { calculateAuthorityProgress } from '@/core/authority/authorityEngine';
import { buildAuthorityRankLabel } from '@/core/authority/authorityPresentation';
import { createInitialAuthorityState, normalizeAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityState } from '@/core/authority/authorityTypes';
import { normalizeBadgeState } from '@/core/badges/badgeSeed';
import type { BadgeState } from '@/core/badges/badgeTypes';
import {
  buildDistrictMemoryRuntimeSnapshot,
  type CreviaDistrictMemorySnapshot,
} from '@/core/districtMemoryRuntime';
import {
  buildDistrictOperationsRuntimeSnapshot,
  type CreviaDistrictOperationRuntimeSnapshot,
} from '@/core/districtOperationsRuntime';
import {
  buildDistrictTrustRuntimeSnapshot,
  type CreviaDistrictTrustRuntimeSnapshot,
} from '@/core/districtTrustRuntime';
import {
  buildNextPermissionChips,
  buildRankPermissionPreviewModel,
  type RankPermissionUiItem,
} from '@/core/rankPermissions';
import { normalizeAdvisorState } from '@/core/advisors/advisorState';

export type CreviaProfileCareerTone = 'teal' | 'mint' | 'gold' | 'neutral';

export type CreviaProfileCareerSection = {
  id: string;
  title: string;
  subtitle: string;
  tone: CreviaProfileCareerTone;
  iconKey: string;
  progressValue?: number;
  chips: string[];
  lines: string[];
  priority: number;
  isHintOnly: true;
};

export type CreviaProfileRankPathSummary = {
  visible: boolean;
  currentRankLabel: string;
  nextRankLabel: string;
  authorityProgress: number;
  line: string;
};

export type CreviaProfileNextUnlockSummary = {
  visible: boolean;
  title?: string;
  line?: string;
  chips: string[];
};

export type CreviaProfilePermissionShowcase = {
  visible: boolean;
  chips: string[];
  isDetailed: boolean;
};

export type CreviaProfileMapLayerAccessSummary = {
  visible: boolean;
  line?: string;
  chips: string[];
};

export type CreviaProfileAdvisorGrowthSummary = {
  visible: boolean;
  line?: string;
  chip?: string;
};

export type CreviaProfileDistrictAchievementSummary = {
  visible: boolean;
  line?: string;
  chips: string[];
  isFallback: boolean;
};

export type CreviaProfileBestOperationSummary = {
  visible: boolean;
  line?: string;
  source?: string;
};

export type CreviaProfileCareerVisibility = {
  mode: 'hidden' | 'learning' | 'compact' | 'standard' | 'detailed';
  maxSections: number;
  showRankPath: boolean;
  showNextUnlock: boolean;
  showPermissions: boolean;
  showMapLayer: boolean;
  showAdvisor: boolean;
  showDistrictAchievement: boolean;
  showBestOperation: boolean;
};

export type CreviaProfileCareerShowcaseModel = {
  visible: boolean;
  title: string;
  subtitle: string;
  sections: CreviaProfileCareerSection[];
  visibility: CreviaProfileCareerVisibility;
  rankPathSummary: CreviaProfileRankPathSummary;
  nextUnlockSummary: CreviaProfileNextUnlockSummary;
  permissionShowcase: CreviaProfilePermissionShowcase;
  mapLayerAccessSummary: CreviaProfileMapLayerAccessSummary;
  advisorGrowthSummary: CreviaProfileAdvisorGrowthSummary;
  districtAchievementSummary: CreviaProfileDistrictAchievementSummary;
  bestOperationSummary: CreviaProfileBestOperationSummary;
  duplicateSuppression: {
    suppressAuthorityLine: boolean;
    suppressAdvisorLine: boolean;
  };
  debugRows: string[];
  isHintOnly: true;
};

export type BuildProfileCareerShowcaseInput = {
  day?: number;
  authorityState?: unknown;
  badgeState?: unknown;
  advisorState?: unknown;
  districtTrustSnapshot?: CreviaDistrictTrustRuntimeSnapshot | null;
  districtMemorySnapshot?: CreviaDistrictMemorySnapshot | null;
  districtOperationsSnapshot?: CreviaDistrictOperationRuntimeSnapshot | null;
  dailyReport?: {
    summaryLines?: string[];
    carryOverSummaryLines?: string[];
    socialSummaryLines?: string[];
    vehicleSummaryLines?: string[];
    personnelSummaryLines?: string[];
    containerSummaryLines?: string[];
  } | null;
  recentReports?: Array<BuildProfileCareerShowcaseInput['dailyReport']>;
  operationSignals?: unknown;
  resourceFatigue?: unknown;
  isPostPilot?: boolean;
  suppressAuthorityDuplicate?: boolean;
  suppressAdvisorDuplicate?: boolean;
};

const MAX_SECTIONS = 4;
const MAX_CHIPS = 4;
const COPY_MAX = 96;
const FORBIDDEN_TERMS = [
  ['oyun', ' sonu'].join(''),
  ['sezon', ' sonu'].join(''),
  ['sezon', ' finali'].join(''),
  ['14 gün', ' bitti'].join(''),
  ['14 gün', ' final'].join(''),
  ['pre', 'mium'].join(''),
  ['satın', ' al'].join(''),
  ['ki', 'litli'].join(''),
  'paywall',
  ['pa', 'nik'].join(''),
  ['çök', 'tü'].join(''),
  ['başarı', 'sız'].join(''),
] as const;

function dayOf(input: BuildProfileCareerShowcaseInput): number {
  return Math.max(1, Math.round(input.day ?? 1));
}

function readAuthority(input: BuildProfileCareerShowcaseInput): AuthorityState {
  const day = dayOf(input);
  return normalizeAuthorityState(input.authorityState ?? createInitialAuthorityState(day), day);
}

function readBadgeState(input: BuildProfileCareerShowcaseInput): BadgeState {
  return normalizeBadgeState(input.badgeState, dayOf(input));
}

function cleanCopy(text: string, max = COPY_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const safe = containsForbiddenProfileCareerCopy(normalized)
    ? 'Kariyer vitrini operasyon gelişimini sakin biçimde özetliyor.'
    : normalized;
  if (safe.length <= max) return safe;
  return `${safe.slice(0, max - 1).trimEnd()}…`;
}

function uniqueChips(chips: string[], max = MAX_CHIPS): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of chips) {
    const chip = cleanCopy(raw, 28);
    const key = chip.toLocaleLowerCase('tr-TR');
    if (!chip || seen.has(key)) continue;
    out.push(chip);
    seen.add(key);
    if (out.length >= max) break;
  }
  return out;
}

function isHighRank(authority: AuthorityState): boolean {
  return authority.authorityTrust >= 450 || authority.formalRankId !== 'field_coordinator';
}

function permissionCategoryChip(item: RankPermissionUiItem): string {
  if (item.category === 'map_layer') return 'Harita Katmanı';
  if (item.category === 'advisor') return 'Ece Analizi';
  if (item.category === 'district') return 'Mahalle Detayı';
  if (item.category === 'resource') return 'Kaynak Görünümü';
  if (item.category === 'crisis') return 'Kriz Takibi';
  if (item.category === 'operation_era') return 'Operasyon Dönemi';
  return item.title;
}

export function buildProfileCareerVisibility(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileCareerVisibility {
  const day = dayOf(input);
  const authority = readAuthority(input);
  const highRank = isHighRank(authority);
  const postPilot = input.isPostPilot === true || day >= 8;

  if (day <= 1) {
    return {
      mode: 'hidden',
      maxSections: 0,
      showRankPath: false,
      showNextUnlock: false,
      showPermissions: false,
      showMapLayer: false,
      showAdvisor: false,
      showDistrictAchievement: false,
      showBestOperation: false,
    };
  }

  if (day <= 3) {
    return {
      mode: 'compact',
      maxSections: 2,
      showRankPath: true,
      showNextUnlock: true,
      showPermissions: false,
      showMapLayer: false,
      showAdvisor: false,
      showDistrictAchievement: false,
      showBestOperation: false,
    };
  }

  if (day <= 7) {
    return {
      mode: 'standard',
      maxSections: 3,
      showRankPath: true,
      showNextUnlock: true,
      showPermissions: true,
      showMapLayer: true,
      showAdvisor: true,
      showDistrictAchievement: highRank,
      showBestOperation: true,
    };
  }

  return {
    mode: highRank ? 'detailed' : 'standard',
    maxSections: MAX_SECTIONS,
    showRankPath: true,
    showNextUnlock: true,
    showPermissions: true,
    showMapLayer: true,
    showAdvisor: true,
    showDistrictAchievement: true,
    showBestOperation: postPilot,
  };
}

export function buildProfileRankPathSummary(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileRankPathSummary {
  const authority = readAuthority(input);
  const progress = calculateAuthorityProgress(authority);
  const currentRankLabel = buildAuthorityRankLabel(authority.formalRankId);
  const nextRankLabel = progress.nextRank?.label ?? 'Uzun vadeli görev seviyesi';
  return {
    visible: true,
    currentRankLabel,
    nextRankLabel,
    authorityProgress: progress.progressToNextPercent,
    line: cleanCopy(`${currentRankLabel}: açık uçlu operasyon kariyerinde yetki izi büyüyor.`),
  };
}

export function buildProfileNextUnlockSummary(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileNextUnlockSummary {
  const authority = readAuthority(input);
  const preview = buildRankPermissionPreviewModel({
    authorityState: authority,
    currentTitle: authority.formalRankId,
    compact: true,
  });
  const item = preview.compactItems[0] ?? preview.futurePermissions[0];
  if (!item) return { visible: false, chips: [] };

  const chips = uniqueChips([permissionCategoryChip(item), preview.nextRank?.title ?? 'Yetki hedefi'], 2);
  return {
    visible: true,
    title: item.title,
    line: cleanCopy(`${item.title} profilinde sıradaki operasyon yetkisi olarak izleniyor.`),
    chips,
  };
}

export function buildProfilePermissionShowcase(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfilePermissionShowcase {
  const authority = readAuthority(input);
  const preview = buildRankPermissionPreviewModel({
    authorityState: authority,
    currentTitle: authority.formalRankId,
    compact: true,
  });
  const source = [
    ...preview.unlockedPermissions.slice(-2),
    ...preview.compactItems,
  ];
  const chips = uniqueChips(source.map(permissionCategoryChip), MAX_CHIPS);
  return {
    visible: chips.length > 0,
    chips,
    isDetailed: isHighRank(authority),
  };
}

export function buildProfileMapLayerAccessSummary(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileMapLayerAccessSummary {
  const authority = readAuthority(input);
  const chips = buildNextPermissionChips({
    authorityState: authority,
    currentTitle: authority.formalRankId,
    compact: true,
  })
    .filter((item) => item.category === 'map_layer' || item.category === 'district')
    .map((item) => item.title);

  const fallbackChips = isHighRank(authority)
    ? ['Mahalle Güveni', 'Hafıza İzleri', 'Rota Odağı']
    : ['Mahalle Güveni', 'Rota Odağı'];

  return {
    visible: true,
    line: cleanCopy(
      isHighRank(authority)
        ? 'Harita katmanları mahalle güveni, hafıza izi ve rota odağını bağlar.'
        : 'Harita görünümü sıradaki mahalle odağını daha net anlatır.',
    ),
    chips: uniqueChips(chips.length > 0 ? chips : fallbackChips, 3),
  };
}

export function buildProfileAdvisorGrowthSummary(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileAdvisorGrowthSummary {
  if (input.suppressAdvisorDuplicate) return { visible: false };
  const state = normalizeAdvisorState(input.advisorState, dayOf(input));
  const levelLabel = `Ece seviye ${state.level}`;
  const line =
    state.level >= 3
      ? 'Ece uzman notlarıyla kaynak ve mahalle sinyallerini birlikte okuyor.'
      : state.level >= 2
        ? 'Ece gelişen analizle rota, ekip ve mahalle izini bağlamaya başladı.'
        : 'Ece erken gözlemde; günlük karar ritmini takip ediyor.';
  return {
    visible: true,
    line: cleanCopy(line),
    chip: cleanCopy(levelLabel, 28),
  };
}

export function buildProfileDistrictAchievementSummary(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileDistrictAchievementSummary {
  const day = dayOf(input);
  if (day < 4) {
    return { visible: false, chips: [], isFallback: true };
  }
  const trust =
    input.districtTrustSnapshot ?? buildDistrictTrustRuntimeSnapshot({ day });
  const memory =
    input.districtMemorySnapshot ??
    buildDistrictMemoryRuntimeSnapshot({ day, trustSnapshot: trust });
  const operations =
    input.districtOperationsSnapshot ??
    buildDistrictOperationsRuntimeSnapshot({ day, trustSnapshot: trust, memorySnapshot: memory });

  const trusted = trust.districts
    .filter((district) => district.band === 'trusted' || district.band === 'improving' || district.band === 'recovering')
    .sort((a, b) => b.score - a.score)[0];
  const watch = trust.districts
    .filter((district) => district.band === 'fragile' || district.band === 'strained' || district.band === 'watch')
    .sort((a, b) => a.score - b.score)[0];
  const op = operations.districts.find((district) => district.primary);

  if (!trusted && !watch && !op) {
    return { visible: false, chips: [], isFallback: true };
  }

  const primary = trusted ?? watch ?? op;
  const line = trusted
    ? `${trusted.districtName}: güven ve toparlanma izi profil vitrinine işlendi.`
    : `${primary?.districtName ?? 'Mahalle'} takipte; operasyon izi sakin biçimde izleniyor.`;

  const memoryChip = memory.districts.find((district) => district.districtId === primary?.districtId);
  return {
    visible: true,
    line: cleanCopy(line),
    chips: uniqueChips(
      [
        primary?.districtName ?? '',
        memoryChip?.primaryKind === 'recent_improvement' ? 'Toparlanma izi' : 'Mahalle izi',
        op?.primary?.shortLabel ?? '',
      ],
      2,
    ),
    isFallback: false,
  };
}

function collectReportLines(input: BuildProfileCareerShowcaseInput): string[] {
  const reports = [input.dailyReport, ...(input.recentReports ?? [])].filter(Boolean);
  const out: string[] = [];
  for (const report of reports) {
    out.push(...(report?.summaryLines ?? []));
    out.push(...(report?.socialSummaryLines ?? []));
    out.push(...(report?.vehicleSummaryLines ?? []));
    out.push(...(report?.personnelSummaryLines ?? []));
    out.push(...(report?.containerSummaryLines ?? []));
    out.push(...(report?.carryOverSummaryLines ?? []));
  }
  return out.map((line) => line.trim()).filter(Boolean);
}

export function buildProfileBestOperationSummary(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileBestOperationSummary {
  const badgeState = readBadgeState(input);
  const recentBadge = badgeState.recentlyEarnedBadgeIds[badgeState.recentlyEarnedBadgeIds.length - 1];
  const reportLine = collectReportLines(input).find((line) =>
    /toparlan|denge|korun|iyile|azald|güven|rota/i.test(line),
  );

  if (reportLine) {
    return {
      visible: true,
      line: cleanCopy(`En iyi iz: ${reportLine}`, COPY_MAX),
      source: 'report',
    };
  }

  if (recentBadge) {
    return {
      visible: true,
      line: cleanCopy('En iyi iz: son kazanım operasyon disiplinini gösteriyor.'),
      source: 'badge',
    };
  }

  return { visible: false };
}

function section(
  input: Omit<CreviaProfileCareerSection, 'isHintOnly'>,
): CreviaProfileCareerSection {
  return {
    ...input,
    subtitle: cleanCopy(input.subtitle, 72),
    chips: uniqueChips(input.chips, MAX_CHIPS),
    lines: input.lines.map((line) => cleanCopy(line)).filter(Boolean).slice(0, 2),
    isHintOnly: true,
  };
}

export function buildProfileCareerShowcaseModel(
  input: BuildProfileCareerShowcaseInput = {},
): CreviaProfileCareerShowcaseModel {
  const visibility = buildProfileCareerVisibility(input);
  const rankPathSummary = buildProfileRankPathSummary(input);
  const nextUnlockSummary = buildProfileNextUnlockSummary(input);
  const permissionShowcase = buildProfilePermissionShowcase(input);
  const mapLayerAccessSummary = buildProfileMapLayerAccessSummary(input);
  const advisorGrowthSummary = buildProfileAdvisorGrowthSummary(input);
  const districtAchievementSummary = buildProfileDistrictAchievementSummary(input);
  const bestOperationSummary = buildProfileBestOperationSummary(input);

  const candidates: CreviaProfileCareerSection[] = [];
  if (visibility.showRankPath && rankPathSummary.visible) {
    candidates.push(section({
      id: 'rank_path',
      title: 'Kariyer Yolu',
      subtitle: rankPathSummary.currentRankLabel,
      tone: 'teal',
      iconKey: 'ribbon-outline',
      progressValue: rankPathSummary.authorityProgress,
      chips: [rankPathSummary.nextRankLabel],
      lines: input.suppressAuthorityDuplicate ? [] : [rankPathSummary.line],
      priority: 96,
    }));
  }
  if (visibility.showNextUnlock && nextUnlockSummary.visible) {
    candidates.push(section({
      id: 'next_unlock',
      title: 'Sıradaki Yetki',
      subtitle: nextUnlockSummary.title ?? 'Operasyon hedefi',
      tone: 'mint',
      iconKey: 'sparkles-outline',
      chips: nextUnlockSummary.chips,
      lines: nextUnlockSummary.line ? [nextUnlockSummary.line] : [],
      priority: 88,
    }));
  }
  if (visibility.showPermissions && permissionShowcase.visible) {
    candidates.push(section({
      id: 'permissions',
      title: 'Açılan Görünümler',
      subtitle: permissionShowcase.isDetailed ? 'Detaylı yetki vitrini' : 'Kısa yetki vitrini',
      tone: 'gold',
      iconKey: 'grid-outline',
      chips: permissionShowcase.chips,
      lines: visibility.showMapLayer && mapLayerAccessSummary.line ? [mapLayerAccessSummary.line] : [],
      priority: 78,
    }));
  }
  if (visibility.showAdvisor && advisorGrowthSummary.visible) {
    candidates.push(section({
      id: 'advisor_growth',
      title: 'Ece Gelişimi',
      subtitle: advisorGrowthSummary.chip ?? 'Danışman notu',
      tone: 'neutral',
      iconKey: 'chatbubble-ellipses-outline',
      chips: advisorGrowthSummary.chip ? [advisorGrowthSummary.chip] : [],
      lines: advisorGrowthSummary.line ? [advisorGrowthSummary.line] : [],
      priority: 68,
    }));
  }
  if (visibility.showDistrictAchievement && districtAchievementSummary.visible) {
    candidates.push(section({
      id: 'district_achievement',
      title: 'Mahalle İzleri',
      subtitle: 'Güven ve hafıza vitrini',
      tone: 'mint',
      iconKey: 'map-outline',
      chips: districtAchievementSummary.chips,
      lines: districtAchievementSummary.line ? [districtAchievementSummary.line] : [],
      priority: 64,
    }));
  }
  if (visibility.showBestOperation && bestOperationSummary.visible) {
    candidates.push(section({
      id: 'best_operation',
      title: 'En İyi Operasyon İzi',
      subtitle: 'Son güçlü etki',
      tone: 'teal',
      iconKey: 'medal-outline',
      chips: [bestOperationSummary.source ?? 'operasyon'],
      lines: bestOperationSummary.line ? [bestOperationSummary.line] : [],
      priority: 56,
    }));
  }

  const sections = candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, visibility.maxSections);

  const model: CreviaProfileCareerShowcaseModel = {
    visible: visibility.mode !== 'hidden' && sections.length > 0,
    title: 'Kariyer Vitrini',
    subtitle: 'Açık uçlu operasyon kariyerindeki görünür ilerleme.',
    sections,
    visibility,
    rankPathSummary,
    nextUnlockSummary,
    permissionShowcase,
    mapLayerAccessSummary,
    advisorGrowthSummary,
    districtAchievementSummary,
    bestOperationSummary,
    duplicateSuppression: {
      suppressAuthorityLine: input.suppressAuthorityDuplicate === true,
      suppressAdvisorLine: input.suppressAdvisorDuplicate === true,
    },
    debugRows: [],
    isHintOnly: true,
  };

  return { ...model, debugRows: buildProfileCareerDebugRows(model) };
}

export function buildProfileCareerDebugRows(
  modelOrInput: CreviaProfileCareerShowcaseModel | BuildProfileCareerShowcaseInput = {},
): string[] {
  const model =
    'sections' in modelOrInput
      ? modelOrInput
      : buildProfileCareerShowcaseModel(modelOrInput);
  return [
    `visible: ${model.visible}`,
    `mode: ${model.visibility.mode}`,
    `sections: ${model.sections.length}`,
    `nextUnlock: ${model.nextUnlockSummary.visible}`,
    `permissions: ${model.permissionShowcase.chips.length}`,
    `advisor: ${model.advisorGrowthSummary.visible}`,
    `district: ${model.districtAchievementSummary.visible}`,
    `bestOperation: ${model.bestOperationSummary.visible}`,
    ...model.sections.map((item) => `${item.id}: ${item.title}`),
  ];
}

export function containsForbiddenProfileCareerCopy(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

export function validateProfileCareerShowcaseModel(
  model: CreviaProfileCareerShowcaseModel,
): boolean {
  if (model.sections.length > MAX_SECTIONS) return false;
  if (model.sections.length > model.visibility.maxSections) return false;
  for (const item of model.sections) {
    if (item.chips.length > MAX_CHIPS) return false;
    for (const text of [item.title, item.subtitle, ...item.chips, ...item.lines]) {
      if (text.length > COPY_MAX + 1) return false;
      if (containsForbiddenProfileCareerCopy(text)) return false;
    }
  }
  return true;
}
