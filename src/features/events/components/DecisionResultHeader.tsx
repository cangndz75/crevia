import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { getDistrictEventTypeLabel } from '@/features/events/utils/eventDecisionPresentation';

type DecisionResultHeaderProps = {
  day: number;
  neighborhoodName?: string;
  eventType?: string;
  onClose: () => void;
};

export function DecisionResultHeader({
  day,
  neighborhoodName,
  eventType,
  onClose,
}: DecisionResultHeaderProps) {
  const insets = useSafeAreaInsets();
  const subtitle =
    neighborhoodName?.trim() ||
    getDistrictEventTypeLabel(eventType) ||
    'Operasyon sonucu';

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) + 2 }]}>
      <View style={styles.sideSlot}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Merkeze dön">
          <Ionicons name="chevron-back" size={20} color={eventDetail.tealDark} />
          <Text style={styles.backLabel} numberOfLines={1}>
            Merkez
          </Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          Operasyon Sonucu
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.sideSlot}>
        <View style={styles.dayChip}>
          <Text style={styles.dayChipText} numberOfLines={1}>
            Gün {day}
          </Text>
        </View>
      </View>
    </View>
  );
}

export { DecisionResultHeader as EventResultTopBar };

const SIDE_SLOT_WIDTH = 88;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  sideSlot: {
    width: SIDE_SLOT_WIDTH,
    minWidth: 0,
    flexShrink: 0,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    minWidth: 0,
    flexShrink: 1,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.teal,
    flexShrink: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textMuted,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  dayChip: {
    alignSelf: 'flex-end',
    backgroundColor: eventDetail.mint,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 0,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
});
