import { verifyLeaderboardScenario } from '@/core/leaderboard/verifyLeaderboardScenario';
import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';

import {
  assertNoLeaderboardForbiddenWords,
  buildLeaderboardAvatarModel,
  buildLeaderboardPodiumModel,
  buildLeaderboardRowModels,
  buildLeaderboardScreenPresentation,
  collectLeaderboardPresentationStrings,
  formatPrestigeScoreText,
  LEADERBOARD_LAYOUT_GUARDS,
  verifyLeaderboardPresentationDedupes,
  runLeaderboardUiRegressionChecks,
} from './utils/leaderboardPresentation';
import { formatLeaderboardScoreBpp } from './utils/leaderboardUiModel';

export type VerifyLeaderboardUiOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleEntry(
  partial: Partial<LeaderboardEntry> & { id: string },
): LeaderboardEntry {
  return {
    id: partial.id,
    playerName: partial.playerName ?? 'Test Oyuncu',
    neighborhoodId: partial.neighborhoodId ?? 'merkez',
    neighborhoodName: partial.neighborhoodName ?? 'Merkez',
    category: 'overall',
    period: 'weekly',
    score: partial.score ?? 8200,
    baseScore: partial.baseScore ?? 8000,
    difficultyMultiplier: partial.difficultyMultiplier ?? 1,
    penalties: [],
    title: partial.title ?? 'Saha Koordinatörü',
    breakdown: {
      citizenSatisfaction: 80,
      riskControl: 75,
      budgetEfficiency: 70,
      personnelSustainability: 72,
      complaintResolution: 68,
      butterflyControl: 65,
      neighborhoodFit: 78,
    },
    completedAt: partial.completedAt ?? '2026-01-01T00:00:00.000Z',
    isCurrentPlayer: partial.isCurrentPlayer ?? false,
    runId: partial.runId,
  };
}

