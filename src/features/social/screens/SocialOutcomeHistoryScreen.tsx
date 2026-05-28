import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  selectSocialPulseStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { SocialSubpageHeader } from '../components/SocialSubpageHeader';
import { buildSocialPulseUiBundle } from '../utils/socialUiMappers';
import type { SocialOutcomeItem } from '../utils/socialUiModel';

function formatDelta(delta: number): { text: string; positive: boolean } {
  const rounded = Math.round(delta);
  if (rounded > 0) return { text: `+${rounded}`, positive: true };
  if (rounded < 0) return { text: `${rounded}`, positive: false };
  return { text: '0', positive: false };
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'positive' | 'negative';
}) {
  const toneStyle =
    tone === 'positive'
      ? { bg: colors.primaryMuted, fg: colors.primary }
      : tone === 'negative'
        ? { bg: colors.dangerMuted, fg: colors.danger }
        : { bg: colors.backgroundAlt, fg: colors.textPrimary };

  return (
    <View style={[statStyles.card, { backgroundColor: toneStyle.bg }]}>
      <Text style={[statStyles.value, { color: toneStyle.fg }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.6)',
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

function OutcomeTimelineCard({
  item,
  index,
}: {
  item: SocialOutcomeItem;
  index: number;
}) {
  const delta = formatDelta(item.delta);

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(320)}>
      <View style={styles.timelineRow}>
        <View style={styles.timelineRail}>
          <View style={styles.timelineDot} />
          {index > 0 ? <View style={styles.timelineLineTop} /> : null}
          <View style={styles.timelineLineBottom} />
        </View>

        <View style={[styles.outcomeCard, shadows.soft]}>
          <View style={styles.outcomeHeader}>
            <View style={styles.iconSquare}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.outcomeBody}>
              <Text style={styles.outcomeLabel}>{item.label}</Text>
              <Text style={styles.outcomeTime}>{item.timeAgo}</Text>
            </View>
            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor: delta.positive
                    ? colors.primaryMuted
                    : colors.dangerMuted,
                },
              ]}>
              <Ionicons
                name={delta.positive ? 'trending-up' : 'trending-down'}
                size={12}
                color={delta.positive ? colors.primary : colors.danger}
              />
              <Text
                style={[
                  styles.deltaText,
                  { color: delta.positive ? colors.primary : colors.danger },
                ]}>
                {delta.text} Nabız
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export function SocialOutcomeHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const socialPulseState = useGameStore(selectSocialPulseStateFromStore);
  const currentDay = useGameStore((s) => s.gameState.city.day);

  const { outcomes } = useMemo(
    () => buildSocialPulseUiBundle(socialPulseState, currentDay),
    [socialPulseState, currentDay],
  );

  const items = Array.isArray(outcomes) ? outcomes : [];
  const positiveCount = items.filter((o) => o.delta > 0).length;
  const negativeCount = items.filter((o) => o.delta < 0).length;

  return (
    <View style={styles.root}>
      <SocialSubpageHeader
        accent="teal"
        title="Sonuç Geçmişi"
        subtitle="Sosyal kararların nabız üzerindeki etkileri"
        badge={items.length > 0 ? `${items.length} kayıt` : undefined}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <SummaryStat label="Toplam kayıt" value={String(items.length)} tone="neutral" />
          <SummaryStat label="Olumlu etki" value={String(positiveCount)} tone="positive" />
          <SummaryStat label="Olumsuz etki" value={String(negativeCount)} tone="negative" />
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Henüz sonuç yok</Text>
            <Text style={styles.emptyBody}>
              Açıklama yap, ekip yönlendir veya sessiz kal — her karar burada
              listelenir.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              <OutcomeTimelineCard key={item.id} item={item} index={index} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.hubCream,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineRail: {
    width: 16,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryMuted,
    marginTop: 18,
    zIndex: 2,
  },
  timelineLineTop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 18,
    backgroundColor: colors.border,
  },
  timelineLineBottom: {
    position: 'absolute',
    top: 28,
    bottom: -8,
    width: 2,
    backgroundColor: colors.border,
  },
  outcomeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.8)',
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  outcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconSquare: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  outcomeBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  outcomeLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  outcomeTime: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
