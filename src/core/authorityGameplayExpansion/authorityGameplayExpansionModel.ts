import {
  AUTHORITY_EXPANSION_MAX_LOCKED_TEASERS,
  AUTHORITY_EXPANSION_PRIORITY_MAX,
  PERMISSION_BENEFIT_CATALOG,
  POST_PILOT_STRATEGIC_DAY,
  RANK_LABEL_BY_KEY,
} from './authorityGameplayExpansionConstants';
import type {
  AuthorityGameplayBenefit,
  AuthorityGameplayBenefitVisibility,
  AuthorityGameplayExpansionInput,
  AuthorityGameplayExpansionSummary,
  BenefitCatalogTemplate,
} from './authorityGameplayExpansionTypes';
import type { RankPermissionId } from '@/core/rankPermissions/rankPermissionTypes';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';
import { RANK_PERMISSION_RANKS } from '@/core/rankPermissions/rankPermissionMatrix';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

const KNOWN_PERMISSION_IDS = new Set<string>([
  ...REQUIRED_RANK_PERMISSION_IDS,
  ...Object.keys(PERMISSION_BENEFIT_CATALOG),
]);

function isRankPermissionId(value: string): value is RankPermissionId {
  return KNOWN_PERMISSION_IDS.has(value);
}

function resolveRankLabel(rankId?: string): string {
  if (!rankId) return 'Görev seviyesi';
  return RANK_LABEL_BY_KEY[rankId] ?? rankId;
}

function resolveVisibility(
  isUnlocked: boolean,
  day: number,
  template: BenefitCatalogTemplate,
): AuthorityGameplayBenefitVisibility {
  if (!isUnlocked) return day <= 1 ? 'hidden' : 'teaser';
  if (day <= 1) return 'summary';
  return 'summary';
}

function resolveDetailedVisibility(
  isUnlocked: boolean,
  day: number,
): AuthorityGameplayBenefitVisibility {
  if (!isUnlocked) return day <= 1 ? 'hidden' : 'teaser';
  if (day <= 1) return 'summary';
  return 'detailed';
}

function availabilityAllows(
  template: BenefitCatalogTemplate,
  input: AuthorityGameplayExpansionInput,
): boolean {
  if (template.requiresPortfolio && input.portfolioAvailable === false) return false;
  if (template.requiresMap && input.mapBindingAvailable === false) return false;
  if (template.requiresDistrict && input.districtPersonalityAvailable === false) return false;
  return true;
}

function buildBenefitFromTemplate(
  template: BenefitCatalogTemplate,
  permissionId: RankPermissionId,
  isUnlocked: boolean,
  input: AuthorityGameplayExpansionInput,
): AuthorityGameplayBenefit | null {
  if (!availabilityAllows(template, input)) {
    if (!isUnlocked) return null;
    return {
      id: `authority_benefit_${permissionId}_${template.kind}`,
      kind: template.kind,
      domain: template.domain,
      requiredPermissionId: permissionId,
      requiredRankId: input.rankId,
      title: template.title,
      shortLine: template.shortLine,
      unlockedLine: template.unlockedLine,
      lockedLine: template.lockedLine,
      visibility: 'hidden',
      isUnlocked: false,
      isActionable: false,
      sourceIds: uniqueStrings([permissionId, `benefit_${template.kind}`]),
      sourceKinds: ['authority_permission'],
      priority: clamp(template.priority, 0, AUTHORITY_EXPANSION_PRIORITY_MAX),
      tone: 'locked',
    };
  }

  const visibility = isUnlocked
    ? resolveDetailedVisibility(true, input.day ?? 1)
    : resolveVisibility(false, input.day ?? 1, template);

  if (visibility === 'hidden') return null;

  return {
    id: `authority_benefit_${permissionId}_${template.kind}`,
    kind: template.kind,
    domain: template.domain,
    requiredPermissionId: permissionId,
    requiredRankId: input.rankId,
    title: template.title,
    shortLine: template.shortLine,
    unlockedLine: template.unlockedLine,
    lockedLine: template.lockedLine,
    visibility,
    isUnlocked,
    isActionable: isUnlocked && template.kind !== 'locked_teaser',
    sourceIds: uniqueStrings([permissionId, `benefit_${template.kind}`, ...(input.sourceIds ?? [])]),
    sourceKinds: ['authority_permission'],
    priority: clamp(template.priority, 0, AUTHORITY_EXPANSION_PRIORITY_MAX),
    tone: isUnlocked ? template.tone : 'locked',
  };
}

