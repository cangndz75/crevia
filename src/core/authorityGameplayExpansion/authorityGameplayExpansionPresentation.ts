import {
  AUTHORITY_EXPANSION_ACCESSIBILITY_MAX,
  AUTHORITY_EXPANSION_LINE_MAX,
  AUTHORITY_EXPANSION_MAX_PRESENTATION_BENEFITS,
} from './authorityGameplayExpansionConstants';
import {
  buildAuthorityAdvisorCapabilityLine,
  buildAuthorityMapBenefitLine,
  buildAuthorityPortfolioBenefitLine,
  buildAuthorityProfileBenefitLine,
} from './authorityGameplayExpansionModel';
import type {
  AuthorityGameplayBenefit,
  AuthorityGameplayBenefitCardModel,
  AuthorityGameplayExpansionSummary,
  AuthorityGameplaySummaryCardModel,
} from './authorityGameplayExpansionTypes';

function clampLine(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function badgeLabel(benefit: AuthorityGameplayBenefit): string {
  if (!benefit.isUnlocked) return 'Yakında';
  if (benefit.tone === 'strategic') return 'Strateji';
  if (benefit.tone === 'positive') return 'Avantaj';
  return 'Yetki';
}

function benefitLine(benefit: AuthorityGameplayBenefit): string {
  return benefit.isUnlocked ? benefit.unlockedLine : benefit.lockedLine ?? benefit.shortLine;
}

function buildBenefitCard(benefit: AuthorityGameplayBenefit): AuthorityGameplayBenefitCardModel {
  const title = clampLine(benefit.title, 44);
  const line = clampLine(benefitLine(benefit), AUTHORITY_EXPANSION_LINE_MAX);
  return {
    id: benefit.id,
    title,
    line,
    badgeLabel: badgeLabel(benefit),
    tone: benefit.isUnlocked ? benefit.tone : 'locked',
    isUnlocked: benefit.isUnlocked,
    accessibilityLabel: clampLine(
      `${title}. ${benefit.isUnlocked ? 'Açık' : 'Kilitli'}. ${line}.`,
      AUTHORITY_EXPANSION_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildAuthorityGameplaySummaryCard(
  summary: AuthorityGameplayExpansionSummary,
): AuthorityGameplaySummaryCardModel {
  const benefits = buildAuthorityGameplayBenefitCardModels(summary);
  const title = clampLine(summary.title, 44);
  const summaryLine = clampLine(summary.summaryLine, 90);
  const primaryBenefitLine = summary.primaryBenefit
    ? clampLine(benefitLine(summary.primaryBenefit), AUTHORITY_EXPANSION_LINE_MAX)
    : undefined;
  const nextBenefitLine = summary.nextBenefit
    ? clampLine(summary.nextBenefit.lockedLine ?? summary.nextBenefit.shortLine, AUTHORITY_EXPANSION_LINE_MAX)
    : undefined;

  return {
    id: `authority_expansion_${summary.rankId ?? 'default'}`,
    title,
    summaryLine,
    primaryBenefitLine,
    nextBenefitLine,
    benefits,
    accessibilityLabel: clampLine(
      `${title}. ${summaryLine}. ${primaryBenefitLine ?? ''} ${nextBenefitLine ?? ''}`.trim(),
      AUTHORITY_EXPANSION_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildAuthorityGameplayBenefitCardModels(
  summary: AuthorityGameplayExpansionSummary,
): AuthorityGameplayBenefitCardModel[] {
  const unlocked = summary.unlockedBenefits
    .filter((b) => b.visibility !== 'hidden')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, AUTHORITY_EXPANSION_MAX_PRESENTATION_BENEFITS);

  const teasers = summary.teaserBenefits
    .filter((b) => b.visibility === 'teaser')
    .slice(0, 1);

  return [...unlocked, ...teasers].map(buildBenefitCard);
}

export {
  buildAuthorityAdvisorCapabilityLine,
  buildAuthorityMapBenefitLine,
  buildAuthorityPortfolioBenefitLine,
  buildAuthorityProfileBenefitLine,
};
