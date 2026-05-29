import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { ProfileViewModel } from '@/features/profile/utils/profileModel';
import { HeaderXpBar } from '@/ui/components/game-header/HeaderXpBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileXpCardProps = {
  model: ProfileViewModel;
  compact?: boolean;
};

export function ProfileXpCard({ model, compact = false }: ProfileXpCardProps) {
  const progressPct = Math.round(model.xpProgress * 100);

  return (
    <View style={[styles.shell, compact && styles.shellCompact, shadows.card]}>
      <LinearGradient
        colors={['#1E4A48', '#256B67', '#1A8F8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.topRow}>
          <View style={styles.topCopy}>
            <Text style={styles.kicker} numberOfLines={1}>
              Pilot Gelişimi
            </Text>
            <Text style={styles.levelLabel} numberOfLines={1}>
              Seviye {model.level}
            </Text>
          </View>
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeValue} numberOfLines={1}>
              +{model.xpToNextLevel.toLocaleString('tr-TR')}
            </Text>
            <Text style={styles.nextBadgeLabel} numberOfLines={1}>
              kaldı
            </Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <HeaderXpBar
            progress={model.xpProgress}
            trackColor="rgba(255,255,255,0.16)"
            fillColor={colors.hubGold}
            height={compact ? 8 : 10}
          />
          <View style={styles.progressMeta}>
            <Text style={styles.progressValue} numberOfLines={1}>
              {model.xp.toLocaleString('tr-TR')}
              <Text style={styles.progressTarget}>
                {' '}
                / {model.xpTarget.toLocaleString('tr-TR')}
              </Text>
            </Text>
            <Text style={styles.progressPct} numberOfLines={1}>
              %{progressPct}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 16,
  },
  shellCompact: {
    marginTop: 0,
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245,183,49,0.3)',
    overflow: 'hidden',
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 8,
  },
  topCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.1,
  },
  levelLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  nextBadge: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(245,183,49,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,183,49,0.35)',
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexShrink: 0,
    maxWidth: '42%',
  },
  nextBadgeValue: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.hubGold,
    letterSpacing: -0.3,
  },
  nextBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(245,183,49,0.85)',
  },
  progressBlock: {
    gap: 6,
    marginTop: 2,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
  },
  progressTarget: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.hubGold,
  },
});
