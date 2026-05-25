import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveLiveOpsPulse } from '@/features/hub/utils/hubDerived';
import { OpsPulseStatus } from '@/core/models/OperationsBrief';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const lineIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  day: 'calendar-outline',
  active: 'flash-outline',
  solved: 'checkmark-circle-outline',
  morale: 'people-outline',
  budget: 'wallet-outline',
};

const statusColors: Record<OpsPulseStatus, string> = {
  steady: colors.success,
  watch: colors.warning,
  hot: colors.danger,
};

const statusLabels: Record<OpsPulseStatus, string> = {
  steady: 'stabil',
  watch: 'dikkat',
  hot: 'sıcak',
};

function PulseDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.3, { duration: 900 }), -1, true);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.success,
        },
        animStyle,
      ]}
    />
  );
}

function MiniCard({
  id,
  headline,
  detail,
  status,
  index,
}: {
  id: string;
  headline: string;
  detail: string;
  status: OpsPulseStatus;
  index: number;
}) {
  const accent = statusColors[status];
  const icon = lineIcons[id] ?? 'ellipse-outline';

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400)}
      style={[styles.miniCard, shadows.soft]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.miniCardBody}>
        <View style={[styles.iconCircle, { backgroundColor: `${accent}18` }]}>
          <Ionicons name={icon} size={15} color={accent} />
        </View>
        <Text style={styles.miniHeadline} numberOfLines={1}>
          {headline}
        </Text>
        <Text style={styles.miniDetail} numberOfLines={2}>
          {detail}
        </Text>
        <View style={styles.miniPillRow}>
          <View style={[styles.miniPill, { backgroundColor: `${accent}14` }]}>
            <View
              style={[styles.miniPillDot, { backgroundColor: accent }]}
            />
            <Text style={[styles.miniPillText, { color: accent }]}>
              {statusLabels[status]}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export function LiveOpsPulseStrip() {
  const input = useHubDerivedInput();
  const lines = useMemo(() => deriveLiveOpsPulse(input), [input]);

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>OPERASYON TAKİBİ</Text>
          <PulseDot />
        </View>
        <Text style={styles.title}>Anlık Operasyon Durumu</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {lines.map((item, i) => (
          <MiniCard
            key={item.id}
            id={item.id}
            headline={item.headline}
            detail={item.detail}
            status={item.status}
            index={i}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  header: {
    paddingHorizontal: spacing.lg,
    gap: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  miniCard: {
    width: 140,
    height: 90,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  miniCardBody: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  miniHeadline: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  miniDetail: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  miniPillRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  miniPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  miniPillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
