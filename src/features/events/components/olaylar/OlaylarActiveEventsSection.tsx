import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarActiveEventView } from '@/features/events/types/olaylarScreenTypes';

type OlaylarActiveEventsSectionProps = {
  items: OlaylarActiveEventView[];
  onItemPress?: (id: string) => void;
  onSeeAll?: () => void;
};

const TONE_COLORS = {
  critical: olaylar.critical,
  urgent: olaylar.urgent,
  active: olaylar.active,
  resolved: olaylar.success,
} as const;

const TONE_BG = {
  critical: olaylar.criticalBg,
  urgent: olaylar.urgentBg,
  active: olaylar.activeBg,
  resolved: olaylar.successBg,
} as const;

function ActiveEventCard({
  item,
  onPress,
}: {
  item: OlaylarActiveEventView;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button">
      <View style={[styles.iconWrap, { backgroundColor: TONE_BG[item.tone] }]}>
        <Ionicons name="alert-circle" size={18} color={TONE_COLORS[item.tone]} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.location} numberOfLines={1}>
        {item.location}
      </Text>

      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={12} color={olaylar.textMuted} />
        <Text style={styles.timeText}>{item.timeLeft}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${item.progress}%`,
              backgroundColor: TONE_COLORS[item.tone],
            },
          ]}
        />
      </View>

      <View style={[styles.statusPill, { backgroundColor: TONE_BG[item.tone] }]}>
        <Text style={[styles.statusText, { color: TONE_COLORS[item.tone] }]}>
          {item.statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export function OlaylarActiveEventsSection({
  items,
  onItemPress,
  onSeeAll,
}: OlaylarActiveEventsSectionProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>AKTİF OLAYLAR</Text>
        <Pressable
          onPress={onSeeAll}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Tümünü Gör">
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
          <Ionicons name="chevron-forward" size={14} color={olaylar.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {items.map((item) => (
          <ActiveEventCard
            key={item.id}
            item={item}
            onPress={() => onItemPress?.(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: olaylar.textSoft,
    letterSpacing: 0.6,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  card: {
    width: 168,
    backgroundColor: olaylar.card,
    borderRadius: olaylar.radiusCard,
    borderWidth: 1,
    borderColor: olaylar.border,
    padding: 12,
    gap: 6,
    ...olaylar.shadowSoft,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: olaylar.text,
    lineHeight: 18,
    minHeight: 36,
  },
  location: {
    fontSize: 12,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: olaylar.textSoft,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
