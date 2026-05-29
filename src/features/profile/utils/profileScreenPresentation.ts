import type { ProfileAuthoritySummary } from './profileAuthorityModel';
import type { ProfileBadgeShowcaseSummary } from './profileBadgeModel';
import type { ProfileViewModel } from './profileModel';
import type { LeaderboardPrestigeSummary } from '@/features/leaderboard/utils/leaderboardProfileModel';

export const PROFILE_UI_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
] as const;

export const PROFILE_UI_LAYOUT_GUARDS = {
  heroNameNumberOfLines: 1,
  heroRoleNumberOfLines: 2,
  rankLabelNumberOfLines: 2,
  authorityProgressNumberOfLines: 1,
  evaluationNumberOfLines: 2,
  badgeTitleNumberOfLines: 2,
  prestigeValueNumberOfLines: 2,
  showcaseMaxItems: 6,
  badgeGridColumns: 2,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;

export const PROFILE_UI_COPY = {
  heroKicker: 'Kariyer Özeti',
  authorityTitle: 'Yetki Durumu',
  officialDuty: 'Resmi Görev',
  authorityTrust: 'Yetki Güveni',
  remainingTrust: 'Kalan Güven',
  nextEvaluation: 'Sonraki Değerlendirme',
  upperManagementEvaluation: 'Üst Yönetim Değerlendirmesi',
  badgesTitle: 'Rozetler',
  latestEarned: 'Son Kazanım',
  queued: 'Sırada',
  prestigeTitle: 'Liderlik Etkisi',
  featuredBadges: 'Öne çıkanlar',
  menuSection: 'Yakında açılacak',
} as const;

export type ProfileScreenLayoutModel = {
  showHero: boolean;
  showCareerSummary: boolean;
  showAuthorityCard: boolean;
  showBadgeShowcase: boolean;
  showPrestigeCard: boolean;
  showOperatorBadgeRow: boolean;
  showXpProgress: boolean;
  showOperationSummary: boolean;
  prestigeCompact: boolean;
  operatorRowCompact: boolean;
  heroCareerLine: string;
};

export function buildProfileScreenLayoutModel(input: {
  model: ProfileViewModel;
  authoritySummary: ProfileAuthoritySummary;
  badgeSummary: ProfileBadgeShowcaseSummary;
  prestigeSummary: LeaderboardPrestigeSummary;
}): ProfileScreenLayoutModel {
  const { model, authoritySummary, badgeSummary, prestigeSummary } = input;

  const heroCareerLine = prestigeSummary.hasAnyScore
    ? `En iyi pilot skoru ${prestigeSummary.bestScoreText} · ${prestigeSummary.highestTitle}`
    : `${authoritySummary.rankLabel} · ${authoritySummary.authorityTrustLabel}`;

  return {
    showHero: true,
    showCareerSummary: false,
    showAuthorityCard: true,
    showBadgeShowcase: true,
    showPrestigeCard: true,
    showOperatorBadgeRow: true,
    showXpProgress: true,
    showOperationSummary: false,
    prestigeCompact: true,
    operatorRowCompact: true,
    heroCareerLine,
  };
}

export function profileUiTextContainsForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of PROFILE_UI_FORBIDDEN_WORDS) {
    if (word === 'xp') {
      if (/\bxp\b/.test(haystack)) {
        hits.push(word);
      }
      continue;
    }
    if (haystack.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

export function collectProfileUiPresentationStrings(
  layout: ProfileScreenLayoutModel,
  authority: ProfileAuthoritySummary,
  badge: ProfileBadgeShowcaseSummary,
  prestige: LeaderboardPrestigeSummary,
): string[] {
  return [
    layout.heroCareerLine,
    PROFILE_UI_COPY.heroKicker,
    PROFILE_UI_COPY.authorityTitle,
    PROFILE_UI_COPY.officialDuty,
    PROFILE_UI_COPY.authorityTrust,
    PROFILE_UI_COPY.remainingTrust,
    PROFILE_UI_COPY.nextEvaluation,
    PROFILE_UI_COPY.upperManagementEvaluation,
    PROFILE_UI_COPY.badgesTitle,
    PROFILE_UI_COPY.latestEarned,
    PROFILE_UI_COPY.queued,
    PROFILE_UI_COPY.prestigeTitle,
    PROFILE_UI_COPY.featuredBadges,
    PROFILE_UI_COPY.menuSection,
    authority.rankLabel,
    authority.progressSubtitle,
    authority.evaluationLabel,
    badge.earnedCountLabel,
    badge.latestBadge?.title ?? '',
    prestige.bestScoreText,
    prestige.highestTitle,
    prestige.lastScoreText ?? '',
  ].filter(Boolean);
}

export function profileShowcaseUsesQueuedLanguage(
  summary: ProfileBadgeShowcaseSummary,
): boolean {
  const unearned = summary.showcaseItems.filter((item) => !item.earned);
  if (unearned.length === 0) {
    return true;
  }
  return unearned.every(
    (item) => !item.progressLabel && item.title.length > 0,
  );
}
