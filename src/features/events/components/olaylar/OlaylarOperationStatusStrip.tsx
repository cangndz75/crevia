import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarOperationStatusView } from '@/features/events/types/olaylarScreenTypes';

type OlaylarOperationStatusStripProps = {
  status: OlaylarOperationStatusView;
  onInfoPress?: () => void;
};

const STATUS_COLORS = {
  active: olaylar.green,
  critical: olaylar.critical,
  ready: olaylar.teal,
} as const;

export function OlaylarOperationStatusStrip({
  status,
  onInfoPress,
}: OlaylarOperationStatusStripProps) {
  const statusColor = STATUS_COLORS[status.tone];

  return (
    <View style={styles.root}>
      <View style={styles.item}>
        <Ionicons name="pulse" size={13} color={statusColor} />
        <Text style={styles.label}>Operasyon Durumu</Text>
        <Text style={[styles.value, { color: statusColor }]}>{status.statusLabel}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.item}>
        <Ionicons name="people" size={13} color={olaylar.textSoft} />
        <Text style={styles.label}>Ekipler</Text>
        <Text style={styles.value}>{status.teamsLabel}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.item}>
        <Ionicons name="car" size={13} color={olaylar.textSoft} />
        <Text style={styles.label}>Araçlar</Text>
        <Text style={styles.value}>{status.vehiclesLabel}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.item}>
        <Ionicons name="speedometer" size={13} color={olaylar.gold} />
        <Text style={styles.label}>Hız</Text>
        <Text style={[styles.value, styles.speedValue]}>{status.speedLabel}</Text>
      </View>

      <Pressable
        onPress={onInfoPress}
        style={({ pressed }) => [styles.infoBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Operasyon durumu bilgisi">
        <Ionicons name="information-circle-outline" size={16} color={olaylar.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: olaylar.screenPadding,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: olaylar.panel,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: olaylar.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: olaylar.textMuted,
    textAlign: 'center',
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
    color: olaylar.text,
    textAlign: 'center',
  },
  speedValue: {
    color: olaylar.gold,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: olaylar.border,
  },
  infoBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.85,
  },
});
