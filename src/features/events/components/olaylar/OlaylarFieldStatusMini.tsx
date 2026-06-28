import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarFieldStatusView } from '@/features/events/types/olaylarScreenTypes';

type OlaylarFieldStatusMiniProps = {
  status: OlaylarFieldStatusView;
  onPress?: () => void;
  onCtaPress?: () => void;
};

export function OlaylarFieldStatusMini({
  status,
  onPress,
  onCtaPress,
}: OlaylarFieldStatusMiniProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Saha durumu">
      <View style={styles.header}>
        <Ionicons name="map" size={14} color={olaylar.teal} />
        <Text style={styles.title}>SAHA DURUMU</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Genel Düzen</Text>
          <Text style={styles.metricValue}>{status.orderPercent}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Etkilenen Mah.</Text>
          <Text style={styles.metricValue}>{status.affectedDistricts}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Aktif Görev</Text>
          <Text style={styles.metricValue}>{status.activeTasks}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Görevdeki Ekip</Text>
          <Text style={styles.metricValue}>{status.teamsOnDutyLabel}</Text>
        </View>
      </View>

      <Pressable
        onPress={onCtaPress}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={status.ctaLabel}>
        <Text style={styles.ctaText}>{status.ctaLabel}</Text>
        <Ionicons name="arrow-forward" size={13} color={olaylar.gold} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: olaylar.panel,
    borderRadius: olaylar.radiusCard,
    borderWidth: 1,
    borderColor: olaylar.border,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: olaylar.textSoft,
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    width: '47%',
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: olaylar.text,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(216, 167, 46, 0.35)',
    backgroundColor: 'rgba(216, 167, 46, 0.1)',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: olaylar.gold,
  },
  pressed: {
    opacity: 0.88,
  },
});
