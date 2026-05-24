import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { getCategoryIcon } from '@/features/events/utils/eventPresentation';
import { EventCard } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type EventVisualBannerProps = {
  event: EventCard;
  height?: number;
};

export function EventVisualBanner({ event, height = 160 }: EventVisualBannerProps) {
  const icon = getCategoryIcon(event.category);

  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.sky} />
      <View style={styles.ground} />
      <View style={styles.scene}>
        <View style={styles.truck}>
          <Ionicons name="bus-outline" size={36} color={colors.primary} />
        </View>
        <View style={styles.bin}>
          <Ionicons name={icon} size={42} color={colors.success} />
        </View>
        <View style={styles.bags}>
          <Ionicons name="cube-outline" size={20} color={colors.warning} />
          <Ionicons name="cube-outline" size={16} color={colors.warning} />
        </View>
      </View>
      <View style={styles.tags}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{event.district}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{event.category}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#E8F4F3',
    position: 'relative',
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D4EBE9',
    height: '55%',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: '#C5DDD9',
  },
  scene: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  truck: {
    opacity: 0.85,
    marginBottom: spacing.sm,
  },
  bin: {
    marginBottom: spacing.xs,
  },
  bags: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  tags: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
