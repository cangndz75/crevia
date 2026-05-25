import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { EventCard } from '@/core/models/EventCard';
import { EVENT_SEVERITY } from '@/core/utils/eventPriority';
import { deriveCrisisQueue } from '@/features/hub/utils/hubDerived';
import { selectActiveEvents, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type RiskLevel = EventCard['riskLevel'];

const SEVERITY_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  critical: { color: colors.danger, bg: colors.dangerMuted, label: 'KRİTİK' },
  high: { color: colors.warning, bg: colors.warningMuted, label: 'YÜKSEK' },
  medium: { color: colors.secondary, bg: colors.secondaryMuted, label: 'ORTA' },
  low: { color: colors.success, bg: colors.successMuted, label: 'DÜŞÜK' },
};

function EventSlotRow({
  event,
  index,
  onPress,
}: {
  event: EventCard;
  index: number;
  onPress: () => void;
}) {
  const config = SEVERITY_CONFIG[event.riskLevel];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.slot, pressed && styles.slotPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${event.title} olayına git`}>
      <View style={[styles.indexBadge, { borderColor: config.color }]}>
        <Text style={[styles.indexText, { color: config.color }]}>{index + 1}</Text>
      </View>
      <View style={[styles.eventIcon, { backgroundColor: config.bg }]}>
        <Ionicons name="alert-circle" size={18} color={config.color} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.slotTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.slotSub} numberOfLines={1}>
          {event.district} · öncelik {EVENT_SEVERITY[event.riskLevel]}
        </Text>
      </View>
      <View style={[styles.severityChip, { backgroundColor: config.bg }]}>
        <Text style={[styles.severityText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    </Pressable>
  );
}

export function CrisisQueuePreview() {
  const router = useRouter();
  const activeEvents = useGameStore(selectActiveEvents);
  const queue = useMemo(
    () => deriveCrisisQueue(activeEvents),
    [activeEvents],
  );

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>GÖREVDEKİ OLAYLAR</Text>
        <Text style={styles.sectionTitle}>Öncelik Kuyruğu</Text>
        <Text style={styles.sectionSubtitle}>
          Aktif olaylar görünürlük ve şiddete göre sıralı
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {queue.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-checkmark" size={32} color={colors.success} />
            <Text style={styles.emptyText}>Kritik bekleyen olay yok</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {queue.map(({ event }, idx) => (
              <EventSlotRow
                key={event.id}
                event={event}
                index={idx}
                onPress={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </View>
        )}

        {/* Footer CTA */}
        <Pressable
          onPress={() => router.push('/events')}
          style={({ pressed }) => [
            styles.footerCta,
            pressed && styles.footerCtaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Olay merkezine git">
          <Text style={styles.footerCtaText}>Olay merkezine git →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  list: {
    gap: spacing.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slotPressed: {
    opacity: 0.85,
  },
  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  slotSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  severityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  footerCtaPressed: {
    opacity: 0.85,
  },
  footerCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
