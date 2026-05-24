import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getCategoryIcon,
  getRiskLevelColor,
  getRiskLevelMuted,
} from '@/features/events/utils/eventPresentation';
import {
  formatUrgencyLabel,
  getRiskLevelLabel,
} from '@/core/content/mockGameData';
import { EventCard } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type ActiveEventCompactCardProps = {
  event: EventCard;
};

export function ActiveEventCompactCard({ event }: ActiveEventCompactCardProps) {
  const router = useRouter();
  const accent = getRiskLevelColor(event.riskLevel);
  const muted = getRiskLevelMuted(event.riskLevel);
  const icon = getCategoryIcon(event.category);

  return (
    <Pressable
      onPress={() => router.push(`/events/${event.id}`)}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={[styles.iconWrap, { backgroundColor: muted }]}>
        <Ionicons name="warning-outline" size={20} color={accent} />
        <View style={styles.iconOverlay}>
          <Ionicons name={icon} size={12} color={accent} />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={typography.subtitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.time}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.timeText}>
              {formatUrgencyLabel(event.urgencyHours)}
            </Text>
          </View>
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {event.district} · {getRiskLevelLabel(event.riskLevel)} Risk
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.94,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    marginVertical: spacing.sm,
    marginLeft: 0,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sub: {
    ...typography.caption,
    fontSize: 12,
  },
});
