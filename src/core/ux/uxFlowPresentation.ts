import { DISPATCH_FIELD_LAYOUT_GUARDS } from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { MAP_UI_LAYOUT_GUARDS } from '@/features/map/utils/mapUiPresentation';
import { REPORT_UI_BANNED_WORDS } from '@/features/reports/utils/endOfDayReportPresentation';

/** Workflow fazlarında tekil ana CTA metinleri. */
export const WORKFLOW_CTA_LABELS = {
  inspect: 'Planlamaya Geç',
  plan: 'Yönlendirmeye Geç',
  dispatch: 'Sahaya Yönlendir',
  field: 'Sonucu Gör',
  reportContinue: 'Operasyon Merkezine Dön',
  reportDay7Continue: 'Ana Operasyona Göz At',
} as const;

export const FULL_UX_BANNED_WORDS = [
  ...REPORT_UI_BANNED_WORDS,
  'rank up',
] as const;

export const FULL_UX_LAYOUT_GUARDS = {
  hubTaskHero: {
    titleNumberOfLines: 2,
    descNumberOfLines: 2,
    usesFlexShrink: true,
    usesMinWidthZero: true,
  },
  hubAuthorityChip: {
    rankNumberOfLines: 1,
    progressNumberOfLines: 1,
    usesMinWidthZero: true,
  },
  mapOperationHeader: MAP_UI_LAYOUT_GUARDS,
  mapNeighborhoodStrip: {
    labelNumberOfLines: 1,
    statusNumberOfLines: 1,
    usesMinWidthZero: true,
  },
  mapOperationBottomPanel: {
    titleNumberOfLines: 1,
    noteNumberOfLines: 2,
    usesFlexShrink: true,
    usesMinWidthZero: true,
  },
  decisionOptionCard: {
    titleUsesNumberOfLines: true,
    authorityPreviewNumberOfLines: 2,
    usesMinWidthZero: true,
  },
  dispatchCommandCard: DISPATCH_FIELD_LAYOUT_GUARDS,
  eventDispatchPhase: DISPATCH_FIELD_LAYOUT_GUARDS,
  liveOperationCard: {
    statusNumberOfLines: 1,
    detailNumberOfLines: 2,
    routeNumberOfLines: 1,
  },
  fieldImpactMetricsRow: {
    metricNumberOfLines: 1,
    usesMinWidthZero: true,
  },
  eventFieldPhase: DISPATCH_FIELD_LAYOUT_GUARDS,
  reportAuthoritySummary: {
    maxLines: 2,
    titleNumberOfLines: 1,
  },
  reportBadgeSummary: {
    chipNumberOfLines: 1,
    usesFlexShrink: true,
  },
  reportPilotCompletionCard: {
    statNumberOfLines: 2,
    compactSpacing: true,
  },
  endOfDayImpactStrip: {
    metricNumberOfLines: 1,
    usesMinWidthZero: true,
  },
  endOfDaySystemSummaries: {
    sectionTitleNumberOfLines: 1,
    lineNumberOfLines: 2,
    compactLineNumberOfLines: 1,
  },
  profileAuthorityCard: {
    rankNumberOfLines: 2,
    usesMinWidthZero: true,
  },
  profileBadgeShowcaseCard: {
    tileTitleNumberOfLines: 2,
    usesMinWidthZero: true,
  },
} as const;

export const FULL_UX_CHECKED_SCREENS = [
  'hub',
  'event_detail_workflow',
  'event_detail_legacy',
  'map',
  'daily_report',
  'profile',
] as const;

export function fullUxTextContainsBannedWords(text: string): string[] {
  const haystack = text.toLowerCase();
  return FULL_UX_BANNED_WORDS.filter((word) => {
    if (word === 'xp') {
      return /\bxp\b/.test(haystack);
    }
    return haystack.includes(word);
  });
}

export function collectFullUxWorkflowPresentationStrings(): string[] {
  return [
    ...Object.values(WORKFLOW_CTA_LABELS),
    'İncele',
    'Planla',
    'Yönlendir',
    'Sahada',
    'Sonuç',
    'Gün Sonu',
    'Merkeze Dön',
  ];
}

export function resolveReportContinueCtaLabel(
  day: number,
  hasPilotCompletion: boolean,
): string {
  return day === 7 && hasPilotCompletion
    ? WORKFLOW_CTA_LABELS.reportDay7Continue
    : WORKFLOW_CTA_LABELS.reportContinue;
}
