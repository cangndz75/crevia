import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, mockGameData } from '@/core/content/mockGameData';
import { DailyMission } from '@/core/models/DailyMission';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const missionIcons: Record<
  DailyMission['icon'],
  keyof typeof Ionicons.glyphMap
> = {
  flame: 'flame-outline',
  shield: 'shield-outline',
  happy: 'happy-outline',
  check: 'checkmark-circle-outline',
};

function MissionCard({ mission }: { mission: DailyMission }) {
  const progress = mission.current / mission.target;
  const isCompleted = mission.status === 'completed';
  const isActive = mission.status === 'active';
  const progressColor = isCompleted ? colors.success : colors.warning;

  return (
    <GameCard
      padding="md"
      style={
        isCompleted
          ? [styles.missionCard, styles.missionCompleted]
          : isActive
            ? [styles.missionCard, styles.missionActive]
            : styles.missionCard
      }>
      <View style={styles.missionRow}>
        <View
          style={[
            styles.missionIcon,
            isCompleted && { backgroundColor: colors.successMuted },
          ]}>
          <Ionicons
            name={isCompleted ? 'checkmark' : missionIcons[mission.icon]}
            size={20}
            color={isCompleted ? colors.success : colors.textSecondary}
          />
        </View>

        <View style={styles.missionBody}>
          <Text style={typography.subtitle} numberOfLines={1}>
            {mission.title}
          </Text>
          <Text style={typography.caption} numberOfLines={2}>
            {mission.description}
          </Text>
        </View>

        <View style={styles.rewards}>
          <View style={styles.xpReward}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.xpText}>+{mission.xpReward} XP</Text>
          </View>
          {mission.budgetReward ? (
            <Text style={styles.budgetText}>
              {formatCurrency(mission.budgetReward)}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar
          progress={Math.min(progress, 1)}
          color={progressColor}
          trackColor={colors.background}
          height={5}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          {mission.current}/{mission.target}
        </Text>
      </View>
    </GameCard>
  );
}

export function DailyMissionsSection() {
  const missions = mockGameData.dailyMissions;
  const completed = missions.filter((m) => m.status === 'completed').length;

  return (
    <View>
      <SectionHeader
        title="Bugünün hedefin"
        subtitle="Şehir dengesini gün içinde yakalamak için pratik sıra bunlar"
        icon="flag"
        iconColor={colors.warning}
        trailing={
          <GameChip
            label={`${completed}/${missions.length}`}
            tone="warning"
          />
        }
      />
      <View style={styles.list}>
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  missionCard: {
    gap: spacing.sm,
  },
  missionActive: {
    borderColor: colors.primaryMuted,
    backgroundColor: '#FAFFFE',
  },
  missionCompleted: {
    borderColor: colors.successMuted,
    backgroundColor: colors.successMuted,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  missionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionBody: {
    flex: 1,
    gap: 4,
  },
  rewards: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 72,
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  budgetText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 52,
  },
  progressBar: {
    flex: 1,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
});
