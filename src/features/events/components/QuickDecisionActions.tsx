import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DecisionOptionCard } from '@/features/events/components/DecisionOptionCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import type { EventCard } from '@/core/models/EventCard';
import type { ResolvedQuickAction } from '@/features/events/utils/eventDetailDecisionUtils';
import { buildQuickDecisionCardItems } from '@/features/events/utils/decisionOptionCardIntegration';

type QuickDecisionActionsProps = {
  event: EventCard;
  actions: ResolvedQuickAction[];
  selectedDecisionId: string | null;
  onSelect: (decisionId: string) => void;
  affordabilityByDecisionId?: Record<string, DecisionAffordabilityCheck>;
  variant?: 'quick' | 'compact';
  sectionTitle?: string;
};

const QUICK_CARD_WIDTH = 148;

export function QuickDecisionActions({
  event,
  actions,
  selectedDecisionId,
  onSelect,
  affordabilityByDecisionId,
  variant = 'quick',
  sectionTitle = 'Kaynak seçimi',
}: QuickDecisionActionsProps) {
  const items = buildQuickDecisionCardItems(
    event,
    actions,
    affordabilityByDecisionId,
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {sectionTitle}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {items.map((item) => (
          <DecisionOptionCard
            key={item.decisionId}
            event={event}
            decision={item.decision}
            selected={selectedDecisionId === item.decisionId}
            onSelect={() => onSelect(item.decisionId)}
            affordability={item.affordability}
            variant={variant}
            containerStyle={styles.cardWrap}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    gap: 10,
  },
  sectionTitle: {
    paddingHorizontal: eventDetail.screenPadding,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: eventDetail.tealDark,
  },
  row: {
    paddingHorizontal: eventDetail.screenPadding,
    gap: 10,
    paddingBottom: 2,
  },
  cardWrap: {
    width: QUICK_CARD_WIDTH,
  },
});
