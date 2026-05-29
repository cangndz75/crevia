import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';

import { dedupePilotScores } from './leaderboardProfileModel';
import {
  formatLeaderboardScore,
  formatLeaderboardScoreBpp,
} from './leaderboardUiModel';
import { getNameInitials } from './podiumAvatarHelpers';

export const LEADERBOARD_UI_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
] as const;

export const LEADERBOARD_UI_COPY = {
  screenTitle: 'Liderlik',
  heroSubtitle: 'Pilot performansın ve şehir operasyon prestijin',
  pilotPrestige: 'Pilot Prestiji',
  bestPilot: 'En İyi Pilot',
  cityPrestige: 'Şehir Operasyon Prestiji',
  yourRank: 'Senin Sıran',
  officialDuty: 'Resmi Görev',
  badgeLabel: 'Rozet',
  pilotRegion: 'Pilot Bölgesi',
  emptyMessage: 'İlk pilot tamamlandığında liderlik kaydın oluşacak.',
  emptyCta: 'Operasyon Merkezine Dön',
  yourBestPilot: 'Senin en iyi pilotun',
  listSection: 'Sıralama',
} as const;

export const LEADERBOARD_LAYOUT_GUARDS = {
  nameNumberOfLines: 1,
  titleNumberOfLines: 1,
  subtitleNumberOfLines: 1,
  scoreNumberOfLines: 1,
  heroSummaryNumberOfLines: 2,
  mentionMaxPodium: 3,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;

export type LeaderboardAvatarTone = 'teal' | 'mint' | 'amber' | 'green' | 'blue';

export type LeaderboardAvatarModel = {
  imageUrl?: string;
  initials: string;
  displayName: string;
  tone: LeaderboardAvatarTone;
  portraitKey: string;
};

export type LeaderboardHeroModel = {
  title: string;
  subtitle: string;
  bestScoreLabel: string;
  titleChip: string;
  hasScore: boolean;
};

export type LeaderboardPodiumTone = 'gold' | 'teal' | 'mint';

export type LeaderboardPodiumModel = {
  rank: 1 | 2 | 3;
  displayName: string;
  scoreLabel: string;
  titleLabel: string;
  subtitle: string;
  avatar: LeaderboardAvatarModel;
  badgeCountLabel?: string;
  tone: LeaderboardPodiumTone;
};

export type LeaderboardRowModel = {
  rankLabel: string;
  displayName: string;
  scoreLabel: string;
  subtitle: string;
  avatar: LeaderboardAvatarModel;
  isCurrentPlayer: boolean;
};

export type LeaderboardPlayerHighlightModel = {
  title: string;
  scoreLabel: string;
  titleLabel: string;
  regionLabel: string;
  rankLabel: string;
  avatar: LeaderboardAvatarModel;
  visible: boolean;
};

export type LeaderboardScreenPresentation = {
  hero: LeaderboardHeroModel;
  podium: LeaderboardPodiumModel[];
  rows: LeaderboardRowModel[];
  playerHighlight: LeaderboardPlayerHighlightModel;
  showEmptyState: boolean;
  emptyMessage: string;
  emptyCtaLabel: string;
};

type EntryWithAvatarFields = LeaderboardEntry & {
  avatarUrl?: string | null;
  imageUrl?: string | null;
  photoUrl?: string | null;
};

const AVATAR_TONES: LeaderboardAvatarTone[] = [
  'teal',
  'mint',
  'amber',
  'green',
  'blue',
];

const PODIUM_TONES: Record<1 | 2 | 3, LeaderboardPodiumTone> = {
  1: 'gold',
  2: 'teal',
  3: 'mint',
};

function resolveAvatarTone(seed: string): LeaderboardAvatarTone {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % 997;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

function resolveImageUrl(entry: LeaderboardEntry): string | undefined {
  const extended = entry as EntryWithAvatarFields;
  const candidate =
    extended.imageUrl ?? extended.avatarUrl ?? extended.photoUrl ?? undefined;
  const trimmed = candidate?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function resolveDisplayName(name: string | undefined): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Operatör';
}

function resolveRegionLabel(neighborhoodName: string | undefined): string {
  const trimmed = neighborhoodName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : LEADERBOARD_UI_COPY.pilotRegion;
}

export function buildLeaderboardAvatarModel(
  entry: LeaderboardEntry,
): LeaderboardAvatarModel {
  const displayName = resolveDisplayName(entry.playerName);
  return {
    imageUrl: resolveImageUrl(entry),
    initials: getNameInitials(displayName),
    displayName,
    tone: resolveAvatarTone(entry.id),
    portraitKey: entry.id,
  };
}

export function buildLeaderboardHeroModel(input: {
  bestEntry: LeaderboardEntry | null;
  lastEntry?: LeaderboardEntry | null;
  hasPlayerScore: boolean;
}): LeaderboardHeroModel {
  const source = input.bestEntry ?? input.lastEntry ?? null;

  return {
    title: LEADERBOARD_UI_COPY.screenTitle,
    subtitle: LEADERBOARD_UI_COPY.heroSubtitle,
    bestScoreLabel: source
      ? formatLeaderboardScoreBpp(source.score)
      : '—',
    titleChip: source?.title?.trim() || LEADERBOARD_UI_COPY.officialDuty,
    hasScore: input.hasPlayerScore && source != null,
  };
}

export function buildLeaderboardPodiumModel(
  entries: LeaderboardEntry[],
): LeaderboardPodiumModel[] {
  const top = entries.slice(0, 3);
  return top.map((entry, index) => {
    const rank = (index + 1) as 1 | 2 | 3;
    return {
      rank,
      displayName: resolveDisplayName(entry.playerName),
      scoreLabel: formatLeaderboardScoreBpp(entry.score),
      titleLabel: entry.title?.trim() || LEADERBOARD_UI_COPY.officialDuty,
      subtitle: resolveRegionLabel(entry.neighborhoodName),
      avatar: buildLeaderboardAvatarModel(entry),
      badgeCountLabel: entry.isCurrentPlayer
        ? LEADERBOARD_UI_COPY.bestPilot
        : undefined,
      tone: PODIUM_TONES[rank],
    };
  });
}

export function buildLeaderboardRowModels(
  entries: LeaderboardEntry[],
): LeaderboardRowModel[] {
  return entries.map((entry, index) => ({
    rankLabel: String(index + 1),
    displayName: resolveDisplayName(entry.playerName),
    scoreLabel: formatLeaderboardScoreBpp(entry.score),
    subtitle: `${entry.title?.trim() || LEADERBOARD_UI_COPY.officialDuty} · ${resolveRegionLabel(entry.neighborhoodName)}`,
    avatar: buildLeaderboardAvatarModel(entry),
    isCurrentPlayer: entry.isCurrentPlayer === true,
  }));
}

export function buildCurrentPlayerHighlightModel(input: {
  bestEntry: LeaderboardEntry | null;
  currentEntry: LeaderboardEntry | null;
  rank: number | null;
  hasPlayerScore: boolean;
}): LeaderboardPlayerHighlightModel {
  const source = input.bestEntry ?? input.currentEntry;
  const visible = input.hasPlayerScore && source != null;

  if (!visible || !source) {
    return {
      title: LEADERBOARD_UI_COPY.yourBestPilot,
      scoreLabel: '—',
      titleLabel: LEADERBOARD_UI_COPY.officialDuty,
      regionLabel: LEADERBOARD_UI_COPY.pilotRegion,
      rankLabel: '—',
      avatar: {
        initials: 'OP',
        displayName: 'Operatör',
        tone: 'teal',
        portraitKey: 'player-highlight',
      },
      visible: false,
    };
  }

  return {
    title: LEADERBOARD_UI_COPY.yourBestPilot,
    scoreLabel: formatLeaderboardScoreBpp(source.score),
    titleLabel: source.title?.trim() || LEADERBOARD_UI_COPY.officialDuty,
    regionLabel: resolveRegionLabel(source.neighborhoodName),
    rankLabel:
      input.rank != null && input.rank > 0
        ? `#${input.rank}`
        : LEADERBOARD_UI_COPY.yourRank,
    avatar: buildLeaderboardAvatarModel(source),
    visible: true,
  };
}

export function buildLeaderboardScreenPresentation(input: {
  entries: LeaderboardEntry[];
  listEntries: LeaderboardEntry[];
  topThree: LeaderboardEntry[];
  bestEntry: LeaderboardEntry | null;
  currentEntry: LeaderboardEntry | null;
  rank: number | null;
  hasPlayerScore: boolean;
}): LeaderboardScreenPresentation {
  const hero = buildLeaderboardHeroModel({
    bestEntry: input.bestEntry,
    lastEntry: input.currentEntry,
    hasPlayerScore: input.hasPlayerScore,
  });

  return {
    hero,
    podium: buildLeaderboardPodiumModel(input.topThree),
    rows: buildLeaderboardRowModels(input.listEntries),
    playerHighlight: buildCurrentPlayerHighlightModel({
      bestEntry: input.bestEntry,
      currentEntry: input.currentEntry,
      rank: input.rank,
      hasPlayerScore: input.hasPlayerScore,
    }),
    showEmptyState: !input.hasPlayerScore,
    emptyMessage: LEADERBOARD_UI_COPY.emptyMessage,
    emptyCtaLabel: LEADERBOARD_UI_COPY.emptyCta,
  };
}

export function assertNoLeaderboardForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of LEADERBOARD_UI_FORBIDDEN_WORDS) {
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

export function collectLeaderboardPresentationStrings(
  model: LeaderboardScreenPresentation,
): string[] {
  return [
    model.hero.title,
    model.hero.subtitle,
    model.hero.bestScoreLabel,
    model.hero.titleChip,
    ...model.podium.flatMap((p) => [
      p.displayName,
      p.scoreLabel,
      p.titleLabel,
      p.subtitle,
      p.badgeCountLabel ?? '',
    ]),
    ...model.rows.flatMap((r) => [r.displayName, r.scoreLabel, r.subtitle]),
    model.playerHighlight.title,
    model.playerHighlight.scoreLabel,
    model.playerHighlight.titleLabel,
    model.playerHighlight.regionLabel,
    model.playerHighlight.rankLabel,
    model.emptyMessage,
    model.emptyCtaLabel,
  ].filter(Boolean);
}

/** Profile ekranı ile uyumlu skor metni (BPP suffix olmadan). */
export function formatPrestigeScoreText(score: number): string {
  return formatLeaderboardScore(score);
}

export function verifyLeaderboardPresentationDedupes(
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  return dedupePilotScores(entries);
}

export function runLeaderboardUiRegressionChecks(): {
  fullUxOk: boolean;
} {
  const fullUx = verifyFullUxFlowScenario();
  return { fullUxOk: fullUx.ok };
}
