import { EndOfDayManagerStyleCard } from '@/features/reports/components/end-of-day/closure/EndOfDayManagerStyleCard';
import type { EndOfDayReportClosurePresentation } from '@/features/reports/presentation/closure/endOfDayReportClosurePresentation';
import { EndOfDayClosureHero } from '@/features/reports/components/end-of-day/closure/EndOfDayClosureHero';
import { EndOfDayDecisionStoryCard } from '@/features/reports/components/end-of-day/closure/EndOfDayDecisionStoryCard';
import { EndOfDayEceClosingCard } from '@/features/reports/components/end-of-day/closure/EndOfDayEceClosingCard';
import { EndOfDayNeighborhoodPulseCard } from '@/features/reports/components/end-of-day/closure/EndOfDayNeighborhoodPulseCard';
import { EndOfDayOutcomeSummary } from '@/features/reports/components/end-of-day/closure/EndOfDayOutcomeSummary';
import { EndOfDayTomorrowFocusCard } from '@/features/reports/components/end-of-day/closure/EndOfDayTomorrowFocusCard';
import { EndOfDayTradeoffBalanceCard } from '@/features/reports/components/end-of-day/closure/EndOfDayTradeoffBalanceCard';
import { ReportDayFlowTimeline } from '@/features/reports/components/end-of-day/ReportDayFlowTimeline';
import { buildReportReplayPresentation } from '@/core/reportReplay';
import type { ReportReplayContextInput } from '@/core/reportReplay';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  closure: EndOfDayReportClosurePresentation;
  replayInput: ReportReplayContextInput;
  day: number;
  reducedMotion?: boolean;
  onDayFlowLayout?: (event: import('react-native').LayoutChangeEvent) => void;
  onManagerStyleCta?: () => void;
};

export function EndOfDayClosurePrimaryFlow({
  closure,
  replayInput,
  day,
  reducedMotion,
  onDayFlowLayout,
  onManagerStyleCta,
}: Props) {
  const replayModel = buildReportReplayPresentation(replayInput);
  const timelineItems = closure.replayTimeline.items;
  const replayForTimeline = {
    ...replayModel,
    items: replayModel.items.filter((item) =>
      timelineItems.some((t) => t.id === item.id),
    ),
  };

  return (
    <View style={styles.stack}>
      <EndOfDayClosureHero model={closure.hero} reducedMotion={reducedMotion} />
      <EndOfDayOutcomeSummary chips={closure.outcomeChips} reducedMotion={reducedMotion} />
      <EndOfDayManagerStyleCard
        model={closure.managerStyle}
        reducedMotion={reducedMotion}
        onCtaPress={onManagerStyleCta}
      />
      <EndOfDayDecisionStoryCard model={closure.decisionStory} reducedMotion={reducedMotion} />
      <EndOfDayNeighborhoodPulseCard model={closure.neighborhoodPulse} reducedMotion={reducedMotion} />
      <EndOfDayTradeoffBalanceCard model={closure.tradeoffBalance} reducedMotion={reducedMotion} />
      <EndOfDayTomorrowFocusCard model={closure.tomorrowFocus} reducedMotion={reducedMotion} />
      <EndOfDayEceClosingCard model={closure.eceClosing} reducedMotion={reducedMotion} />

      {closure.replayTimeline.visible ? (
        <View onLayout={onDayFlowLayout}>
          <ReportDayFlowTimeline
            model={replayForTimeline}
            day={day}
            reducedMotion={reducedMotion}
          />
          {closure.replayTimeline.collapsedLabel ? (
            <Text style={styles.overflowLabel}>{closure.replayTimeline.collapsedLabel}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16, minWidth: 0 },
  overflowLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#6B8582',
    textAlign: 'center',
  },
});
