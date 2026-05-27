import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { Crew, PilotAreaPreset, TaskItem } from '../types/map';

type Props = {
  crews: Crew[];
  tasks: TaskItem[];
  routeInfo: PilotAreaPreset['routeInfo'];
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  enroute: 'Yolda',
  idle: 'Beklemede',
};

const statusColors: Record<string, string> = {
  active: colors.success,
  enroute: colors.warning,
  idle: colors.textSecondary,
};

function CrewCard({ crew }: { crew: Crew }) {
  return (
    <View style={[styles.crewCard, shadows.soft]}>
      <Text style={styles.crewAvatar}>{crew.avatar}</Text>
      <Text style={styles.crewName}>{crew.name}</Text>
      <View style={styles.crewStatusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColors[crew.status] }]} />
        <Text style={[styles.crewStatus, { color: statusColors[crew.status] }]}>
          {statusLabels[crew.status]}
        </Text>
      </View>
      <View style={styles.efficiencyRow}>
        <View style={styles.effTrack}>
          <View style={[styles.effFill, { width: `${crew.efficiency}%`, backgroundColor: colors.purple }]} />
        </View>
        <Text style={styles.effValue}>%{crew.efficiency}</Text>
      </View>
      <Text style={styles.crewTask} numberOfLines={1}>{crew.task}</Text>
    </View>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  return (
    <View style={styles.taskRow}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskName}>{task.name}</Text>
        <Text style={styles.taskLocation}>{task.location}</Text>
      </View>
      <View style={styles.taskProgress}>
        <View style={styles.taskTrack}>
          <View style={[styles.taskFill, { width: `${task.progress}%` }]} />
        </View>
        <Text style={styles.taskPercent}>%{task.progress}</Text>
      </View>
      <Pressable style={[styles.taskBtn, task.canReassign && styles.taskBtnReassign]}>
        <Text style={[styles.taskBtnText, task.canReassign && styles.taskBtnTextReassign]}>
          {task.canReassign ? 'Yeniden Ata' : 'Takip Et'}
        </Text>
      </Pressable>
    </View>
  );
}

export function CrewTrackingPanel({ crews, tasks, routeInfo }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.routeCard, shadows.soft]}>
        <View style={styles.routeHeader}>
          <Ionicons name="navigate" size={16} color={colors.purple} />
          <Text style={styles.routeLabel}>Aktif Rota</Text>
        </View>
        <Text style={styles.routeTitle}>{routeInfo.title}</Text>
        <Text style={styles.routeMeta}>
          {routeInfo.distance} · {routeInfo.eta}
        </Text>
        <View style={styles.routeProgress}>
          <View
            style={[styles.routeFill, { width: `${routeInfo.progress}%` }]}
          />
        </View>
      </View>

      <View style={styles.etaRow}>
        <View style={[styles.etaChip, shadows.soft]}>
          <Text style={styles.etaLabel}>Ortalama ETA</Text>
          <Text style={styles.etaValue}>{routeInfo.avgEta}</Text>
        </View>
        <View style={[styles.etaChip, shadows.soft]}>
          <Text style={styles.etaLabel}>Tamamlanma</Text>
          <Text style={styles.etaValue}>{routeInfo.completion}</Text>
        </View>
      </View>

      {/* Crew horizontal cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.crewScroll}
      >
        {crews.map((crew) => (
          <CrewCard key={crew.id} crew={crew} />
        ))}
      </ScrollView>

      {/* Task flow */}
      <View style={styles.tasksSection}>
        <View style={styles.tasksSectionHeader}>
          <View>
            <Text style={styles.tasksTitle}>Görev Akışı</Text>
            <Text style={styles.tasksSubtitle}>Devam eden görevleri ve durumlarını takip et.</Text>
          </View>
        </View>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  routeCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.purple,
    letterSpacing: 0.3,
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  routeMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  routeProgress: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.backgroundAlt,
    marginTop: 4,
    overflow: 'hidden',
  },
  routeFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: 3,
  },
  etaRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  etaChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.purple,
    marginTop: 2,
  },
  crewScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  crewCard: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  crewAvatar: {
    fontSize: 24,
  },
  crewName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  crewStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  crewStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  efficiencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  effTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  effFill: {
    height: '100%',
    borderRadius: 2,
  },
  effValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purple,
  },
  crewTask: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tasksSection: {
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tasksSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  taskLocation: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  taskProgress: {
    alignItems: 'center',
    gap: 3,
    width: 60,
  },
  taskTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  taskFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: 2,
  },
  taskPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purple,
  },
  taskBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.purpleMuted,
  },
  taskBtnReassign: {
    backgroundColor: colors.warningMuted,
  },
  taskBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.purple,
  },
  taskBtnTextReassign: {
    color: colors.warning,
  },
});
