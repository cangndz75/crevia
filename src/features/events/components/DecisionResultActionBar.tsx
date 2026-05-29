import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EVENT_RESULT_COPY } from '@/features/events/utils/eventResultPresentation';
import { GameButton } from '@/ui/components/GameButton';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type DecisionResultActionBarProps = {
  primaryLabel: string;
  onPrimaryPress: () => void;
  onGoHub?: () => void;
};

export function DecisionResultActionBar({
  primaryLabel,
  onPrimaryPress,
}: DecisionResultActionBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + 8;

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <Text style={styles.kicker} numberOfLines={1}>
        {EVENT_RESULT_COPY.nextStepLabel}
      </Text>
      <GameButton title={primaryLabel} onPress={onPrimaryPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
    paddingTop: 10,
    gap: 8,
    backgroundColor: eventDetail.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.08)',
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