function collectBenefitsForPermissions(
  permissionIds: string[],
  unlocked: boolean,
  input: AuthorityGameplayExpansionInput,
): AuthorityGameplayBenefit[] {
  const benefits: AuthorityGameplayBenefit[] = [];

  for (const rawId of permissionIds) {
    if (!isRankPermissionId(rawId)) continue;
    const permissionId = rawId as RankPermissionId;
    const templates = PERMISSION_BENEFIT_CATALOG[permissionId];
    if (!templates) continue;

    for (const template of templates) {
      const benefit = buildBenefitFromTemplate(template, permissionId, unlocked, input);
      if (benefit) benefits.push(benefit);
    }
  }

  return benefits;
}

function suppressDomainSpam(benefits: AuthorityGameplayBenefit[]): AuthorityGameplayBenefit[] {
  const domainCount = new Map<string, number>();
  const result: AuthorityGameplayBenefit[] = [];

  const sorted = [...benefits].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  for (const benefit of sorted) {
    const count = (domainCount.get(benefit.domain) ?? 0) + 1;
    if (count > 2) continue;
    domainCount.set(benefit.domain, count);
    result.push(benefit);
  }

  return result;
}

function buildSummaryLine(
  input: AuthorityGameplayExpansionInput,
  unlocked: AuthorityGameplayBenefit[],
  nextBenefit?: AuthorityGameplayBenefit,
): string {
  const day = input.day ?? 1;

  if (day <= 1) {
    return 'İlk gün temel yetkiyle tek operasyona odaklanırsın.';
  }

  const strategic = unlocked.filter((b) => b.tone === 'strategic');
  const mapBenefit = unlocked.find((b) => b.domain === 'map');
  const portfolioBenefit = unlocked.find((b) => b.domain === 'portfolio');
  const advisorBenefit = unlocked.find((b) => b.domain === 'advisor');

  if (day >= POST_PILOT_STRATEGIC_DAY && strategic.length > 0) {
    if (mapBenefit && portfolioBenefit) {
      return 'Yeni yetkin harita ve portföy sinyallerini daha net okumanı sağlıyor.';
    }
    if (advisorBenefit) {
      return 'Artık Ece bazı tradeoff’ları daha açık yorumlayabilir.';
    }
    return 'Bu görev seviyesi stratejik sinyalleri açıklamaya başladı.';
  }

  if (unlocked.some((b) => b.domain === 'resource')) {
    return 'Bu görev seviyesi kaynak baskısını açıklamaya başladı.';
  }

  if (nextBenefit?.lockedLine) {
    return `Bir sonraki yetki, ${nextBenefit.title.toLowerCase()} avantajını getirecek.`;
  }

  if (unlocked.length > 0) {
    return unlocked[0]!.unlockedLine;
  }

  return 'Yetki ilerledikçe şehri daha derin okuyabileceksin.';
}

function pickPrimaryBenefit(
  benefits: AuthorityGameplayBenefit[],
  day: number,
): AuthorityGameplayBenefit | undefined {
  const candidates = [...benefits].filter((b) => b.isUnlocked && b.visibility !== 'hidden');
  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    if (day >= POST_PILOT_STRATEGIC_DAY) {
      const aStrategic = a.tone === 'strategic' ? 1 : 0;
      const bStrategic = b.tone === 'strategic' ? 1 : 0;
      if (aStrategic !== bStrategic) return bStrategic - aStrategic;
    }
    return b.priority - a.priority || a.id.localeCompare(b.id);
  });

  return candidates[0];
}

function pickNextBenefit(
  teaserBenefits: AuthorityGameplayBenefit[],
): AuthorityGameplayBenefit | undefined {
  const teasers = teaserBenefits
    .filter((b) => !b.isUnlocked && b.visibility === 'teaser')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  return teasers[0];
}

function buildDomainLines(summary: AuthorityGameplayExpansionSummary): void {
  const map = summary.unlockedBenefits.find((b) => b.domain === 'map' && b.isUnlocked);
  const portfolio = summary.unlockedBenefits.find(
    (b) => b.domain === 'portfolio' && b.isUnlocked,
  );
  const advisor = summary.unlockedBenefits.find((b) => b.domain === 'advisor' && b.isUnlocked);
  const profile = summary.unlockedBenefits.find(
    (b) => b.domain === 'profile' || b.domain === 'achievement',
  );

  if (map) summary.mapAuthorityLine = map.unlockedLine;
  if (portfolio) summary.portfolioAuthorityLine = portfolio.unlockedLine;
  if (advisor) summary.eceAuthorityLine = advisor.unlockedLine;
  if (profile) summary.profileAuthorityLine = profile.unlockedLine;
}

