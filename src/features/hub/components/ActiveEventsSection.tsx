import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getRiskChipTone, getRiskLevelLabel } from '@/core/content/mockGameData';
import { EventCard, EventRiskLevel } from '@/core/models/EventCard';
import { getCategoryIcon } from '@/features/events/utils/eventPresentation';
import { selectActiveEvents, useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const riskAccentColors: Record<EventRiskLevel, string> = {
  critical: colors.danger,
  high: colors.warning,
  medium: colors.secondary,
  low: colors.success,
};

const toneColors: Record<string, { bg: string; text: string }> = {
  success: { bg: colors.successMuted, text: colors.success },
  warning: { bg: colors.warningMuted, text: colors.warning },
  danger: { bg: colors.dangerMuted, text: colors.danger },
  info: { bg: colors.secondaryMuted, text: colors.secondary },
};

function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    altyapı: colors.secondaryMuted,
    güvenlik: colors.dangerMuted,
    sağlık: colors.successMuted,
    ulaşım: colors.warningMuted,
    çevre: colors.primaryMuted,
  };
  return map[category.toLowerCase()] ?? colors.purpleMuted;
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    altyapı: colors.secondary,
    güvenlik: colors.danger,
    sağlık: colors.success,
    ulaşım: colors.warning,
    çevre: colors.primary,
  };
  return map[category.toLowerCase()] ?? colors.purple;
}

function EventPreviewCard({
  event,
  index,
}: {
  event: EventCard;
  index: number;
}) {
  const router = useRouter();
  const { previewEffects } = event;
  const accentColor = riskAccentColors[event.riskLevel];
  const tone = getRiskChipTone(event.riskLevel);
  const toneStyle = toneColors[tone] ?? toneColors.info;
  const catColor = getCategoryColor(event.category);
  const catBg = getCategoryBg(event.category);

  const publicPositive = previewEffects.publicSatisfaction >= 0;
  const publicColor = publicPositive ? colors.success : colors.danger;
  const publicBg = publicPositive ? colors.successMuted : colors.dangerMuted;
  const publicArrow = publicPositive ? '↑' : '↓';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100)
        .duration(400)
        .springify()}
      style={styles.card}>
      <View style={[styles.topStrip, { backgroundColor: accentColor }]} />

      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.catIcon, { backgroundColor: catBg }]}>
              <Ionicons
                name={getCategoryIcon(event.category)}
                size={18}
                color={catColor}
              />
            </View>
            <View style={[styles.chip, { backgroundColor: catBg }]}>
              <Text style={[styles.chipText, { color: catColor }]}>
                {event.category.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: toneStyle.bg }]}>
              <Text style={[styles.chipText, { color: toneStyle.text }]}>
                {getRiskLevelLabel(event.riskLevel)}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.locationText}>{event.district}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.impacts}>
          <View style={[styles.impactBadge, { backgroundColor: publicBg }]}>
            <Text style={[styles.impactText, { color: publicColor }]}>
              {publicArrow} Halk {previewEffects.publicSatisfaction}
            </Text>
          </View>
          <View
            style={[
              styles.impactBadge,
              { backgroundColor: colors.warningMuted },
            ]}>
            <Text style={[styles.impactText, { color: colors.warning }]}>
              Risk +{Math.abs(previewEffects.risk)}
            </Text>
          </View>
          <View
            style={[
              styles.impactBadge,
              { backgroundColor: colors.warningMuted },
            ]}>
            <Ionicons name="star" size={11} color={colors.warning} />
            <Text style={[styles.impactText, { color: colors.warning }]}>
              +{previewEffects.xp} XP
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push(`/events/${event.id}`)}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
          ]}>
          <Text style={styles.ctaText}>Karar Ver →</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function ActiveEventsSection() {
  const events = useGameStore(selectActiveEvents);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>KARAR BEKLİYOR</Text>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Kararı Sen Ver</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{events.length}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Sonuçlar memnuniyet, moral ve riske doğrudan yansır
        </Text>
      </View>

      <View style={styles.list}>
        {events.map((event, i) => (
          <EventPreviewCard key={event.id} event={event} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  list: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  topStrip: {
    height: 4,
  },
  cardContent: {
    padding: spacing.lg,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  impacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
