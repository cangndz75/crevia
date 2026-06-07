import { StyleSheet, View } from 'react-native';

import { EventCard } from '@/features/onboarding/components/onboarding/EventCard';
import { TutorialEventPreviewCard } from '@/features/onboarding/components/onboarding/TutorialEventPreviewCard';

type EventsOnboardingPageProps = {
  selectedDecisionId: string | null;
  onSelectDecision: (id: string) => void;
  compact?: boolean;
};

export function EventsOnboardingPage({
  selectedDecisionId,
  onSelectDecision,
  compact = false,
}: EventsOnboardingPageProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <TutorialEventPreviewCard compact={compact} />
      <EventCard
        compact={compact}
        selectedDecisionId={selectedDecisionId}
        onSelectDecision={onSelectDecision}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 12,
    paddingBottom: 10,
  },
  wrapCompact: {
    gap: 8,
    paddingBottom: 4,
  },
});
