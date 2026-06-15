import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarHeaderView } from '@/features/events/types/olaylarScreenTypes';

type OlaylarEventsHeaderProps = {
  header: OlaylarHeaderView;
  onResourcePress?: () => void;
};

export function OlaylarEventsHeader({ header, onResourcePress }: OlaylarEventsHeaderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>Olaylar</Text>
          <View style={styles.metaRow}>
            <View style={styles.levelBadge}>
              <Ionicons name="shield" size={11} color={olaylar.urgent} />
              <Text style={styles.levelText}>Seviye {header.level}</Text>
            </View>
            <Text style={styles.xpText}>
              {header.xp} / {header.xpTarget}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onResourcePress}
          style={({ pressed }) => [styles.resourcePill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Kaynak ${header.resourceLabel}`}>
          <Ionicons name="layers" size={15} color="#FFFFFF" />
          <View style={styles.resourceCopy}>
            <Text style={styles.resourceAmount} numberOfLines={1}>
              {header.resourceLabel}
            </Text>
            <Text style={styles.resourceLabel}>Kaynak</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: olaylar.screenPadding,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: olaylar.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: olaylar.green,
    letterSpacing: -0.6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7E8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  resourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: olaylar.green,
    borderRadius: 16,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
    maxWidth: 132,
    flexShrink: 0,
  },
  resourceCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  resourceAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resourceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
