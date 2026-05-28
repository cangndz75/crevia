import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Milestone = {
  id: string;
  shortLabel: string;
  caption: string;
  completed: boolean;
  icon: keyof typeof Ionicons.glyphMap;
};

export function HubRewardsJourney() {
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const streak = Math.max(1, currentDay);

  const milestones: Milestone[] = [
    {
      id: 'd1',
      shortLabel: '1',
      caption: '1 Gün Tamamlandı',
      completed: currentDay > 1,
      icon: 'checkmark-circle',
    },
    {
      id: 'd3',
      shortLabel: '3',
      caption: '3 Gün Ödül',
      completed: currentDay >= 3,
      icon: 'gift-outline',
    },
    {
      id: 'd7',
      shortLabel: '7',
      caption: '7 Gün Büyük Ödül',
      completed: currentDay >= 7,
      icon: 'trophy-outline',
    },
  ];

  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.wrap}>
      <LinearGradient
        colors={['#0B3D3A', '#0F4A47', '#157A76']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, shadows.card]}>
        <View style={styles.topRow}>
          <View style={styles.streakBadge}>
            <View style={styles.flameCircle}>
              <Ionicons name="flame" size={16} color="#fff" />
            </View>
            <Text style={styles.streakText}>{streak} Günlük Seri</Text>
          </View>
          <View style={styles.chestWrap}>
            <Ionicons name="gift" size={36} color={colors.hubGold} />
          </View>
        </View>

        <View style={styles.trackRow}>
          {milestones.map((m, index) => (
            <View key={m.id} style={styles.milestoneCol}>
              <View style={styles.nodeRow}>
                {index > 0 ? (
                  <View
                    style={[
                      styles.connector,
                      milestones[index - 1]!.completed && styles.connectorDone,
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.node,
                    m.completed ? styles.nodeDone : styles.nodePending,
                  ]}>
                  {m.completed ? (
                    <Ionicons name="checkmark" size={12} color={colors.success} />
                  ) : (
                    <Ionicons name={m.icon} size={14} color={colors.hubGold} />
                  )}
                </View>
                {index < milestones.length - 1 ? (
                  <View
                    style={[
                      styles.connector,
                      m.completed && styles.connectorDone,
                    ]}
                  />
                ) : null}
              </View>
              <Text style={styles.milestoneCaption} numberOfLines={2}>
                {m.caption}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Devam et, daha büyük ödüller seni bekliyor!
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
  },
  banner: {
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flameCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.hubGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  chestWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
  },
  milestoneCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    maxWidth: 24,
  },
  connectorDone: {
    backgroundColor: colors.hubGold,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flexShrink: 0,
  },
  nodeDone: {
    backgroundColor: 'rgba(59, 175, 122, 0.25)',
    borderColor: colors.success,
  },
  nodePending: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(245, 183, 49, 0.5)',
  },
  milestoneCaption: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 12,
  },
  footer: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
});
