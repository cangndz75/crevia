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
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) + 4 }]}>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Merkeze dön">
        <Ionicons name="close" size={22} color={eventDetail.tealDark} />
        <Text style={styles.closeLabel}>Merkez</Text>
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title}>Karar Sonucu</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.dayChip}>
        <Text style={styles.dayChipText}>Gün {day}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: eventDetail.screenPadding,
    paddingBottom: 12,
    gap: 8,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 4,
    minWidth: 72,
  },
  closeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.teal,
  },
  pressed: {
    opacity: 0.7,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textMuted,
    textAlign: 'center',
  },
  dayChip: {
    backgroundColor: eventDetail.mint,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
});
