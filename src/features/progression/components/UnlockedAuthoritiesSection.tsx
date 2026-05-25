import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DerivedProgressionNode } from '@/features/progression/utils/progressionDerived';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type UnlockedAuthoritiesSectionProps = {
  nodes: DerivedProgressionNode[];
};

export function UnlockedAuthoritiesSection({
  nodes,
}: UnlockedAuthoritiesSectionProps) {
  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Açılan Yetkiler"
        subtitle="XP ile kazandığın yeni yönetim araçları."
        icon="checkmark-done-outline"
        iconColor={colors.success}
      />

      {nodes.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            Henüz yeni yetki açılmadı. Olayları çözerek XP kazan.
          </Text>
          <Text style={styles.emptyHint}>
            Daha fazla olayı çözerek yeni yönetim araçlarını aç.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          {nodes.map((node) => (
            <View key={node.id} style={[styles.card, shadows.soft]}>
              <View style={styles.iconBadge}>
                <Ionicons name={node.icon} size={18} color={colors.success} />
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {node.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={3}>
                {node.description}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  empty: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  emptyText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  emptyHint: {
    ...typography.caption,
    fontSize: 12,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  card: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.md,
    gap: spacing.xs,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.subtitle,
    fontSize: 14,
  },
  cardDesc: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
});