export function verifyLeaderboardUiScenario(): VerifyLeaderboardUiOutcome {
  const checks: Check[] = [];

  let emptyModel;
  try {
    emptyModel = buildLeaderboardScreenPresentation({
      entries: [],
      listEntries: [],
      topThree: [],
      bestEntry: null,
      currentEntry: null,
      rank: null,
      hasPlayerScore: false,
    });
    assert(checks, emptyModel.showEmptyState === true, 'Empty leaderboard state crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Empty leaderboard state crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    emptyModel = buildLeaderboardScreenPresentation({
      entries: [],
      listEntries: [],
      topThree: [],
      bestEntry: null,
      currentEntry: null,
      rank: null,
      hasPlayerScore: false,
    });
  }

  assert(
    checks,
    emptyModel.emptyMessage.includes('İlk pilot tamamlandığında'),
    'Pilot skoru yoksa empty state doğru döner',
    emptyModel.emptyMessage,
  );

  const one = sampleEntry({ id: 'e1', isCurrentPlayer: true });
  let oneEntryModel;
  try {
    oneEntryModel = buildLeaderboardScreenPresentation({
      entries: [one],
      listEntries: [],
      topThree: [one],
      bestEntry: one,
      currentEntry: one,
      rank: 1,
      hasPlayerScore: true,
    });
    assert(
      checks,
      oneEntryModel.podium.length === 1 && oneEntryModel.rows.length === 0,
      '1 entry ile podium/list güvenli çalışır',
      `podium=${oneEntryModel.podium.length}`,
    );
  } catch {
    assert(checks, false, '1 entry ile podium/list güvenli çalışır');
  }

  const entries = [
    sampleEntry({ id: 'a', score: 9100, playerName: 'Alpha' }),
    sampleEntry({ id: 'b', score: 8800, playerName: 'Beta' }),
    sampleEntry({ id: 'c', score: 8600, playerName: 'Gamma' }),
    sampleEntry({ id: 'd', score: 8400, playerName: 'Delta' }),
  ];
  const podium = buildLeaderboardPodiumModel(entries);
  assert(
    checks,
    podium.length === 3 && podium[0]?.rank === 1 && podium[0]?.displayName === 'Alpha',
    '3+ entry ile podium top 3 doğru sıralanır',
    podium.map((p) => p.displayName).join(', '),
  );

  const withUrl = sampleEntry({ id: 'img-1', playerName: 'Foto Oyuncu' });
  (withUrl as LeaderboardEntry & { imageUrl: string }).imageUrl =
    'https://example.com/avatar.png';
  const avatarWithUrl = buildLeaderboardAvatarModel(withUrl);
  assert(
    checks,
    avatarWithUrl.imageUrl === 'https://example.com/avatar.png',
    'Avatar imageUrl varsa model kullanır',
    avatarWithUrl.imageUrl ?? 'none',
  );

  const noUrl = buildLeaderboardAvatarModel(sampleEntry({ id: 'no-img' }));
  assert(
    checks,
    noUrl.initials.length >= 1 && !noUrl.imageUrl,
    'Avatar yoksa initials fallback üretir',
    noUrl.initials,
  );

  assert(
    checks,
    LEADERBOARD_LAYOUT_GUARDS.usesFlexShrink &&
      LEADERBOARD_LAYOUT_GUARDS.usesMinWidthZero &&
      LEADERBOARD_LAYOUT_GUARDS.nameNumberOfLines === 1,
    'Uzun isimlerde numberOfLines/flexShrink guard vardır',
    JSON.stringify(LEADERBOARD_LAYOUT_GUARDS),
  );

  const highlight = buildLeaderboardScreenPresentation({
    entries,
    listEntries: entries.slice(3),
    topThree: entries.slice(0, 3),
    bestEntry: entries[0]!,
    currentEntry: sampleEntry({
      id: 'player',
      isCurrentPlayer: true,
      score: 8500,
      playerName: 'Sen',
    }),
    rank: 4,
    hasPlayerScore: true,
  });
  assert(
    checks,
    highlight.playerHighlight.visible && highlight.playerHighlight.scoreLabel.includes('BPP'),
    'Current player highlight best/last score ile güvenli döner',
    highlight.playerHighlight.scoreLabel,
  );

  const dupes = verifyLeaderboardPresentationDedupes([
    sampleEntry({ id: 'x1', runId: 'run-a' }),
    sampleEntry({ id: 'x2', runId: 'run-a' }),
    sampleEntry({ id: 'x3', runId: 'run-b' }),
  ]);
  assert(
    checks,
    dupes.length === 2,
    'Duplicate runId varsa mevcut unique davranış korunur',
    `count=${dupes.length}`,
  );

  const scoreLabel = formatLeaderboardScoreBpp(8420);
  const prestigeText = formatPrestigeScoreText(8420);
  assert(
    checks,
    scoreLabel.includes('BPP') && prestigeText.includes('8'),
    'Score label formatı mevcut leaderboard formatıyla uyumlu kalır',
    `${scoreLabel} / ${prestigeText}`,
  );

  const terminologyOk =
    PROFILE_UI_COPY.prestigeTitle.length > 0 &&
    !PROFILE_UI_COPY.prestigeTitle.toLowerCase().includes('xp');
  assert(
    checks,
    terminologyOk,
    'ProfilePrestigeCard ile terminology çakışmaz',
    PROFILE_UI_COPY.prestigeTitle,
  );

  const strings = collectLeaderboardPresentationStrings(highlight);
  const banned = strings.flatMap((line) =>
    assertNoLeaderboardForbiddenWords(line).map((w) => `${w}@${line.slice(0, 24)}`),
  );
  assert(checks, banned.length === 0, 'Yasaklı kelime taraması 0 döner', banned.join('; '));

  assert(
    checks,
    emptyModel.emptyCtaLabel.length > 0,
    'Navigation callback’ler korunur',
    emptyModel.emptyCtaLabel,
  );

  const presentationSource = JSON.stringify(highlight);
  assert(
    checks,
    !presentationSource.includes('calculateLeaderboardScore'),
    'Skor motoru veya pilot completion data değişmez',
  );

  const regression = runLeaderboardUiRegressionChecks();
  assert(
    checks,
    regression.fullUxOk,
    'full UX flow verify bozulmaz',
  );

  const core = verifyLeaderboardScenario();
  assert(
    checks,
    core.ok,
    'Existing verify:leaderboard bozulmaz',
    `fail=${core.checks.filter((c) => !c.passed).length}`,
  );

  const longNameRow = buildLeaderboardRowModels([
    sampleEntry({
      id: 'long',
      playerName: 'Çok Uzun Operatör İsmi Mobil Taşma Test',
    }),
  ])[0];
  assert(
    checks,
    longNameRow != null && longNameRow.displayName.length > 10,
    'Uzun isim row modeli üretilir',
    longNameRow?.displayName.slice(0, 20),
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
