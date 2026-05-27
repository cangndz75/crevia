import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { SocialSideTopic } from '../utils/socialUiModel';

type Props = {
  topics: [SocialSideTopic, SocialSideTopic];
  onAction?: (topicId: string) => void;
};

const VARIANT_STYLES = {
  rumor: {
    borderColor: colors.purple,
    iconBg: colors.purpleMuted,
    iconColor: colors.purple,
    icon: 'alert-circle-outline' as const,
    ctaBg: colors.purple,
    metricColor: colors.danger,
  },
  praise: {
    borderColor: colors.success,
    iconBg: colors.successMuted,
    iconColor: colors.success,
    icon: 'heart-outline' as const,
    ctaBg: colors.primary,
    metricColor: colors.success,
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SideTopicCard({
  topic,
  onPress,
}: {
  topic: SocialSideTopic;
  onPress?: () => void;
}) {
  const v = VARIANT_STYLES[topic.variant];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.card,
        shadows.soft,
        { borderColor: v.borderColor, borderLeftWidth: 3 },
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      accessibilityRole="button">
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: v.iconBg }]}>
          <Ionicons name={v.icon} size={14} color={v.iconColor} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {topic.title}
        </Text>
      </View>

      <Text style={styles.cardText} numberOfLines={2}>
        {topic.text}
      </Text>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>{topic.metricLabel}</Text>
        <Text style={[styles.metricValue, { color: v.metricColor }]}>
          {topic.metricValue}
        </Text>
      </View>

      <View style={[styles.ctaBtn, { backgroundColor: v.ctaBg }]}>
        <Text style={styles.ctaText} numberOfLines={1}>
          {topic.ctaLabel}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function SocialSideTopicCards({ topics, onAction }: Props) {
  return (
    <View style={styles.row}>
      {topics.map((t) => (
        <SideTopicCard
          key={t.id}
          topic={t}
          onPress={() => onAction?.(t.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  cardText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  ctaBtn: {
    paddingVertical: 6,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