export function buildAuthorityGameplayExpansionSummary(
  input: AuthorityGameplayExpansionInput,
): AuthorityGameplayExpansionSummary {
  const day = input.day ?? 1;
  const permissionIds = uniqueStrings(input.permissionIds ?? []);
  const nextPermissionIds = uniqueStrings(input.nextRankPermissionIds ?? []);
  const unlockedSet = new Set(permissionIds);

  const nextOnlyIds = nextPermissionIds.filter((id) => !unlockedSet.has(id));

  let unlockedBenefits = collectBenefitsForPermissions(permissionIds, true, input);
  let teaserBenefits = collectBenefitsForPermissions(nextOnlyIds, false, input);

  if (unlockedBenefits.length === 0 && day <= 1) {
    unlockedBenefits = collectBenefitsForPermissions(['inspect_basic_events'], true, {
      ...input,
      portfolioAvailable: false,
      mapBindingAvailable: false,
      districtPersonalityAvailable: false,
    });
  }

  if (teaserBenefits.length === 0 && nextOnlyIds.length === 0 && day > 1) {
    const nextRank = RANK_PERMISSION_RANKS.find((rank) => rank.rankKey === input.rankId);
    const fallbackNext = nextRank?.permissionIds.find((id) => !unlockedSet.has(id));
    if (fallbackNext) {
      teaserBenefits = collectBenefitsForPermissions([fallbackNext], false, input);
    }
  }

  unlockedBenefits = suppressDomainSpam(unlockedBenefits);
  teaserBenefits = suppressDomainSpam(teaserBenefits).slice(0, AUTHORITY_EXPANSION_MAX_LOCKED_TEASERS);

  const primaryBenefit = pickPrimaryBenefit(unlockedBenefits, day);
  const nextBenefit = pickNextBenefit(teaserBenefits);

  const summary: AuthorityGameplayExpansionSummary = {
    rankId: input.rankId,
    rankLabel: resolveRankLabel(input.rankId),
    title: day <= 1 ? 'Temel yetki' : `${resolveRankLabel(input.rankId)} avantajları`,
    summaryLine: buildSummaryLine(input, unlockedBenefits, nextBenefit),
    unlockedBenefits,
    teaserBenefits,
    primaryBenefit,
    nextBenefit,
    sourceIds: uniqueStrings([
      ...(input.sourceIds ?? []),
      ...unlockedBenefits.flatMap((b) => b.sourceIds),
      ...teaserBenefits.flatMap((b) => b.sourceIds),
    ]),
  };

  buildDomainLines(summary);
  return summary;
}

export function buildAuthorityAdvisorCapabilityLine(
  summary: AuthorityGameplayExpansionSummary,
): string | undefined {
  if (summary.eceAuthorityLine) return summary.eceAuthorityLine;
  const advisor = summary.unlockedBenefits.find((b) => b.domain === 'advisor' && b.isUnlocked);
  return advisor?.unlockedLine;
}

export function buildAuthorityMapBenefitLine(
  summary: AuthorityGameplayExpansionSummary,
): string | undefined {
  if (summary.mapAuthorityLine) return summary.mapAuthorityLine;
  const map = summary.unlockedBenefits.find((b) => b.domain === 'map' && b.isUnlocked);
  return map?.unlockedLine;
}

export function buildAuthorityPortfolioBenefitLine(
  summary: AuthorityGameplayExpansionSummary,
): string | undefined {
  if (summary.portfolioAuthorityLine) return summary.portfolioAuthorityLine;
  const portfolio = summary.unlockedBenefits.find((b) => b.domain === 'portfolio' && b.isUnlocked);
  return portfolio?.unlockedLine;
}

export function buildAuthorityProfileBenefitLine(
  summary: AuthorityGameplayExpansionSummary,
): string | undefined {
  if (summary.profileAuthorityLine) return summary.profileAuthorityLine;
  const profile = summary.unlockedBenefits.find(
    (b) => (b.domain === 'profile' || b.domain === 'achievement') && b.isUnlocked,
  );
  return profile?.unlockedLine;
}
