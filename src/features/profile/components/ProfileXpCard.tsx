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
};

export function ProfileXpCard({ model }: ProfileXpCardProps) {
  const progressPct = Math.round(model.xpProgress * 100);

  return (
    <View style={[styles.shell, shadows.card]}>
      <LinearGradient
        colors={['#1E4A48', '#256B67', '#1A8F8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <View style={styles.goldEdge} />

        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>PİLOT GELİŞİMİ</Text>
            <Text style={styles.levelLabel}>Seviye {model.level}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Ionicons name="star" size={14} color={colors.hubGold} />
            <Text style={styles.xpBadgeText}>
              {model.xpToNextLevel.toLocaleString('tr-TR')}
            </Text>
            <Text style={styles.xpBadgeUnit}>XP</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <HeaderXpBar
            progress={model.xpProgress}
            trackColor="rgba(255,255,255,0.16)"
            fillColor={colors.hubGold}
            height={12}
          />
          <View style={styles.progressMeta}>
            <Text style={styles.progressValue}>
              {model.xp.toLocaleString('tr-TR')}
              <Text style={styles.progressTarget}>
                {' '}
                / {model.xpTarget.toLocaleString('tr-TR')}
              </Text>
            </Text>
            <Text style={styles.progressPct}>%{progressPct}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Sonraki seviyeye kalan</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginTop: spacing.md,
    borderRadius: 20,
  },
  card: {
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245,183,49,0.35)',
    overflow: 'hidden',
  },
  goldEdge: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: colors.hubGold,
    borderRadius: 1,
    opacity: 0.9,
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
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: -0.4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: 'rgba(245,183,49,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245,183,49,0.4)',
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  xpBadgeText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.hubGold,
    letterSpacing: -0.5,
  },
  xpBadgeUnit: {
    fontSize: 11,
    fontWeight: '800',
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
  footer: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },
});
