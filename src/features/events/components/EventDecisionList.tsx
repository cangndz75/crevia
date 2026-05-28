import { StyleSheet, Text, View } from 'react-native';

import { DecisionOptionCard } from '@/features/events/components/DecisionOptionCard';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import type { EventCard } from '@/core/models/EventCard';
import { buildEventDetailDecisionListItems } from '@/features/events/utils/decisionOptionCardIntegration';
import type { DecisionOptionCardVariant } from '@/features/events/utils/decisionTradeoffPresentation';

type EventDecisionListProps = {
  event: EventCard;
  selectedDecisionId: string | null;
  onSelect: (decisionId: string) => void;
  affordabilityByDecisionId?: Record<string, DecisionAffordabilityCheck>;
  excludeDecisionIds?: string[];
  variant?: DecisionOptionCardVariant;
  title?: string;
};

export function EventDecisionList({
  event,
  selectedDecisionId,
  onSelect,
  affordabilityByDecisionId,
  excludeDecisionIds,
  variant = 'full',
  title = 'STRATEJİK KARARLAR',
}: EventDecisionListProps) {
  const items = buildEventDetailDecisionListItems(event, {
    excludeDecisionIds,
    affordabilityByDecisionId,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.list}>
        {items.map((item) => (
          <DecisionOptionCard
            key={item.decisionId}
            event={event}
            decision={item.decision}
            selected={selectedDecisionId === item.decisionId}
            onSelect={() => onSelect(item.decisionId)}
            affordability={item.affordability}
            variant={variant}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    paddingHorizontal: eventDetail.screenPadding,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: eventDetail.textMuted,
  },
  list: {
    gap: 10,
  },
});
