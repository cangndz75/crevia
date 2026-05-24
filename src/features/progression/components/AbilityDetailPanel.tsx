import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { canUpgradeAbility } from '@/core/utils/abilityPresentation';
import { mockGameData } from '@/core/content/mockGameData';
import { Ability } from '@/core/models/Ability';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type AbilityDetailPanelProps = {
  ability: Ability;
};

function handleUpgrade(ability: Ability) {
  const cost = ability.upgradeCostXp.toLocaleString('tr-TR');
  Alert.alert(
    'Yetki Yükseltildi',
    `"${ability.title}" seviye ${ability.level + 1} oldu.\n-${cost} otorite puanı`,
    [{ text: 'Harika' }],
  );
}

function handleInfo(ability: Ability) {
  Alert.alert(
    ability.title,
    `${ability.description}\n\nMaksimum seviye: ${ability.maxLevel}`,
    [{ text: 'Kapat' }],
  );
}

export function AbilityDetailPanel({ ability }: AbilityDetailPanelProps) {
  const { authorityPoints } = mockGameData.player;
  const isLocked = ability.status === 'locked';
  const isMaxed =
    ability.status === 'maxed' || ability.level >= ability.maxLevel;
  const canUpgrade = canUpgradeAbility(ability, authorityPoints);
  const accent = isLocked
    ? colors.textSecondary
    : ability.level > 0
      ? colors.abilityGold
      : colors.primary;

  return (
    <View style={[styles.panel, shadows.card]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={typography.subtitle}>{ability.title}</Text>
        </View>
        <View style={[styles.levelBadge, { borderColor: accent }]}>
          <Text style={[styles.levelBadgeText, { color: accent }]}>
            SEVİYE {String(ability.level).padStart(2, '0')}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{ability.description}</Text>

      {isLocked ? (
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.lockedText}>
            Üst yetkileri geliştirerek bu dalı açabilirsin.
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={() => (canUpgrade ? handleUpgrade(ability) : undefined)}
            disabled={!canUpgrade && !isMaxed}
            style={({ pressed }) => [
              styles.upgradeBtn,
              isMaxed && styles.upgradeBtnMaxed,
              !canUpgrade && !isMaxed && styles.upgradeBtnDisabled,
              pressed && canUpgrade && styles.upgradePressed,
            ]}>
            <Ionicons
              name={isMaxed ? 'checkmark-circle' : 'arrow-up-circle'}
              size={20}
              color={colors.textInverse}
            />
            <Text style={styles.upgradeText}>
              {isMaxed
                ? 'Maksimum Seviye'
                : `Yükselt (${(ability.upgradeCostXp / 1000).toFixed(1).replace('.0', '')}k XP)`}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleInfo(ability)}
            style={({ pressed }) => [styles.infoBtn, pressed && styles.infoPressed]}
            accessibilityRole="button"
            accessibilityLabel="Yetki bilgisi">
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={colors.authority}
            />
          </Pressable>
        </View>
      )}

      {!isLocked && !isMaxed && !canUpgrade ? (
        <Text style={styles.insufficientXp}>
          Yükseltmek için yeterli otorite puanın yok.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelBadge: {
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  lockedText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  upgradeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  upgradeBtnMaxed: {
    backgroundColor: colors.success,
  },
  upgradeBtnDisabled: {
    backgroundColor: colors.border,
  },
  upgradePressed: {
    opacity: 0.92,
  },
  upgradeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  infoBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.authorityMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.authorityMuted,
  },
  infoPressed: {
    opacity: 0.85,
  },
  insufficientXp: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
    textAlign: 'center',
  },
});
