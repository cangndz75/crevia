import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { EventOpportunity } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type OpportunityEventCardProps = {
  opportunity: EventOpportunity;
};

export function OpportunityEventCard({ opportunity }: OpportunityEventCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.iconWrap}>
        <Ionicons name="people" size={24} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{opportunity.title}</Text>
        <Text style={styles.description}>{opportunity.description}</Text>
        <View style={styles.xpBadge}>
          <Ionicons name="heart" size={12} color={colors.purple} />
          <Text style={styles.xpText}>XP +{opportunity.xpReward}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#E0F2F1',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  description: {
    ...typography.caption,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.purple,
    backgroundColor: colors.surface,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.purple,
  },
});
