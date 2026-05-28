import { StyleSheet, Text, View } from 'react-native';

import { PlanningDetailStatsRow } from '@/features/events/components/event-workflow/plan/details/PlanningDetailStatsRow';
import { PlanningImpactChips } from '@/features/events/components/event-workflow/plan/details/PlanningImpactChips';
import { PlanningRoutePreviewCard } from '@/features/events/components/event-workflow/plan/details/PlanningRoutePreviewCard';
import type { PlanningDetailExpandedContent } from '@/features/events/utils/eventWorkflowPlanDetails';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type PlanningDetailExpandedBodyProps = {
  content: PlanningDetailExpandedContent;
};

export function PlanningDetailExpandedBody({ content }: PlanningDetailExpandedBodyProps) {
  if (content.kind === 'stats') {
    return (
      <View style={styles.wrap}>
        <PlanningDetailStatsRow stats={content.stats} />
        {content.footnote ? (
          <Text style={styles.footnote} numberOfLines={2}>
            {content.footnote}
          </Text>
        ) : null}
      </View>
    );
  }

  if (content.kind === 'statsWithBadge') {
    return (
      <View style={styles.wrap}>
        <PlanningImpactChips
          label={content.badge.label}
          value={content.badge.value}
          tone={content.badge.tone}
        />
        <PlanningDetailStatsRow stats={content.stats} />
        {content.footnote ? (
          <Text style={styles.footnote} numberOfLines={2}>
            {content.footnote}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <PlanningRoutePreviewCard route={content.route} />
      <PlanningDetailStatsRow stats={content.stats} />
      {content.footnote ? (
        <Text style={styles.footnote} numberOfLines={2}>
          {content.footnote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingTop: 4,
  },
  footnote: {
    fontSize: 11,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 16,
  },
});
