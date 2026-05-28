import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EventLifecycleMeta } from '@/core/liveFlow';
import { getResolvedCardColors } from '@/core/liveFlow/liveFlowPresentation';
import type { EventCard } from '@/core/models/EventCard';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  event: EventCard;
  lifecycle: EventLifecycleMeta;
  decisionRecord?: DecisionRecord;
  onBackToHub?: () => void;
};

export function ResolvedEventSummaryCard({
  event,
  lifecycle,
  decisionRecord,
  onBackToHub,
}: Props) {
  const router = useRouter();
  const palette = getResolvedCardColors(lifecycle.tone);

  const goResult = () => {
    router.push('/events/decision-result');
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(280).springify().damping(20)}
      style={[
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: palette.badgeBg }]}>
          <Ionicons name="checkmark-circle" size={16} color={palette.badgeText} />
          <Text style={[styles.badgeText, { color: palette.badgeText }]}>
            {lifecycle.label || 'Sonuçlandı'}
          </Text>
        </View>
        <View style={[styles.doneChip, { borderColor: palette.border }]}>
          <Ionicons name="checkmark" size={12} color={palette.badgeText} />
          <Text style={[styles.doneChipText, { color: palette.badgeText }]}>
            Tamamlandı
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{event.title}</Text>

      {decisionRecord ? (
        <Text style={styles.decision} numberOfLines={2}>
          Seçilen karar: {decisionRecord.decisionLabel}
        </Text>
      ) : null}

      <Text style={styles.summary} numberOfLines={3}>
        {lifecycle.summaryText ??
          'Bu olay gün içinde çözüldü. Detaylar gün sonu raporuna yansıyacak.'}
      </Text>

      <View style={styles.actions}>
        <GameButton
          title={lifecycle.ctaLabel ?? 'Sonucu Gör'}
          onPress={goResult}
          variant="primary"
        />
        <GameButton
          title="Merkeze Dön"
          onPress={onBackToHub ?? (() => router.replace('/'))}
          variant="secondary"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  doneChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  decision: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
