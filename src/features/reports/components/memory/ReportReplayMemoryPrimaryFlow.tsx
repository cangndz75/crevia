import { StyleSheet, Text, View } from 'react-native';

import { ReportReplayDistrictMemoryCard } from '@/features/reports/components/memory/ReportReplayDistrictMemoryCard';
import { ReportReplayMemoryCapsuleCard } from '@/features/reports/components/memory/ReportReplayMemoryCapsuleCard';
import { ReportReplayMemoryEmptyState } from '@/features/reports/components/memory/ReportReplayMemoryEmptyState';
import { ReportReplayMemoryHero } from '@/features/reports/components/memory/ReportReplayMemoryHero';
import { ReportReplayMemoryTimeline } from '@/features/reports/components/memory/ReportReplayMemoryTimeline';
import { ReportReplayStylePatternSection } from '@/features/reports/components/memory/ReportReplayStylePatternSection';
import { ReportReplayTodayBridgeCard } from '@/features/reports/components/memory/ReportReplayTodayBridgeCard';
import { ReportReplayTradeoffHistoryStrip } from '@/features/reports/components/memory/ReportReplayTradeoffHistoryStrip';
import type { ReportReplayMemoryPresentation } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';

type Props = {
  model: ReportReplayMemoryPresentation;
  day: number;
  reducedMotion?: boolean;
};

export function ReportReplayMemoryPrimaryFlow({ model, day, reducedMotion }: Props) {
  return (
    <View style={styles.stack}>
      <ReportReplayMemoryHero model={model.hero} reducedMotion={reducedMotion} />
      <ReportReplayTodayBridgeCard model={model.todayBridge} reducedMotion={reducedMotion} />

      {model.emptyState ? <ReportReplayMemoryEmptyState model={model.emptyState} /> : null}

      {model.capsules.length > 0 ? (
        <View style={styles.capsuleSection}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Gün anıları
          </Text>
          {model.capsules.map((capsule, index) => (
            <ReportReplayMemoryCapsuleCard
              key={capsule.id}
              capsule={capsule}
              index={index}
              day={day}
              reducedMotion={reducedMotion}
            />
          ))}
          {model.expandAllLabel ? (
            <Text style={styles.expandLabel} numberOfLines={1}>
              {model.expandAllLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      {model.timeline.visible ? (
        <ReportReplayMemoryTimeline
          items={model.timeline.items}
          day={day}
          collapsedLabel={model.timeline.collapsedLabel}
          reducedMotion={reducedMotion}
        />
      ) : null}

      <ReportReplayStylePatternSection model={model.stylePattern} reducedMotion={reducedMotion} />
      <ReportReplayDistrictMemoryCard model={model.districtMemory} reducedMotion={reducedMotion} />
      <ReportReplayTradeoffHistoryStrip model={model.tradeoffHistory} reducedMotion={reducedMotion} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14, minWidth: 0 },
  capsuleSection: { gap: 10, minWidth: 0 },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: '#173D3A',
  },
  expandLabel: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: '#68746E',
    textAlign: 'center',
  },
});
