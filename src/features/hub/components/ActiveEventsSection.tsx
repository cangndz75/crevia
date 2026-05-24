import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  getRiskChipTone,
  getRiskLevelLabel,
  mockGameData,
} from '@/core/content/mockGameData';
import { getCategoryIcon } from '@/features/events/utils/eventPresentation';
import { EventCard } from '@/core/models/EventCard';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

function EventPreviewCard({ event }: { event: EventCard }) {
  const router = useRouter();
  const { previewEffects } = event;
  const publicColor =
    previewEffects.publicSatisfaction >= 0
      ? colors.success
      : colors.danger;
  const publicPrefix =
    previewEffects.publicSatisfaction >= 0 ? '↑' : '↓';
  const riskPrefix = previewEffects.risk >= 0 ? '↑' : '↓';

  return (
    <GameCard padding="lg" style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventHeaderLeft}>
          <View style={styles.eventIcon}>
            <Ionicons
              name={getCategoryIcon(event.category)}
              size={20}
              color={colors.danger}
            />
          </View>
          <View style={styles.tags}>
            <GameChip
              label={event.category.toUpperCase()}
              tone="neutral"
            />
            <GameChip
              label={getRiskLevelLabel(event.riskLevel)}
              tone={getRiskChipTone(event.riskLevel)}
            />
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </View>

      <Text style={typography.subtitle}>{event.title}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={typography.caption}>{event.district}</Text>
      </View>
      <Text style={[typography.caption, styles.description]} numberOfLines={2}>
        {event.description}
      </Text>

      <View style={styles.impacts}>
        <View style={[styles.impactBadge, styles.impactPublic]}>
          <Text style={[styles.impactText, { color: publicColor }]}>
            {publicPrefix} Halk {previewEffects.publicSatisfaction}
          </Text>
        </View>
        <View style={[styles.impactBadge, styles.impactRisk]}>
          <Text style={styles.impactRiskText}>
            {riskPrefix} Risk +{Math.abs(previewEffects.risk)}
          </Text>
        </View>
        <View style={[styles.impactBadge, styles.impactXp]}>
          <Ionicons name="star" size={11} color={colors.warning} />
          <Text style={styles.impactXpText}>XP +{previewEffects.xp}</Text>
        </View>
      </View>

      <GameButton
        title="Karar Ver"
        onPress={() => router.push(`/events/${event.id}`)}
        style={styles.cta}
      />
    </GameCard>
  );
}

export function ActiveEventsSection() {
  const events = mockGameData.events;

  return (
    <View>
      <SectionHeader
        title="Kararı sen ver"
        subtitle="Sonuçlar memnuniyet, moral ve riske doğrudan yansır"
        icon="flash"
        iconColor={colors.danger}
        trailing={
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{events.length}</Text>
          </View>
        }
      />
      <View style={styles.list}>
        {events.map((event) => (
          <EventPreviewCard key={event.id} event={event} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
  },
  list: {
    gap: spacing.md,
  },
  eventCard: {
    gap: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  description: {
    lineHeight: 18,
  },
  impacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  impactPublic: {
    backgroundColor: colors.dangerMuted,
  },
  impactRisk: {
    backgroundColor: colors.warningMuted,
  },
  impactXp: {
    backgroundColor: colors.warningMuted,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '600',
  },
  impactRiskText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  impactXpText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  cta: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
