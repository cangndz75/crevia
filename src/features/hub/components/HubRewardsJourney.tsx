import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Milestone = {
  id: string;
  label: string;
  completed: boolean;
  icon: keyof typeof Ionicons.glyphMap;
};

function MilestoneNode({ milestone }: { milestone: Milestone }) {
  return (
    <View style={milestoneStyles.node}>
      <View
        style={[
          milestoneStyles.iconWrap,
          milestone.completed ? milestoneStyles.iconDone : milestoneStyles.iconPending,
        ]}>
        <Ionicons
          name={milestone.completed ? 'checkmark' : milestone.icon}
          size={12}
          color={milestone.completed ? colors.success : 'rgba(255,255,255,0.85)'}
        />
      </View>
      <Text style={milestoneStyles.label} numberOfLines={2}>
        {milestone.label}
      </Text>
    </View>
  );
}

const milestoneStyles = StyleSheet.create({
  node: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconDone: {
    backgroundColor: 'rgba(59, 175, 122, 0.25)',
    borderColor: colors.success,
  },
  iconPending: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  label: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 10,
  },
});

export function HubRewardsJourney() {
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const streak = Math.max(1, currentDay);

  const milestones: Milestone[] = [
    {
      id: 'day1',
      label: '1 Gün\nTamamlandı',
      completed: currentDay > 1,
      icon: 'checkmark-circle',
    },
    {
      id: 'day3',
      label: '3 Gün\nÖdül',
      completed: currentDay >= 3,
      icon: 'gift',
    },
    {
      id: 'day7',
      label: '7 Gün\nBüyük Ödül',
      completed: currentDay >= 7,
      icon: 'gift',
    },
  ];

  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.wrap}>
      <Text style={styles.sectionTitle}>ÖDÜLLERİN YOLCULUĞU</Text>
      <LinearGradient
        colors={[colors.headerTealDark, colors.headerTeal, '#1E9A95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.banner, shadows.card]}>
        <View style={styles.leftCol}>
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={16} color={colors.hubGold} />
            <Text style={styles.streakText}>{streak} Günlük Seri</Text>
          </View>

          <View style={styles.trackRow}>
            <View style={styles.trackLine} />
            {milestones.map((m) => (
              <MilestoneNode key={m.id} milestone={m} />
            ))}
          </View>
        </View>

        <View style={styles.rightCol}>
          <HubAssetImage
            source={hubAssets.dailyGoalBadge}
            containerStyle={styles.chestImage}
            contentFit="contain"
          />
          <Text style={styles.ctaText} numberOfLines={3}>
            Devam et, daha büyük ödüller seni bekliyor!
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    overflow: 'hidden',
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    gap: 4,
  },
  trackLine: {
    position: 'absolute',
    top: 11,
    left: '12%',
    right: '12%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 1,
  },
  rightCol: {
    width: 88,
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  chestImage: {
    width: 52,
    height: 52,
  },
  ctaText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 12,
  },
});
