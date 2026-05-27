import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';
import { useGameStatus } from '@/store/gameSelectors';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { HeaderXpBar } from '@/ui/components/game-header/HeaderXpBar';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

/**
 * Olaylar sekmesi — düz, kompakt oyuncu header (referans).
 */
export function EventsOperasyonHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const status = useGameStatus();

  return (
    <View style={[styles.outer, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.mainRow}>
        <Pressable
          onPress={() => router.push('/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Profili aç">
          <HeaderAvatar size={46} borderColor={eventsScreen.card} />
        </Pressable>

        <View style={styles.centerCol}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>Olaylar</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Seviye {status.level}</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.budgetBtn, shadows.soft]}
          accessibilityRole="button"
          accessibilityLabel={`Kaynak ${status.budgetFormatted}`}>
          <Ionicons name="layers-outline" size={14} color="#FFFFFF" />
          <Text style={styles.budgetAmount} numberOfLines={1}>
            {status.budgetFormatted}
          </Text>
          <Text style={styles.budgetLabel}>Kaynak</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.85)" />
        </Pressable>
      </View>

      <View style={styles.xpRow}>
        <HeaderXpBar
          progress={status.xpProgress}
          trackColor={eventsScreen.amberMuted}
          fillColor={eventsScreen.teal}
          height={5}
        />
        <Text style={styles.xpValue}>
          {status.xp}/{status.xpTarget}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: eventsScreen.screenPadding,
    paddingBottom: spacing.sm,
    backgroundColor: eventsScreen.bg,
    gap: 10,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: eventsScreen.text,
    letterSpacing: -0.4,
  },
  levelBadge: {
    backgroundColor: eventsScreen.amberMuted,
    borderWidth: 1,
    borderColor: 'rgba(245, 183, 49, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: eventsScreen.amberDark,
  },
  budgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: eventsScreen.tealDark,
    borderRadius: 14,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
    maxWidth: 128,
    flexShrink: 0,
  },
  budgetAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.2,
    maxWidth: 52,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    marginRight: 2,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpValue: {
    fontSize: 11,
    fontWeight: '700',
    color: eventsScreen.textMuted,
    minWidth: 56,
    textAlign: 'right',
  },
});
