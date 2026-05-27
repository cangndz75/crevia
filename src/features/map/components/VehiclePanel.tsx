import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { Vehicle } from '../types/map';
import { MapSummaryCards } from './MapSummaryCards';

type Props = {
  vehicles: Vehicle[];
  vehiclePlanningUnlocked?: boolean;
};

const statusMap: Record<string, { label: string; color: string }> = {
  ready: { label: 'Hazır', color: colors.success },
  on_duty: { label: 'Görevde', color: colors.primary },
  maintenance: { label: 'Bakım Gerekli', color: colors.warning },
  broken: { label: 'Arızalı', color: colors.danger },
};

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  const st = statusMap[vehicle.status] ?? statusMap.ready;
  return (
    <View style={[styles.vehicleRow, shadows.soft]}>
      <View style={styles.vehicleIcon}>
        <Ionicons name="car" size={18} color={st.color} />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>{vehicle.name}</Text>
        <Text style={styles.vehicleType}>{vehicle.type} · {vehicle.location}</Text>
      </View>
      <View style={styles.vehicleRight}>
        <View style={[styles.vehicleStatusPill, { backgroundColor: `${st.color}18` }]}>
          <View style={[styles.vehicleStatusDot, { backgroundColor: st.color }]} />
          <Text style={[styles.vehicleStatusText, { color: st.color }]}>{st.label}</Text>
        </View>
        <Text style={styles.vehicleCapacity}>Kapasite %{vehicle.capacity}</Text>
      </View>
    </View>
  );
}

export function VehiclePanel({ vehicles, vehiclePlanningUnlocked = false }: Props) {
  const ready = vehicles.filter((v) => v.status === 'ready').length;
  const onDuty = vehicles.filter((v) => v.status === 'on_duty').length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance' || v.status === 'broken').length;

  const cards = [
    { icon: 'checkmark-circle' as const, iconColor: colors.success, value: ready, label: 'Hazır Araç' },
    { icon: 'car' as const, iconColor: colors.secondary, value: onDuty, label: 'Görevde' },
    { icon: 'construct' as const, iconColor: colors.warning, value: maintenance, label: 'Bakım Riski' },
  ];

  return (
    <View style={styles.container}>
      <MapSummaryCards cards={cards} />

      <View style={styles.list}>
        {vehicles.map((v) => (
          <VehicleRow key={v.id} vehicle={v} />
        ))}
      </View>

      <View style={styles.ctaRow}>
        <Pressable
          style={[styles.ctaBtn, !vehiclePlanningUnlocked && styles.ctaBtnDisabled]}
          disabled={!vehiclePlanningUnlocked}
        >
          <Ionicons
            name={vehiclePlanningUnlocked ? 'calendar' : 'lock-closed'}
            size={16}
            color={vehiclePlanningUnlocked ? colors.textInverse : colors.textSecondary}
          />
          <Text style={[styles.ctaBtnText, !vehiclePlanningUnlocked && styles.ctaBtnTextDisabled]}>
            {vehiclePlanningUnlocked ? 'Araçları Planla' : 'Araç Planlama Yetkisi Gerekli'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    gap: 2,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vehicleType: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  vehicleRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  vehicleStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  vehicleStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vehicleStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  vehicleCapacity: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ctaRow: {
    paddingHorizontal: spacing.lg,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  ctaBtnDisabled: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
  ctaBtnTextDisabled: {
    color: colors.textSecondary,
  },
});
