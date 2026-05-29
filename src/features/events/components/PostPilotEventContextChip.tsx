import { StyleSheet, Text, View } from 'react-native';

import { buildPostPilotEventContextLabelForGameState } from '@/core/postPilot/postPilotOperationUxPresentation';
import type { EventCard } from '@/core/models/EventCard';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

type Props = {
  event: EventCard;
};

export function PostPilotEventContextChip({ event }: Props) {
  const label = useGameStore((s) =>
    buildPostPilotEventContextLabelForGameState(event, s.gameState),
  );

  if (!label) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(26, 143, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.22)',
    flexShrink: 1,
    minWidth: 0,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.15,
  },
});
