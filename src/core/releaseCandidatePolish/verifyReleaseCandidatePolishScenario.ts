import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { buildMainOperationFeelFromStore, buildMainOperationFeelHubPresentation } from '@/core/mainOperationFeel';
import {
  buildDistrictReportCardLiteModel,
  buildDistrictReportCardSummaryForHub,
  buildDistrictReportCardLineForReport,
} from '@/core/districtReportCard';
import { buildCityJournalMapHint } from '@/core/cityJournal/cityJournalPresentation';
import { buildMapReactionLiteModel } from '@/core/mapReactions';
import {
  REPORT_FULL_COLLAPSE_BACKLOG,
  resolveReportSecondaryCompactMode,
  reportSecondaryLineMaxLines,
} from './reportSecondaryCompactPresentation';
import { RELEASE_CANDIDATE_POLISH_DOCS_PATH, RELEASE_CANDIDATE_POLISH_HUB_WIRING } from './releaseCandidatePolishConstants';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

export type VerifyReleaseCandidatePolishOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

export function verifyReleaseCandidatePolishScenario(): VerifyReleaseCandidatePolishOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const hubHome = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  const hubScreen = readRepo('src/features/hub/screens/HubScreen.tsx');
  const advisorCard = readRepo('src/features/hub/components/HubAdvisorCard.tsx');
  const sheet = readRepo('src/features/hub/components/OperationalResourcesDetailSheet.tsx');
  const reportView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  const mentionCard = readRepo('src/features/social/components/mentions/MentionFeedCard.tsx');
  const mapReactions = readRepo('src/core/mapReactions/mapReactionModel.ts');
  const manual = runManualLaunchTrackerAudit();

  record(assert(checks, hubHome.includes('HubMainOperationSeasonCard'), 'HubMainOperationSeasonCard wired in Reference Home'));
  record(assert(checks, hubHome.includes('HubAdvisorCard'), 'HubAdvisorCard wired in Reference Home'));
  record(assert(checks, hubHome.includes('hubDistrictReportLine'), 'District report Hub supporting line prop'));
  record(assert(checks, hubHome.includes('showMainOperationSeason'), 'Season card visibility prop'));
  record(assert(checks, hubScreen.includes('buildDistrictReportCardSummaryForHub'), 'Hub district summary helper used'));
  record(assert(checks, hubScreen.includes('showMainOperationSeason'), 'HubScreen passes season visibility'));
  record(assert(checks, advisorCard.includes('selectPriorityAdvisorSupportingLine'), 'Advisor priority insight guard'));
  record(
    assert(
      checks,
      reportView.includes('buildDistrictReportCardLineForReport'),
      'District report line helper wired',
    ),
  );
  record(
    assert(
      checks,
      reportView.includes('resolveReportSecondaryCompactMode'),
      'Report secondary compact mode',
    ),
  );
  record(assert(checks, sheet.includes('accessibilityState'), 'OperationalResourcesDetailSheet tab accessibilityState'));
  record(assert(checks, sheet.includes('accessibilityRole="tab"'), 'OperationalResourcesDetailSheet tab role'));
  record(assert(checks, mentionCard.includes('numberOfLines'), 'MentionFeedCard numberOfLines guard'));
  record(assert(checks, mapReactions.includes('buildCityJournalMapHint'), 'CityJournal map hint in MapReaction pipeline'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'scripts/regenerate-expo-router-types.ts')), 'Typecheck regen script exists'));

  const day1Vis = buildHubCardVisibilityModel(
    { city: { day: 1 }, pilot: { status: 'active', currentPilotDay: 1 } } as never,
    { accessMode: 'none' } as never,
  );
  record(assert(checks, !day1Vis.showMainOperationSeason, 'Day 1 season card hidden by visibility model'));

  const postPilotCompact = resolveReportSecondaryCompactMode(8);
  record(
    assert(
      checks,
      postPilotCompact === 'post_pilot_compact' && reportSecondaryLineMaxLines(postPilotCompact) === 1,
      'Day 8+ report secondary compact lines',
    ),
  );
  record(assert(checks, REPORT_FULL_COLLAPSE_BACKLOG.includes('V1.1'), 'Full collapse documented as V1.1 backlog'));

  const districtModel = buildDistrictReportCardLiteModel({ districtId: 'cumhuriyet', day: 8, isPostPilot: true });
  const hubLine = districtModel
    ? buildDistrictReportCardSummaryForHub(districtModel, [])
    : null;
  record(assert(checks, hubLine === null || hubLine.length > 0, 'District hub helper produces safe line'));

  const reportLine = districtModel
    ? buildDistrictReportCardLineForReport(districtModel, [])
    : null;
  record(assert(checks, reportLine === null || reportLine.length > 0, 'District report helper produces safe line'));

  const journalHint = buildCityJournalMapHint(null, 'cumhuriyet', []);
  record(assert(checks, !journalHint.visible || (journalHint.line?.length ?? 0) > 0, 'CityJournal map hint safe'));

  record(assert(checks, manual.roundOne.verifiedEvidence === 0, 'Evidence verified count unchanged'));
  record(assert(checks, manual.publicLaunchDecision === 'blocked_for_public_launch', 'Public launch blocked'));
  record(
    assert(
      checks,
      manual.roundOne.internalDeviceTestExecutionStatus === 'ready_to_execute',
      'Internal device test ready_to_execute',
    ),
  );
  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION unchanged'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('releaseCandidatePolishState'), 'persist shape unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('releaseCandidatePolish'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('releaseCandidatePolish'),
      'dayPipeline unchanged',
    ),
  );
  record(assert(checks, existsSync(join(REPO_ROOT, RELEASE_CANDIDATE_POLISH_DOCS_PATH)), 'Polish pack docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:release-candidate-polish'), 'package.json script'));
  record(
    assert(
      checks,
      RELEASE_CANDIDATE_POLISH_HUB_WIRING.seasonCardMinDay >= 9,
      'Season card Day 8 feel priority documented in constants',
    ),
  );

  return { ok, checks };
}
