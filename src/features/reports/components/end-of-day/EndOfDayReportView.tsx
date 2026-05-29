import Animated, { FadeInUp } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import type { DailyReport } from '@/core/models/DailyReport';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DailyXpReport } from '@/core/xp/xpReport';
import { EndOfDayReportHero } from '@/features/reports/components/end-of-day/EndOfDayReportHero';
import { EndOfDayReportImpactStrip } from '@/features/reports/components/end-of-day/EndOfDayReportImpactStrip';
import { EndOfDayReportMetaProgressSection } from '@/features/reports/components/end-of-day/EndOfDayReportMetaProgressSection';
import { EndOfDayReportSystemSummaries } from '@/features/reports/components/end-of-day/EndOfDayReportSystemSummaries';
import { EndOfDayReportTomorrowNotes } from '@/features/reports/components/end-of-day/EndOfDayReportTomorrowNotes';
import { EndOfDayReportXpCard } from '@/features/reports/components/end-of-day/EndOfDayReportXpCard';
import { PilotReportSummaryCard } from '@/features/reports/components/PilotReportSummaryCard';
import { ReportPilotCompletionCard } from '@/features/reports/components/ReportPilotCompletionCard';
import type { PilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import type { useReportPilotCompletionSummary } from '@/features/pilot/hooks/usePilotCompletionSummary';
import { normalizePostPilotOperationState } from '@/core/postPilot';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { useGameStore } from '@/store/useGameStore';
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

const enter = (delay: number) =>
  FadeInUp.delay(delay).duration(260).springify().damping(24);

export function EndOfDayReportView({
  report,
  metrics,
  dailyXpReport,
  day1PriorityLine,
  day1GoalsLine,
  pilotReportContext,
  pilotCompletionSummary,
}: Props) {
  const postPilotLightDay = useGameStore((s) => {
    if (s.gameState.pilot.status !== 'completed') {
      return false;
    }
    const postPilot = normalizePostPilotOperationState(
      s.gameState.pilot.postPilotOperation,
      {
        pilotStatus: 'completed',
        currentPilotDay: s.gameState.pilot.currentPilotDay,
      },
    );
    return (
      postPilot.phase === 'main_operation_light' &&
      report.day >= POST_PILOT_FIRST_OPERATION_DAY
    );
  });

  const model = buildEndOfDayReportViewModel({
    report,
    metrics,
    dailyXpReport,
    day1PriorityLine,
    day1GoalsLine,
    postPilotLightDay,
  });

  const sectionGap = model.isDay7 ? spacing.sm : spacing.md;

  return (
    <View style={[styles.stack, model.isDay7 && styles.stackDay7]}>
      <Animated.View entering={enter(0)}>
        <EndOfDayReportHero
          day={model.day}
          statusTitle={model.statusTitle}
          successScore={model.successScore}
          subtitle={model.heroSubtitle}
        />
      </Animated.View>

      <Animated.View entering={enter(60)}>
        <EndOfDayReportImpactStrip metrics={model.impactMetrics} />
      </Animated.View>

      <Animated.View entering={enter(120)}>
        <EndOfDayReportMetaProgressSection
          authorityLines={report.authoritySummaryLines ?? []}
          badgeEvaluation={report.badgeEvaluation}
          compact={model.isDay1}
        />
      </Animated.View>

      {model.showSystemSummaries ? (
        <Animated.View entering={enter(180)}>
          <EndOfDayReportSystemSummaries
            sections={model.systemSections}
            compact={model.isDay7}
          />
        </Animated.View>
      ) : null}

      {model.showTomorrowNotes && model.tomorrowNotes.length > 0 ? (
        <Animated.View entering={enter(220)}>
          <EndOfDayReportTomorrowNotes notes={model.tomorrowNotes} compact={model.isDay7} />
        </Animated.View>
      ) : null}

      {model.showXpCard ? (
        <Animated.View entering={enter(260)}>
          <EndOfDayReportXpCard
            totalXp={model.xpTotal}
            subtitle={model.xpSubtitle}
            breakdown={model.xpBreakdown}
          />
        </Animated.View>
      ) : null}

      {pilotReportContext ? (
        <Animated.View entering={enter(300)}>
          <PilotReportSummaryCard context={pilotReportContext} />
        </Animated.View>
      ) : null}

      {pilotCompletionSummary ? (
        <Animated.View entering={enter(340)} style={{ marginTop: sectionGap }}>
          <ReportPilotCompletionCard summary={pilotCompletionSummary} compact />
        </Animated.View>
      ) : null}
    </View>
  );
}

export const endOfDayReportViewStyles = {
  stack: {
    gap: spacing.md,
  },
};

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  stackDay7: {
    gap: spacing.sm,
  },
});
