/**
 * Gelişim ekranı UI refactor doğrulaması.
 * Çalıştır: npm run verify:growth-screen-ui
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildGrowthScreenPresentation } from './utils/growthScreenPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(relPath: string): string {
  return readFileSync(join(REPO_ROOT, relPath), 'utf8');
}

function assert(condition: boolean, label: string): string {
  return condition ? `PASS ${label}` : `FAIL ${label}`;
}

export function verifyGrowthScreenUiScenario(): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  const screen = readRepo('src/features/progression/screens/ProgressionScreen.tsx');
  const bottomNav = readRepo('src/components/navigation/CreviaBottomTabBar.tsx');
  const layout = readRepo('src/app/_layout.tsx');

  lines.push(assert(screen.includes('GrowthScreenHeader'), 'GrowthScreenHeader wired'));
  lines.push(assert(screen.includes('buildGrowthScreenPresentation'), 'growth presentation wired'));
  lines.push(assert(screen.includes("useState<AuthorityTabKey>('authorities')"), 'default tab Yetkiler'));
  lines.push(assert(bottomNav.includes('label: "Gelişim"'), 'bottom nav Gelişim label'));
  lines.push(assert(layout.includes('title: "Gelişim"'), 'layout Gelişim title'));
  lines.push(assert(!screen.includes('Başarılar'), 'screen no Başarılar label'));

  const presentation = buildGrowthScreenPresentation({
    totalXp: 63,
    pilotDay: 1,
    gameDay: 1,
    playerName: 'Can',
    role: 'Saha Koordinatörü',
    level: 2,
    metaLine: '1. Gün · Cumhuriyet',
    resourceLabel: '62.5K',
    xp: 63,
    xpTarget: 200,
    xpProgress: 0.315,
    authorityState: null,
    badgeState: null,
    dailyGoalState: null,
  });

  lines.push(assert(presentation.header.title === 'Gelişim', 'header title Gelişim'));
  lines.push(
    assert(
      presentation.authoritiesTab.recentAuthorities.length >= 2,
      'authorities tab recent cards',
    ),
  );
  lines.push(assert(presentation.badgesTab.badgeItems.length >= 2, 'badges tab target cards'));
  lines.push(
    assert(
      presentation.expansionsTab.districtItems.length >= 1,
      'expansions tab district items',
    ),
  );
  lines.push(
    assert(
      presentation.authoritiesTab.nextTarget.rewardTitle.includes('Mahalle') ||
        presentation.authoritiesTab.nextTarget.rewardTitle.length > 0,
      'next target reward title present',
    ),
  );

  const ok = lines.every((line) => line.startsWith('PASS'));
  return { ok, lines };
}

if (require.main === module) {
  const result = verifyGrowthScreenUiScenario();
  for (const line of result.lines) console.log(line);
  if (!result.ok) process.exit(1);
}
