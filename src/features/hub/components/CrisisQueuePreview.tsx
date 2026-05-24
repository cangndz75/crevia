import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getRiskSeverityColor,
  getRiskSeverityLabel,
  mockGameData,
} from '@/core/content/mockGameData';
import { RiskIcon, RiskItem } from '@/core/models/RiskItem';
import { GameCard } from '@/ui/components/GameCard';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

const riskGlyphs: Record<RiskIcon, keyof typeof Ionicons.glyphMap> = {
  people: 'people-outline',
  vehicle: 'car-outline',
  megaphone: 'megaphone-outline',
  alert: 'alert-circle-outline',
  document: 'document-text-outline',
};

function sortQueue(risks: RiskItem[]) {
  return [...risks].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

function SlotRow({
  item,
  index,
}: {
  item: RiskItem;
  index: number;
}) {
  const color = getRiskSeverityColor(item.severity);
  const icon = riskGlyphs[item.icon];

  return (
    <View style={styles.slot}>
      <View style={[styles.indexBadge, { borderColor: color }]}>
        <Text style={[styles.indexText, { color }]}>{index + 1}</Text>
      </View>
      <View style={styles.slotIcon}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.slotTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.slotSub} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <View style={[styles.severityChip, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.severityText, { color }]}>
          {getRiskSeverityLabel(item.severity).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

export function CrisisQueuePreview() {
  const router = useRouter();
  const top = useMemo(
    () => sortQueue(mockGameData.risks).slice(0, 3),
    [],
  );

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Öncelik kuyruğu"
        subtitle="Risk defteri — bugün sırayı bozmadan takip et"
        icon="git-branch-outline"
        iconColor={colors.warning}
      />
      <GameCard padding="md" style={styles.card}>
        <View style={styles.list}>
          {top.map((risk, idx) => (
            <SlotRow key={risk.id} item={risk} index={idx} />
          ))}
        </View>
        <Pressable
          onPress={() => router.push('/risks')}
          style={({ pressed }) => [
            styles.footerLink,
            pressed && styles.footerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Tüm risk kuyruğunu aç">
          <Text style={styles.footerText}>Risk defterine git</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </Pressable>
      </GameCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  card: {
    gap: spacing.md,
    borderColor: `${colors.warning}44`,
    backgroundColor: colors.surface,
  },
  list: {
    gap: spacing.sm,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  indexText: {
    fontSize: 13,
    fontWeight: '800',
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTitle: {
    ...typography.subtitle,
    fontSize: 14,
    fontWeight: '700',
  },
  slotSub: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  severityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
  },
  footerPressed: {
    opacity: 0.85,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
