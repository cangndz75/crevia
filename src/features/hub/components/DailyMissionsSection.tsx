import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DailyMission } from '@/core/models/DailyMission';
import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveDay1Missions } from '@/features/hub/utils/hubDerived';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const missionIcons: Record<
  DailyMission['icon'],
  keyof typeof Ionicons.glyphMap
> = {
  flame: 'flame-outline',
  shield: 'shield-outline',
  happy: 'happy-outline',
  check: 'checkmark-circle-outline',
};

function MissionCard({
  mission,
  index,
}: {
  mission: DailyMission;
  index: number;
}) {
  const isCompleted = mission.status === 'completed';
  const progress = Math.min(mission.current / mission.target, 1);

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80)
        .duration(400)
        .springify()}
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
      ]}>
      {isCompleted && <View style={styles.accentStrip} />}

      <View style={styles.cardInner}>
        <View style={styles.row}>
          <View
            style={[
              styles.iconCircle,
              isCompleted
                ? styles.iconCircleCompleted
                : styles.iconCircleActive,
            ]}>
            <Ionicons
              name={
                isCompleted
                  ? 'checkmark-circle-outline'
                  : missionIcons[mission.icon]
              }
              size={20}
              color={isCompleted ? colors.success : colors.warning}
            />
          </View>

          <View style={styles.center}>
            <Text
              style={[
                styles.title,
                isCompleted && styles.titleCompleted,
              ]}
              numberOfLines={1}>
              {mission.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {mission.description}
            </Text>
          </View>

          <View style={styles.xpPill}>
            <Ionicons name="star" size={11} color={colors.warning} />
            <Text style={styles.xpText}>+{mission.xpReward} XP</Text>
          </View>
        </View>

        {!isCompleted && (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {mission.current}/{mission.target}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export function DailyMissionsSection() {
  const input = useHubDerivedInput();
  const missions = useMemo(() => deriveDay1Missions(input), [input]);
  const completed = missions.filter((m) => m.status === 'completed').length;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GÜNLÜK HEDEFLER</Text>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Bugünün Hedeflerin</Text>
          <View style={styles.completionPill}>
            <Text style={styles.completionText}>
              {completed}/{missions.length}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {missions.map((mission, i) => (
          <MissionCard key={mission.id} mission={mission} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  completionPill: {
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.soft,
  },
  cardCompleted: {
    backgroundColor: '#F6FBF8',
    borderColor: colors.successMuted,
  },
  accentStrip: {
    width: 4,
    backgroundColor: colors.success,
  },
  cardInner: {
    flex: 1,
    padding: 14,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: colors.warningMuted,
  },
  iconCircleCompleted: {
    backgroundColor: colors.successMuted,
  },
  center: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 50,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
});
