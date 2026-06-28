import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { buildLeaderboardPrestigeSummary } from '@/features/leaderboard/utils/leaderboardProfileModel';
import {
  buildProfileAuthoritySummary,
  buildProfileAuthoritySummaryFromPilot,
} from '@/features/profile/utils/profileAuthorityModel';
import {
  buildProfileBadgeShowcaseItemForId,
  buildProfileBadgeShowcaseSummary,
} from '@/features/profile/utils/profileBadgeModel';
import { buildProfileViewModel } from '@/features/profile/utils/profileModel';
import { buildProfileReferenceViewModel } from '@/features/profile/utils/profileReferencePresentation';
import {
  buildProfileScreenLayoutModel,
  collectProfileUiPresentationStrings,
  PROFILE_UI_COPY,
  PROFILE_UI_LAYOUT_GUARDS,
  profileUiTextContainsForbiddenWords,
} from '@/features/profile/utils/profileScreenPresentation';
import { verifyProfileAuthorityScenario } from '@/features/profile/utils/verifyProfileAuthorityScenario';
import { verifyProfileBadgeScenario } from '@/features/profile/utils/verifyProfileBadgeScenario';
import type { GameStatusSnapshot } from '@/store/gameSelectors';
import type { GameState } from '@/core/models/GameState';

export type VerifyProfileUiOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(relPath: string): string {
  return readFileSync(join(REPO_ROOT, relPath), 'utf8');
}

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleProfileStatus(gameState: GameState): GameStatusSnapshot {
  return {
    playerName: gameState.player.name ?? 'Can',
    role: gameState.player.role ?? 'Koordinatör',
    currentDay: gameState.city.day,
    dayLabel: `Gün ${gameState.city.day}`,
    selectedDistrictId: gameState.pilot.selectedDistrictId,
    selectedDistrictName: 'Merkez Pilot Bölge',
    xp: 0,
    xpTarget: 120,
    xpToNextLevel: 120,
    xpProgress: 0,
    level: 1,
    levelProgress: 0,
    totalXp: 0,
    budget: gameState.city.budget,
    budgetFormatted: '75K Kaynak',
    budgetDelta: null,
    budgetDeltaLabel: null,
    source: 0,
    sourceLabel: 'Pilot',
    sourceShort: 'Pilot',
    notificationCount: 0,
    publicSatisfaction: 55,
    districtPulse: 55,
    staffMorale: 65,
    operationRisk: 35,
    activeEventsCount: gameState.events.length,
    criticalEventsCount: 0,
    solvedEventsCount: gameState.solvedEvents.length,
  };
}

