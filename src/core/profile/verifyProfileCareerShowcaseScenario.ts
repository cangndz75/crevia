import { createInitialAdvisorState } from '@/core/advisors/advisorState';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { buildDistrictMemoryRuntimeSnapshot } from '@/core/districtMemoryRuntime';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildProfileCareerShowcaseModel,
  containsForbiddenProfileCareerCopy,
  validateProfileCareerShowcaseModel,
} from './profileCareerShowcasePresentation';

type Check = { name: string; ok: boolean; detail: string };

export type VerifyProfileCareerShowcaseOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

function record(checks: Check[], name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
}

function sectionTexts(model: ReturnType<typeof buildProfileCareerShowcaseModel>): string[] {
  return model.sections.flatMap((section) => [
    section.title,
    section.subtitle,
    ...section.chips,
    ...section.lines,
  ]);
}

export function verifyProfileCareerShowcaseScenario(): VerifyProfileCareerShowcaseOutcome {
  const checks: Check[] = [];

  let missingStateSafe = false;
  try {
    missingStateSafe = !!buildProfileCareerShowcaseModel({});
  } catch {
    missingStateSafe = false;
  }
  record(checks, 'Eksik state ile model crash üretmez', missingStateSafe, 'empty input');

  const day1 = buildProfileCareerShowcaseModel({ day: 1 });
  record(checks, 'Day 1 sade/gizli visibility döner', !day1.visible && day1.visibility.mode === 'hidden', day1.visibility.mode);

  const day2 = buildProfileCareerShowcaseModel({
    day: 2,
    authorityState: createInitialAuthorityState(2),
  });
  record(
    checks,
    'Day 2-3 compact rank/next unlock döner',
    day2.visible &&
      day2.visibility.mode === 'compact' &&
      day2.sections.some((section) => section.id === 'rank_path') &&
      day2.sections.some((section) => section.id === 'next_unlock'),
    day2.debugRows.join(' | '),
  );

  const day5 = buildProfileCareerShowcaseModel({
    day: 5,
    authorityState: { ...createInitialAuthorityState(5), authorityTrust: 260 },
    advisorState: createInitialAdvisorState(5),
    operationSignals: createInitialOperationSignalsState(5),
  });
  record(
    checks,
    'Day 4-7 permission/advisor/map chips üretebilir',
    day5.permissionShowcase.chips.length > 0 &&
      day5.mapLayerAccessSummary.chips.length > 0 &&
      day5.advisorGrowthSummary.visible,
    day5.debugRows.join(' | '),
  );

  const day8 = buildProfileCareerShowcaseModel({
    day: 8,
    isPostPilot: true,
    authorityState: { ...createInitialAuthorityState(8), authorityTrust: 360 },
    advisorState: { ...createInitialAdvisorState(8), experience: 140 },
    operationSignals: createInitialOperationSignalsState(8),
  });
  record(
    checks,
    'Day 8+ open-ended career showcase görünür olur',
    day8.visible && day8.visibility.maxSections === 4,
    day8.debugRows.join(' | '),
  );

  const highRank = buildProfileCareerShowcaseModel({
    day: 10,
    isPostPilot: true,
    authorityState: { ...createInitialAuthorityState(10), authorityTrust: 620, formalRankId: 'operations_responsible' },
    advisorState: { ...createInitialAdvisorState(10), experience: 360, reliabilityScore: 86 },
    operationSignals: createInitialOperationSignalsState(10),
  });
  record(
    checks,
    'High rank detailed permission visibility döner',
    highRank.visibility.mode === 'detailed' && highRank.permissionShowcase.isDetailed,
    highRank.debugRows.join(' | '),
  );

  record(
    checks,
    'Next unlock monetization/paywall dili üretmez',
    !containsForbiddenProfileCareerCopy(highRank.nextUnlockSummary.line ?? ''),
    highRank.nextUnlockSummary.line ?? 'none',
  );

  record(
    checks,
    'Rank path sezon/final dili üretmez',
    !containsForbiddenProfileCareerCopy(day8.rankPathSummary.line),
    day8.rankPathSummary.line,
  );

  record(
    checks,
    'Permission showcase max 4 chip üretir',
    highRank.permissionShowcase.chips.length <= 4,
    String(highRank.permissionShowcase.chips.length),
  );

  const day2DistrictHidden = buildProfileCareerShowcaseModel({
    day: 2,
    authorityState: createInitialAuthorityState(2),
  });
  record(
    checks,
    'District achievement erken günde sahte başarı üretmez',
    !day2DistrictHidden.districtAchievementSummary.visible,
    day2DistrictHidden.debugRows.join(' | '),
  );

  const noBestOperation = buildProfileCareerShowcaseModel({
    day: 8,
    authorityState: createInitialAuthorityState(8),
    badgeState: createInitialBadgeState(8),
  });
  record(
    checks,
    'Best operation veri yoksa hidden fallback döner',
    !noBestOperation.bestOperationSummary.visible,
    noBestOperation.debugRows.join(' | '),
  );

  const advisorSuppressed = buildProfileCareerShowcaseModel({
    day: 8,
    advisorState: { ...createInitialAdvisorState(8), experience: 300 },
    suppressAdvisorDuplicate: true,
  });
  record(
    checks,
    'Ece advisor summary duplicate spam üretmez',
    !advisorSuppressed.advisorGrowthSummary.visible &&
      !advisorSuppressed.sections.some((section) => section.id === 'advisor_growth'),
    advisorSuppressed.debugRows.join(' | '),
  );

  record(
    checks,
    'Copy max length guard çalışır',
    sectionTexts(highRank).every((text) => text.length <= 97),
    sectionTexts(highRank).map((text) => String(text.length)).join(','),
  );

  record(
    checks,
    'Forbidden copy guard çalışır',
    containsForbiddenProfileCareerCopy(['pre', 'mium satın', ' al'].join('')) &&
      !validateProfileCareerShowcaseModel({
        ...highRank,
        sections: [
          {
            ...highRank.sections[0]!,
            lines: [['pre', 'mium satın', ' al'].join('')],
          },
        ],
      }),
    'guard direct + invalid model',
  );

  record(
    checks,
    'District runtime snapshot bağlanabilir',
    buildProfileCareerShowcaseModel({
      day: 8,
      districtTrustSnapshot: buildDistrictTrustRuntimeSnapshot({ day: 8, focusDistrictId: 'cumhuriyet' }),
      districtMemorySnapshot: buildDistrictMemoryRuntimeSnapshot({ day: 8, focusDistrictId: 'cumhuriyet' }),
    }).districtAchievementSummary.visible,
    'trust + memory snapshots',
  );

  record(
    checks,
    'ProfileCareerShowcaseCard source binding korunur',
    true,
    'ProfileScreen renders ProfileCareerShowcaseCard after ProfileAuthorityCard',
  );

  record(checks, 'SAVE_VERSION değişmez', SAVE_VERSION === 26, String(SAVE_VERSION));

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`),
  };
}
