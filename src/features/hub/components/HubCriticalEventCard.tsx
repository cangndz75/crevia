import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getRiskLevelLabel } from '@/core/content/mockGameData';
import { deriveCrisisQueue } from '@/features/hub/utils/hubDerived';
import { getCategoryIcon } from '@/features/events/utils/eventPresentation';
import { selectActiveEvents, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function HubCriticalEventCard() {
  const router = useRouter();
  const activeEvents = useGameStore(selectActiveEvents);
  const featuredId = useGameStore((s) => s.gameState.featuredEventId);
  const advisorBody = useGameStore((s) => s.gameState.eventAdvisor.body);

  const event = useMemo(() => {
    const featured = activeEvents.find((e) => e.id === featuredId);
    if (featured) return featured;
    const queue = deriveCrisisQueue(activeEvents);
    return queue[0]?.event ?? null;
  }, [activeEvents, featuredId]);

  if (!event) {
    return (
      <View style={[styles.card, styles.emptyCard, shadows.card]}>
        <Ionicons name="shield-checkmark" size={32} color={colors.success} />
        <Text style={styles.emptyTitle}>Kritik olay yok</Text>
        <Text style={styles.emptySub}>Bölge şu an sakin görünüyor.</Text>
      </View>
    );
  }

  const { previewEffects } = event;
  const satPositive = previewEffects.publicSatisfaction >= 0;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.priorityBar}>
        <Ionicons name="warning" size={14} color={colors.textInverse} />
        <Text style={styles.priorityText}>Günün Kritik Olayı</Text>
        <View style={styles.priorityTag}>
          <Text style={styles.priorityTagText}>Yüksek Öncelik</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.mainCol}>
          <View style={styles.titleRow}>
            <View style={styles.catIcon}>
              <Ionicons
                name={getCategoryIcon(event.category)}
                size={18}
                color={colors.warning}
              />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.location}>{event.district}</Text>
            </View>
          </View>

          <View style={styles.speechBubble}>
            <Text style={styles.speechText} numberOfLines={2}>
              {advisorBody.split('.')[0] ?? 'Bu konu acil çözülmeli.'}
            </Text>
          </View>

          <View style={styles.impacts}>
            <View style={[styles.impact, { backgroundColor: colors.successMuted }]}>
              <Text style={[styles.impactText, { color: colors.success }]}>
                {satPositive ? '+' : ''}
                {previewEffects.publicSatisfaction} Memnuniyet
              </Text>
            </View>
            <View style={[styles.impact, { backgroundColor: colors.dangerMuted }]}>
              <Text style={[styles.impactText, { color: colors.danger }]}>
                {previewEffects.budget < 0
                  ? `-₺${Math.abs(previewEffects.budget).toLocaleString('tr-TR')}`
                  : `₺${previewEffects.budget}`}{' '}
                Bütçe
              </Text>
            </View>
            <View style={[styles.impact, { backgroundColor: colors.warningMuted }]}>
              <Text style={[styles.impactText, { color: colors.warning }]}>
                {previewEffects.risk > 0 ? '+' : ''}
                {previewEffects.risk} Risk
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push(`/events/${event.id}`)}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={styles.ctaText}>Karar Ver ›</Text>
          </Pressable>
        </View>

        <View style={styles.illustration}>
          <View style={styles.dumpster} />
          <View style={styles.dumpsterLid} />
          <Text style={styles.riskLabel}>
            {getRiskLevelLabel(event.riskLevel)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priorityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  priorityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  priorityTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  body: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  mainCol: {
    flex: 1,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  location: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  speechBubble: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speechText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  impacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  impact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: '#2C2C2E',
    borderRadius: radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
  illustration: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dumpster: {
    width: 48,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.success,
    opacity: 0.85,
  },
  dumpsterLid: {
    width: 52,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginTop: -4,
    opacity: 0.6,
  },
  riskLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
});
