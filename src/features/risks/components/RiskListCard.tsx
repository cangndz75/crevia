import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getRiskSeverityColor,
  getRiskSeverityLabel,
} from '@/core/content/mockGameData';
import { formatSourceWithLabel } from '@/core/economy/economyFormatter';
import { RiskIcon, RiskItem } from '@/core/models/RiskItem';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const iconMap: Record<RiskIcon, keyof typeof Ionicons.glyphMap> = {
  people: 'people-outline',
  vehicle: 'bus-outline',
  megaphone: 'megaphone-outline',
  alert: 'alert-circle-outline',
  document: 'document-text-outline',
};

type RiskListCardProps = {
  risk: RiskItem;
};

function handleAction(risk: RiskItem) {
  Alert.alert(
    risk.actionLabel,
    `"${risk.title}" için önlem uygulandı.\nMaliyet: ${formatSourceWithLabel(risk.cost)}`,
    [{ text: 'Tamam' }],
  );
}

export function RiskListCard({ risk }: RiskListCardProps) {
  const severityColor = getRiskSeverityColor(risk.severity);
  const progress = risk.probability / 100;

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        { borderLeftColor: severityColor },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${severityColor}18` },
            ]}>
            <Ionicons
              name={iconMap[risk.icon]}
              size={20}
              color={severityColor}
            />
          </View>
          <View style={styles.titleBlock}>
            <Text style={typography.subtitle}>{risk.title}</Text>
            <Text style={styles.subtitle}>{risk.subtitle}</Text>
          </View>
        </View>

        <View style={[styles.priorityBadge, { backgroundColor: `${severityColor}14` }]}>
          <View style={[styles.priorityDot, { backgroundColor: severityColor }]} />
          <Text style={[styles.priorityText, { color: severityColor }]}>
            {getRiskSeverityLabel(risk.severity)}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{risk.description}</Text>

      <View style={styles.probabilityRow}>
        <Text style={styles.probabilityLabel}>Olasılık</Text>
        <View style={styles.probabilityBar}>
          <ProgressBar
            progress={progress}
            color={severityColor}
            trackColor={colors.background}
            height={6}
          />
        </View>
        <Text style={[styles.probabilityValue, { color: severityColor }]}>
          %{risk.probability}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.costRow}>
          <Ionicons name="wallet-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.costText}>
            Maliyet: {formatSourceWithLabel(risk.cost)}
          </Text>
        </View>

        <Pressable
          onPress={() => handleAction(risk)}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionPressed,
          ]}>
          <Text style={styles.actionLabel}>{risk.actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    ...typography.caption,
    lineHeight: 20,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  probabilityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 56,
  },
  probabilityBar: {
    flex: 1,
  },
  probabilityValue: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  costText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
