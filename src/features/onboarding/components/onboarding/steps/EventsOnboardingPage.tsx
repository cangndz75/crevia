import { StyleSheet, View } from 'react-native';

import { EventCard } from '@/features/onboarding/components/onboarding/EventCard';

type EventsOnboardingPageProps = {
  selectedDecisionId: string | null;
  onSelectDecision: (id: string) => void;
};

export function EventsOnboardingPage({
  selectedDecisionId,
  onSelectDecision,
}: EventsOnboardingPageProps) {
  return (
    <View style={styles.wrap}>
      <EventCard
        selectedDecisionId={selectedDecisionId}
        onSelectDecision={onSelectDecision}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingBottom: 10,
  },
});
