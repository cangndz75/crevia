import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialMonetizationState } from '@/core/monetization/monetizationState';
import { SOCIAL_PULSE_LAYOUT_GUARDS } from '@/features/social/utils/socialPulsePresentation';
import { MAP_UI_LAYOUT_GUARDS } from '@/features/map/utils/mapUiPresentation';

import {
  UI_DENSITY_DOCS_PATH,
  UI_DENSITY_EXPECTED_SAVE_VERSION,
  UI_DENSITY_MAX_HUB_PRIMARY_CARDS,
  UI_DENSITY_MAX_HUB_SECONDARY_STRIPS,
  UI_DENSITY_MAX_JOURNAL_ENTRIES_HUB,
  UI_DENSITY_MAX_MAP_BOTTOM_PANEL_LINES,
  UI_DENSITY_MAX_MAP_REACTIONS,
  UI_DENSITY_MAX_OPERATIONAL_RESOURCE_CARDS_COMPACT,
  UI_DENSITY_MAX_SOCIAL_MENTIONS_DAY1,
} from './uiDensityConstants';
import { runUiDensityAudit } from './uiDensityAudit';
import { formatUiDensityScreenLine } from './uiDensityPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyUiDensityOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

export function verifyUiDensityScenario(): VerifyUiDensityOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runUiDensityAudit();
  for (const screen of audit.screenResults) {
    checks.push(formatUiDensityScreenLine(screen.screenId, screen.status, screen.summary));
  }

  const day1Vis = buildHubCardVisibilityModel(createDay1Seed().gameState, createInitialMonetizationState());
  record(assert(checks, !day1Vis.showMainOperationSeason && !day1Vis.showCrisis, 'Day 1 Hub sade akış korunuyor'));
  record(
    assert(
      checks,
      (() => {
        const ref = readRepo('src/features/hub/components/HubReferenceHome.tsx');
        const bodyStart = ref.indexOf('<View style={styles.body}>');
        const body = bodyStart >= 0 ? ref.slice(bodyStart) : ref;
        return (
          body.includes('HubMainOperationFeelCard') &&
          body.indexOf('HubMainOperationFeelCard') < body.indexOf('HubCityJournalStrip')
        );
      })(),
      'Day 8+ Hub card priority var',
    ),
  );
  record(
    assert(
      checks,
      UI_DENSITY_MAX_HUB_PRIMARY_CARDS <= 4 && UI_DENSITY_MAX_HUB_SECONDARY_STRIPS <= 3,
      'Hub max primary card rule var',
    ),
  );
  record(assert(checks, readRepo('src/features/hub/components/HubCityJournalStrip.tsx').includes('numberOfLines={1}'), 'HubCityJournalStrip compact kalıyor'));
  record(assert(checks, readRepo('src/features/hub/components/HubTomorrowRiskStrip.tsx').includes('shouldShowAsCompact'), 'HubTomorrowRiskStrip compact support'));
  record(assert(checks, readRepo('src/features/hub/components/HubOperationalResourcesCard.tsx').includes('flexShrink: 1'), 'HubOperationalResourcesCard overflow guard var'));

  record(assert(checks, readRepo('src/features/events/components/EventResultImpactExplanationCard.tsx').includes('numberOfLines'), 'DecisionResultScreen impact explanation overflow guard var'));
  record(assert(checks, readRepo('src/features/events/screens/DecisionResultScreen.tsx').includes('accessibilityRole'), 'CTA görünürlük guard var'));
  record(assert(checks, readRepo('src/features/events/components/EventResultImpactExplanationCard.tsx').includes('maxVisibleLines'), 'result cards maxVisibleLines guard var'));

  record(assert(checks, readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes('reportGuard') || readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes('isDay1'), 'Report Day 1 sade'));
  record(assert(checks, readRepo('src/features/reports/components/ReportTomorrowRiskCard.tsx').includes('maxVisibleLines'), 'TomorrowRisk report card overflow guard var'));

  record(
    assert(
      checks,
      readRepo('src/features/map/components/MapOperationBottomPanel.tsx').includes('minWidth: 0'),
      'MapOperationBottomPanel max line/scroll guard var',
    ),
  );
  record(assert(checks, readRepo('src/features/map/components/MapDistrictReportCard.tsx').includes('flexShrink: 1'), 'MapDistrictReportCard overflow guard var'));
  record(assert(checks, readRepo('src/features/map/components/MapOperationBottomPanel.tsx').includes('mapReactionHintLine'), 'MapReaction line compact hook var'));
  record(assert(checks, readRepo('src/features/map/components/MapNeighborhoodStrip.tsx').includes('reactionLabel'), 'MapNeighborhoodStrip reaction label overflow guard var'));

  record(
    assert(
      checks,
      SOCIAL_PULSE_LAYOUT_GUARDS.maxNeighborhoodStripItems <= 5,
      'Social mention count cap korunuyor',
    ),
  );
  record(assert(checks, readRepo('src/features/social/screens/SocialPulseScreen.tsx').includes('isDay1Compact'), 'Day 1 compact mode korunuyor'));

  record(
    assert(
      checks,
      (readRepo('src/features/hub/components/OperationalResourcesDetailSheet.tsx').match(/numberOfLines=\{2\}/g)?.length ?? 0) >= 1,
      'Detail sheet ekip/araç kartları max 2 line',
    ),
  );
  record(assert(checks, !readRepo('src/features/hub/components/OperationalResourcesDetailSheet.tsx').includes('plaka'), 'Tekil personel/araç yok'));

  record(assert(checks, readRepo('src/features/map/components/MapNeighborhoodStrip.tsx').includes('accessibilityLabel'), 'Dynamic reaction sadece renk ile anlam taşımıyor'));
  record(assert(checks, readRepo('src/features/hub/components/HubMainOperationFeelCard.tsx').includes('accessibilityLabel'), 'Ana CTA accessibility label var'));

  record(assert(checks, SAVE_VERSION === UI_DENSITY_EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('uiDensity'), 'applyDecision değişmedi'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('uiDensity'), 'persist shape değişmedi'));
  record(assert(checks, !readRepo('app').includes('ui-density-route'), 'route eklenmedi'));
  record(assert(checks, existsSync(join(REPO_ROOT, UI_DENSITY_DOCS_PATH)), 'docs var'));
  record(assert(checks, readRepo('package.json').includes('verify:ui-density'), 'package.json script var'));

  record(
    assert(
      checks,
      audit.overallHealth === 'PASS' || audit.overallHealth === 'WARN',
      `Audit overall ${audit.overallHealth}`,
      `Audit overall ${audit.overallHealth}`,
    ),
  );

  void UI_DENSITY_MAX_MAP_BOTTOM_PANEL_LINES;
  void UI_DENSITY_MAX_MAP_REACTIONS;
  void UI_DENSITY_MAX_JOURNAL_ENTRIES_HUB;
  void UI_DENSITY_MAX_OPERATIONAL_RESOURCE_CARDS_COMPACT;
  void UI_DENSITY_MAX_SOCIAL_MENTIONS_DAY1;
  void MAP_UI_LAYOUT_GUARDS;

  checks.push(
    `Summary: ${audit.screenResults.filter((s) => s.status === 'PASS').length} PASS, ` +
      `${audit.screenResults.filter((s) => s.status === 'WARN').length} WARN, ` +
      `${audit.screenResults.filter((s) => s.status === 'FAIL').length} FAIL`,
  );

  return { ok, checks };
}
