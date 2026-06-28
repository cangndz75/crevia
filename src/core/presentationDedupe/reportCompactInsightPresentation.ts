import type { EndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';

import {
  buildAvoidLines,
  lineDuplicatesAvoidLines,
  type PresentationSurface,
} from './presentationDedupe';

export const REPORT_STRATEGIC_COMPACT_INSIGHT_MAX = 4;

export type ReportStrategicInsightKey =
  | 'operationalTempo'
  | 'tomorrowPreparation'
  | 'periodGoalImpact'
  | 'districtMemory'
  | 'managementStyle'
  | 'dominantStrategy'
  | 'districtNeglectRecovery'
  | 'day8Strategic'
  | 'cityRhythm'
  | 'cityMemory'
  | 'followUpAction'
  | 'followUpExecution'
  | 'positiveComeback';

type ReportStrategicInsightCandidate = {
  key: ReportStrategicInsightKey;
  line: string;
  priority: number;
  surface: PresentationSurface;
};

const STRATEGIC_INSIGHT_PRIORITY: Record<ReportStrategicInsightKey, number> = {
  tomorrowPreparation: 100,
  operationalTempo: 92,
  periodGoalImpact: 88,
  managementStyle: 74,
  districtMemory: 70,
  districtNeglectRecovery: 68,
  followUpAction: 66,
  positiveComeback: 64,
  cityMemory: 62,
  dominantStrategy: 58,
  followUpExecution: 56,
  day8Strategic: 54,
  cityRhythm: 52,
};

export function buildReportStrategicInsightCandidates(
  model: Pick<
    EndOfDayReportViewModel,
    | 'operationalTempoLine'
    | 'tomorrowPreparationLine'
    | 'periodGoalImpactLine'
    | 'districtMemoryInsightLine'
    | 'managementStyleLine'
    | 'dominantStrategyNote'
    | 'districtNeglectRecoveryNote'
    | 'day8StrategicContentNote'
    | 'cityRhythmNote'
    | 'cityMemoryNote'
    | 'followUpActionHint'
    | 'followUpExecutionNote'
    | 'positiveComebackNote'
  >,
): ReportStrategicInsightCandidate[] {
  const candidates: Array<ReportStrategicInsightCandidate | null> = [
    model.tomorrowPreparationLine
      ? {
          key: 'tomorrowPreparation',
          line: model.tomorrowPreparationLine,
          priority: STRATEGIC_INSIGHT_PRIORITY.tomorrowPreparation,
          surface: 'maintenance',
        }
      : null,
    model.operationalTempoLine
      ? {
          key: 'operationalTempo',
          line: model.operationalTempoLine,
          priority: STRATEGIC_INSIGHT_PRIORITY.operationalTempo,
          surface: 'reportInsight',
        }
      : null,
    model.periodGoalImpactLine
      ? {
          key: 'periodGoalImpact',
          line: model.periodGoalImpactLine,
          priority: STRATEGIC_INSIGHT_PRIORITY.periodGoalImpact,
          surface: 'periodGoal',
        }
      : null,
    model.managementStyleLine
      ? {
          key: 'managementStyle',
          line: model.managementStyleLine,
          priority: STRATEGIC_INSIGHT_PRIORITY.managementStyle,
          surface: 'playerStyle',
        }
      : null,
    model.districtMemoryInsightLine
      ? {
          key: 'districtMemory',
          line: model.districtMemoryInsightLine,
          priority: STRATEGIC_INSIGHT_PRIORITY.districtMemory,
          surface: 'district',
        }
      : null,
    model.districtNeglectRecoveryNote
      ? {
          key: 'districtNeglectRecovery',
          line: model.districtNeglectRecoveryNote,
          priority: STRATEGIC_INSIGHT_PRIORITY.districtNeglectRecovery,
          surface: 'district',
        }
      : null,
    model.followUpActionHint?.line
      ? {
          key: 'followUpAction',
          line: model.followUpActionHint.line,
          priority: STRATEGIC_INSIGHT_PRIORITY.followUpAction,
          surface: 'reportInsight',
        }
      : null,
    model.positiveComebackNote
      ? {
          key: 'positiveComeback',
          line: model.positiveComebackNote,
          priority: STRATEGIC_INSIGHT_PRIORITY.positiveComeback,
          surface: 'reportInsight',
        }
      : null,
    model.cityMemoryNote?.line
      ? {
          key: 'cityMemory',
          line: model.cityMemoryNote.line,
          priority: STRATEGIC_INSIGHT_PRIORITY.cityMemory,
          surface: 'reportInsight',
        }
      : null,
    model.dominantStrategyNote
      ? {
          key: 'dominantStrategy',
          line: model.dominantStrategyNote,
          priority: STRATEGIC_INSIGHT_PRIORITY.dominantStrategy,
          surface: 'reportInsight',
        }
      : null,
    model.followUpExecutionNote
      ? {
          key: 'followUpExecution',
          line: model.followUpExecutionNote,
          priority: STRATEGIC_INSIGHT_PRIORITY.followUpExecution,
          surface: 'reportInsight',
        }
      : null,
    model.day8StrategicContentNote
      ? {
          key: 'day8Strategic',
          line: model.day8StrategicContentNote,
          priority: STRATEGIC_INSIGHT_PRIORITY.day8Strategic,
          surface: 'reportInsight',
        }
      : null,
    model.cityRhythmNote
      ? {
          key: 'cityRhythm',
          line: model.cityRhythmNote,
          priority: STRATEGIC_INSIGHT_PRIORITY.cityRhythm,
          surface: 'reportInsight',
        }
      : null,
  ];

  return candidates.filter((item): item is ReportStrategicInsightCandidate => item !== null);
}

export function selectVisibleReportStrategicInsights(
  model: Parameters<typeof buildReportStrategicInsightCandidates>[0],
  avoidLines: ReadonlyArray<string | null | undefined> = [],
  maxItems: number = REPORT_STRATEGIC_COMPACT_INSIGHT_MAX,
): Set<ReportStrategicInsightKey> {
  const activeAvoid = buildAvoidLines(avoidLines);
  const visible = new Set<ReportStrategicInsightKey>();
  const sorted = buildReportStrategicInsightCandidates(model).sort((a, b) => b.priority - a.priority);

  for (const candidate of sorted) {
    if (visible.size >= maxItems) break;
    if (lineDuplicatesAvoidLines(candidate.line, activeAvoid)) continue;
    visible.add(candidate.key);
    activeAvoid.push(candidate.line);
  }

  return visible;
}

export function shouldShowReportSocialEchoInsight(
  message: string | null | undefined,
  avoidLines: ReadonlyArray<string | null | undefined>,
): boolean {
  if (!message?.trim()) return false;
  return !lineDuplicatesAvoidLines(message, avoidLines);
}

export function shouldShowReportMemoryTraceInsight(
  line: string | null | undefined,
  avoidLines: ReadonlyArray<string | null | undefined>,
): boolean {
  if (!line?.trim()) return false;
  return !lineDuplicatesAvoidLines(line, avoidLines);
}
