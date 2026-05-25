import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { COMING_SOON_SYSTEMS } from '@/core/content/progressionRoadmap';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function ComingSoonAuthorityGrid() {
  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Yakında Açılacak Sistemler"
        subtitle="Oyun büyüdükçe yeni yönetim araçları devreye girer."
        icon="rocket-outline"
        iconColor={colors.purple}
      />

      <View style={styles.grid}>
        {COMING_SOON_SYSTEMS.map((item) => (
          <View key={item.id} style={[styles.card, shadows.soft]}>
            <View style={styles.cardTop}>
              <View style={styles.iconBadge}>
                <Ionicons name={item.icon} size={18} color={colors.purple} />
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonText}>Yakında</Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardDesc} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 120,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.purpleMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonBadge: {
    backgroundColor: colors.purpleMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  soonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purple,
  },
  cardTitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  cardDesc: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
});
