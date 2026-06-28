import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import type { GrowthDailyTaskModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { GrowthSectionHeader } from '@/features/progression/components/growth/GrowthSectionHeader';

type GrowthDailyTasksSectionProps = {
  tasks: GrowthDailyTaskModel[];
};

export function GrowthDailyTasksSection({ tasks }: GrowthDailyTasksSectionProps) {
  return (
    <View style={styles.wrap}>
      <GrowthSectionHeader title="Günlük Görevler" actionLabel="Tümünü Gör" />

      <View style={styles.list}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="clipboard-outline" size={18} color={growth.gold} />
            </View>

            <View style={styles.copy}>
              <Text style={styles.title}>{task.title}</Text>
              <AnimatedProgressBar
                progress={task.progress}
                color={growth.mint}
                trackColor={growth.track}
                height={5}
              />
              <Text style={styles.progress}>{task.progressLabel}</Text>
            </View>

            <View style={styles.rewardCol}>
              <Text style={styles.reward}>{task.rewardLabel}</Text>
              {task.completed ? (
                <Ionicons name="checkmark-circle" size={20} color={growth.mint} />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingBottom: 8,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: growth.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: growth.border,
    padding: 14,
    minHeight: 72,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: growth.mintMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: growth.text,
    lineHeight: 18,
  },
  progress: {
    fontSize: 12,
    fontWeight: '700',
    color: growth.textSoft,
  },
  rewardCol: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  reward: {
    fontSize: 13,
    fontWeight: '800',
    color: growth.gold,
  },
});
