import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { ActiveOperation } from '../types/map';

type Props = {
  operation: ActiveOperation;
  onTrack?: () => void;
};

export function ActiveOperationCard({ operation, onTrack }: Props) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="radio" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>AKTİF OPERASYON</Text>
          <Text style={styles.title}>{operation.name}</Text>
        </View>
        <View style={styles.districtPill}>
          <Text style={styles.districtText}>{operation.district}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          Başlangıç: {operation.startTime} · Ekip: {operation.crewCount} · Araç: {operation.vehicleCount}
        </Text>
      </View>

      {operation.recommendedAction ? (
        <View style={styles.recommendRow}>
          <Ionicons name="arrow-forward-circle" size={14} color={colors.primary} />
          <Text style={styles.recommendText}>{operation.recommendedAction}</Text>
        </View>
      ) : null}

      <Pressable style={styles.trackBtn} onPress={onTrack}>
        <Text style={styles.trackBtnText}>Takip Et</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  districtPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  districtText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  metaRow: {
    paddingLeft: 48,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 48,
  },
  recommendText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