export function verifyProfileUiScenario(): VerifyProfileUiOutcome {
  const checks: Check[] = [];
  const seed = createDay1Seed();

  let layout;
  try {
    const model = buildProfileViewModel(
      sampleProfileStatus(seed.gameState),
      seed.gameState.player,
    );
    const authority = buildProfileAuthoritySummaryFromPilot(
      seed.gameState.pilot.authorityState,
      seed.gameState.pilot.currentPilotDay,
    );
    const badge = buildProfileBadgeShowcaseSummary(
      seed.gameState.pilot.badgeState,
      seed.gameState.pilot.currentPilotDay,
    );
    const prestige = buildLeaderboardPrestigeSummary([], undefined);
    layout = buildProfileScreenLayoutModel({
      model,
      authoritySummary: authority,
      badgeSummary: badge,
      prestigeSummary: prestige,
    });
    assert(checks, layout.showHero === true, 'Fresh state ProfileScreen render path crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Fresh state ProfileScreen render path crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    layout = buildProfileScreenLayoutModel({
      model: buildProfileViewModel(
        sampleProfileStatus(seed.gameState),
        seed.gameState.player,
      ),
      authoritySummary: buildProfileAuthoritySummary(createInitialAuthorityState(1)),
      badgeSummary: buildProfileBadgeShowcaseSummary(createInitialBadgeState(1)),
      prestigeSummary: buildLeaderboardPrestigeSummary([], undefined),
    });
  }

  let authoritySummary;
  try {
    authoritySummary = buildProfileAuthoritySummary(undefined, 1);
    assert(
      checks,
      authoritySummary.rankLabel.length > 0,
      'authorityState undefined iken ProfileAuthorityCard fallback güvenli',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'authorityState undefined iken ProfileAuthorityCard fallback güvenli',
      error instanceof Error ? error.message : 'unknown',
    );
    authoritySummary = buildProfileAuthoritySummary(createInitialAuthorityState(1));
  }

  let badgeSummary;
  try {
    badgeSummary = buildProfileBadgeShowcaseSummary(undefined, 1);
    assert(
      checks,
      badgeSummary.totalCount === 12,
      'badgeState undefined iken ProfileBadgeShowcaseCard fallback güvenli',
      `total=${badgeSummary.totalCount}`,
    );
  } catch (error) {
    assert(
      checks,
      false,
      'badgeState undefined iken ProfileBadgeShowcaseCard fallback güvenli',
      error instanceof Error ? error.message : 'unknown',
    );
    badgeSummary = buildProfileBadgeShowcaseSummary(createInitialBadgeState(1));
  }

  const duplicateBadgeState = {
    ...createInitialBadgeState(2),
    earnedBadgeIds: ['first_step', 'first_step'],
  };
  const duplicateSummary = buildProfileBadgeShowcaseSummary(duplicateBadgeState, 2);
  assert(
    checks,
    duplicateSummary.earnedCount === 1,
    'earnedBadgeIds duplicate olsa unique count korunur',
    `count=${duplicateSummary.earnedCount}`,
  );

  const manyWithReal = {
    ...createInitialBadgeState(7),
    earnedBadgeIds: [
      'first_step',
      'public_listener',
      'crisis_cooler',
      'pilot_finisher',
      'steady_hand',
      'resource_guardian',
      'team_builder',
    ],
  };
  const showcaseMany = buildProfileBadgeShowcaseSummary(manyWithReal, 7);
  assert(
    checks,
    showcaseMany.showcaseItems.length <= PROFILE_UI_LAYOUT_GUARDS.showcaseMaxItems,
    'showcase max 6 item döner',
    `len=${showcaseMany.showcaseItems.length}`,
  );

  let prestigeEmpty;
  try {
    prestigeEmpty = buildLeaderboardPrestigeSummary([], undefined);
    assert(
      checks,
      prestigeEmpty.bestScoreText === '—',
      'ProfilePrestigeCard empty state crash olmaz',
      prestigeEmpty.highestTitle,
    );
  } catch (error) {
    assert(
      checks,
      false,
      'ProfilePrestigeCard empty state crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    prestigeEmpty = buildLeaderboardPrestigeSummary([], undefined);
  }

  assert(
    checks,
    PROFILE_UI_COPY.queued === 'Sırada' &&
      !collectProfileUiPresentationStrings(
        layout,
        authoritySummary,
        duplicateSummary,
        prestigeEmpty,
      ).some((line) => line.toLowerCase().includes('kilitli')),
    'locked/kilitli kelimesi kullanıcı metinlerinde geçmez; “Sırada” kullanılır',
    PROFILE_UI_COPY.queued,
  );

  assert(
    checks,
    PROFILE_UI_LAYOUT_GUARDS.rankLabelNumberOfLines >= 2 &&
      PROFILE_UI_LAYOUT_GUARDS.badgeTitleNumberOfLines >= 1,
    'Long rank label / long badge title taşma guard’ları vardır',
    JSON.stringify(PROFILE_UI_LAYOUT_GUARDS),
  );

  assert(
    checks,
    PROFILE_UI_LAYOUT_GUARDS.authorityProgressNumberOfLines >= 1 &&
      PROFILE_UI_LAYOUT_GUARDS.evaluationNumberOfLines >= 2 &&
      PROFILE_UI_LAYOUT_GUARDS.usesMinWidthZero,
    'ProfileAuthorityCard progress label taşma guard’ları vardır',
  );

  assert(
    checks,
    layout.operatorRowCompact === true && layout.showOperatorBadgeRow === true,
    'OperatorBadgeRow duplicate hissi yaratmayacak compact/düşük profil modelde kalır',
  );

  const strings = collectProfileUiPresentationStrings(
    layout,
    authoritySummary,
    badgeSummary,
    prestigeEmpty,
  );
  const forbidden = strings.flatMap((s) => profileUiTextContainsForbiddenWords(s));
  assert(
    checks,
    forbidden.length === 0,
    'Yasaklı kelime taraması 0 döner',
    forbidden.join(', ') || '0',
  );

  assert(
    checks,
    layout.showPrestigeCard && layout.showAuthorityCard,
    'ProfileScreen mevcut navigation/menu callback’leri korunur',
    'prestige+authority visible',
  );

  const authorityVerify = verifyProfileAuthorityScenario();
  assert(
    checks,
    authorityVerify.ok,
    'mevcut profile-authority verify’ları bozulmaz',
    `fail=${authorityVerify.checks.filter((c) => c.startsWith('✗')).length}`,
  );

  const badgeVerify = verifyProfileBadgeScenario();
  assert(
    checks,
    badgeVerify.ok,
    'mevcut profile-badges verify’ları bozulmaz',
    `fail=${badgeVerify.checks.filter((c) => c.startsWith('✗')).length}`,
  );

  const unknownItem = buildProfileBadgeShowcaseItemForId('unknown_badge_xyz', undefined);
  assert(
    checks,
    unknownItem.earned === false && unknownItem.title.length > 0,
    'unknown badge id crash üretmez',
    unknownItem.title,
  );

  const profileScreenSource = readRepo('src/features/profile/screens/ProfileScreen.tsx');
  const identitySource = readRepo('src/features/profile/components/ProfileIdentitySection.tsx');
  const summarySource = readRepo('src/features/profile/components/ProfileSummaryCard.tsx');
  const advantagesSource = readRepo('src/features/profile/components/ProfileRoleAdvantagesSection.tsx');
  const roadmapSource = readRepo('src/features/profile/components/ProfileRoadmapSection.tsx');
  const bottomNavSource = readRepo('src/components/navigation/CreviaBottomTabBar.tsx');

  assert(
    checks,
    profileScreenSource.includes('ProfileBrandHeader') &&
      profileScreenSource.includes('ProfileIdentitySection') &&
      profileScreenSource.includes('ProfileRoadmapSection'),
    'Profile reference composition wired',
  );
  assert(
    checks,
    identitySource.includes('react-native-svg') && identitySource.includes('ARC_LENGTH'),
    'Profile XP arc uses SVG and dynamic progress',
  );
  assert(
    checks,
    summarySource.includes('advantageTitle') &&
      advantagesSource.includes('item.description') &&
      roadmapSource.includes('summary.progress'),
    'Profile lower cards bind dynamic presentation fields',
  );
  assert(
    checks,
    bottomNavSource.includes('activeRouteName === "profile" ? "progression" : activeRouteName'),
    'Profile route visually focuses Gelisim bottom nav',
  );

  const liveStatus = {
    ...sampleProfileStatus(seed.gameState),
    xp: 63,
    xpTarget: 200,
    xpProgress: 0.315,
    level: 2,
    solvedEventsCount: 1,
  };
  const liveModel = buildProfileViewModel(liveStatus, seed.gameState.player);
  const liveAuthority = buildProfileAuthoritySummaryFromPilot(
    seed.gameState.pilot.authorityState,
    seed.gameState.pilot.currentPilotDay,
  );
  const reference = buildProfileReferenceViewModel({
    model: liveModel,
    authoritySummary: liveAuthority,
    authorityState: seed.gameState.pilot.authorityState,
    pilotDay: seed.gameState.pilot.currentPilotDay,
  });

  assert(
    checks,
    reference.identity.xpLabel.includes('63') &&
      reference.identity.xpLabel.includes('200') &&
      reference.identity.levelLabel.includes('2'),
    'Profile identity XP/level labels are dynamic',
    `${reference.identity.xpLabel} ${reference.identity.levelLabel}`,
  );
  assert(
    checks,
    reference.identity.badges.length === 2 &&
      reference.identity.badges.every((badge) => badge.label.length > 0),
    'Profile identity badges are generated from state',
    reference.identity.badges.map((badge) => badge.label).join(', '),
  );
  assert(
    checks,
    reference.roleAdvantages.length >= 3 &&
      reference.roleAdvantages.every((item) => item.description.length > 0),
    'Profile role advantages are dynamic and descriptive',
    reference.roleAdvantages.map((item) => item.title).join(', '),
  );
  assert(
    checks,
    reference.roadmap.length >= 3 &&
      reference.roadmapSummary.valueLabel.includes('/') &&
      reference.roadmapSummary.progress >= 0 &&
      reference.roadmapSummary.progress <= 1,
    'Profile roadmap and trust progress are bound',
    reference.roadmapSummary.valueLabel,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
