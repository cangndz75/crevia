import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarHeaderView } from '@/features/events/types/olaylarScreenTypes';

type OlaylarEventsHeaderProps = {
  header: OlaylarHeaderView;
  onResourcePress?: () => void;
};

export function OlaylarEventsHeader({ header, onResourcePress }: OlaylarEventsHeaderProps) {
  const xpProgress = header.xpTarget > 0 ? Math.min(1, header.xp / header.xpTarget) : 0;

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>Olaylar</Text>
          <Text style={styles.subtitle}>
            Şehrini yönet, kararlarınla geleceği belirle.
          </Text>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Ionicons name="shield" size={11} color={olaylar.gold} />
              <Text style={styles.levelText}>Seviye {header.level}</Text>
            </View>
            <Text style={styles.xpText}>
              {header.xp} / {header.xpTarget} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${Math.round(xpProgress * 100)}%` }]} />
          </View>
        </View>

        <Pressable
          onPress={onResourcePress}
          style={({ pressed }) => [styles.resourcePill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Kaynak ${header.resourceLabel}`}>
          <View style={styles.resourceIconWrap}>
            <Ionicons name="layers" size={14} color={olaylar.gold} />
          </View>
          <View style={styles.resourceCopy}>
            <Text style={styles.resourceAmount} numberOfLines={1}>
              {header.resourceLabel}
            </Text>
            <Text style={styles.resourceLabel}>Kaynak</Text>
          </View>
          <Ionicons name="add-circle" size={16} color={olaylar.gold} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: olaylar.screenPadding,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: olaylar.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: olaylar.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: olaylar.textMuted,
    lineHeight: 16,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(216, 167, 46, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(216, 167, 46, 0.28)',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: olaylar.gold,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: olaylar.textSoft,
  },
  xpTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 2,
    maxWidth: 180,
  },
  xpFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: olaylar.teal,
  },
  resourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: olaylar.panel,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: 132,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(216, 167, 46, 0.25)',
  },
  resourceIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(216, 167, 46, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  resourceAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: olaylar.text,
  },
  resourceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
