import Animated, { FadeInUp } from 'react-native-reanimated';

import type { DailyReport } from '@/core/models/DailyReport';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DailyXpReport } from '@/core/xp/xpReport';
import { EndOfDayReportHero } from '@/features/reports/components/end-of-day/EndOfDayReportHero';
import { EndOfDayReportMetricGrid } from '@/features/reports/components/end-of-day/EndOfDayReportMetricGrid';
import { EndOfDayReportTomorrowNotes } from '@/features/reports/components/end-of-day/EndOfDayReportTomorrowNotes';
import { EndOfDayReportXpCard } from '@/features/reports/components/end-of-day/EndOfDayReportXpCard';
import { PilotReportSummaryCard } from '@/features/reports/components/PilotReportSummaryCard';
import { ReportBadgeSummary } from '@/features/reports/components/ReportBadgeSummary';
import { ReportPilotCompletionCard } from '@/features/reports/components/ReportPilotCompletionCard';
import type { PilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import type { useReportPilotCompletionSummary } from '@/features/pilot/hooks/usePilotCompletionSummary';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  report: DailyReport;
  metrics: GameMetrics;
  dailyXpReport: DailyXpReport;
  day1PriorityLine?: string | null;
  day1GoalsLine?: string | null;
  pilotReportContext: PilotReportContext | null;
  pilotCompletionSummary: ReturnType<typeof useReportPilotCompletionSummary>;
};

export function EndOfDayReportView({
  report,
  metrics,
  dailyXpReport,
  day1PriorityLine,
  day1GoalsLine,
  pilotReportContext,
  pilotCompletionSummary,
}: Props) {
  const model = buildEndOfDayReportViewModel({
    report,
    metrics,
    dailyXpReport,
    day1PriorityLine,
    day1GoalsLine,
  });

  return (
    <>
      <Animated.View entering={FadeInUp.duration(300).springify().damping(22)}>
        <EndOfDayReportHero
          successScore={model.successScore}
          subtitle={model.heroSubtitle}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(80).duration(280)}>
        <EndOfDayReportMetricGrid cards={model.metricCards} />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(140).duration(280)}>
        <EndOfDayReportXpCard
          totalXp={model.xpTotal}
          subtitle={model.xpSubtitle}
          breakdown={model.xpBreakdown}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(280)}>
        <EndOfDayReportTomorrowNotes notes={model.tomorrowNotes} />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(230).duration(280)}>
        <ReportBadgeSummary
          evaluation={report.badgeEvaluation}
          compact={report.day === 1}
        />
      </Animated.View>

      {pilotReportContext ? (
        <Animated.View entering={FadeInUp.delay(260).duration(280)}>
          <PilotReportSummaryCard context={pilotReportContext} />
        </Animated.View>
      ) : null}

      {pilotCompletionSummary ? (
        <ReportPilotCompletionCard summary={pilotCompletionSummary} />
      ) : null}
    </>
  );
}

export const endOfDayReportViewStyles = {
  stack: {
    gap: spacing.md,
  },
};
