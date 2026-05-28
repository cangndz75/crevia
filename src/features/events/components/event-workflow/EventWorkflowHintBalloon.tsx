import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type EventWorkflowHintBalloonProps = {
  text: string;
};

export function EventWorkflowHintBalloon({ text }: EventWorkflowHintBalloonProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bubble}>
        <Ionicons name="sparkles" size={14} color={eventDetail.teal} />
        <Text style={styles.text}>{text}</Text>
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: eventDetail.mint,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
    maxWidth: '100%',
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.tealDark,
    lineHeight: 17,
  },
  tail: {
    width: 12,
    height: 12,
    backgroundColor: eventDetail.mint,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
  },
});
