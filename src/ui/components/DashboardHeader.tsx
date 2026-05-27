import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getTimeGreeting } from '@/core/utils/timeGreeting';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import { useGameStatus } from '@/store/gameSelectors';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { HeaderBudgetCard } from '@/ui/components/game-header/HeaderBudgetCard';
import { HeaderNotifyButton } from '@/ui/components/game-header/HeaderNotifyButton';
import { HeaderXpBar } from '@/ui/components/game-header/HeaderXpBar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

function buildPilotMetaLine(day: number, districtName: string): string {
  const short = districtName.split(' ')[0] ?? districtName;
  return `${day}. Gün · ${short}`;
}

/**
 * Ana Sayfa / Merkez — komuta merkezi hissi: selamlama, XP, bütçe, hafif şehir silüeti.
 * Yalnızca hub ekranında kullanılır.
 */
export function DashboardHeader() {
  const insets = useSafeAreaInsets();
  const status = useGameStatus();
  const greeting = useMemo(() => getTimeGreeting(), []);
  const metaLine = useMemo(
    () => buildPilotMetaLine(status.currentDay, status.selectedDistrictName),
    [status.currentDay, status.selectedDistrictName],
  );
  const skylineSource = useMemo(
    () => getPilotDistrictHeroImage(status.selectedDistrictId),
    [status.selectedDistrictId],
  );

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[colors.headerTealDark, colors.headerTeal, '#24A89E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + spacing.md }]}>
        <Image
          source={skylineSource}
          style={styles.skyline}
          contentFit="cover"
          contentPosition="bottom"
        />

        <View style={styles.content}>
          <Text style={styles.kicker}>KOMUTA MERKEZİ</Text>

          <View style={styles.topRow}>
            <HeaderAvatar
              size={56}
              level={status.level}
              showLevelBadge
              borderColor="rgba(255,255,255,0.85)"
            />

            <View style={styles.greetCol}>
              <Text style={styles.greeting}>
                {greeting.title} {status.playerName} {greeting.emoji}
              </Text>
              <Text style={styles.meta}>{metaLine}</Text>
              <View style={styles.levelPill}>
                <Text style={styles.levelPillText}>Seviye {status.level}</Text>
              </View>
            </View>

            <HeaderNotifyButton count={status.notificationCount} light />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.xpBlock}>
              <View style={styles.xpLabels}>
                <Text style={styles.xpLabel}>XP</Text>
                <Text style={styles.xpValue}>
                  {status.xp.toLocaleString('tr-TR')}/
                  {status.xpTarget.toLocaleString('tr-TR')}
                </Text>
              </View>
              <HeaderXpBar
                progress={status.xpProgress}
                trackColor={colors.xpTrack}
                fillColor={colors.hubGold}
                height={7}
              />
            </View>

            <HeaderBudgetCard
              amount={status.budgetFormatted}
              deltaLabel={status.budgetDeltaLabel}
              deltaNegative={(status.budgetDelta ?? 0) < 0}
              prominent
              light
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  gradient: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    position: 'relative',
  },
  skyline: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  content: {
    gap: 12,
    zIndex: 1,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  greetCol: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.4,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
  },
  levelPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    backgroundColor: 'rgba(245,183,49,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(245,183,49,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F5D78E',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: spacing.sm,
  },
  xpBlock: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  xpValue: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
});
