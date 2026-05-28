import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton } from '@/ui/components/GameButton';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type DecisionResultActionBarProps = {
  onGoHub: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
};

export function DecisionResultActionBar({
  onGoHub,
  secondaryLabel,
  onSecondaryPress,
}: DecisionResultActionBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + 8;

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <GameButton title="Merkeze Dön" onPress={onGoHub} />
      {secondaryLabel && onSecondaryPress ? (
        <GameButton
          title={secondaryLabel}
          onPress={onSecondaryPress}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
    paddingTop: 12,
    gap: 10,
    backgroundColor: eventDetail.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.08)',
  },
});
