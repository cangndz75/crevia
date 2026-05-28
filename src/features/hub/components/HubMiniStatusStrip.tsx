import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import {
  deriveHubStatusStrip,
  type HubStatusStripItem,
} from '@/features/hub/utils/hubDerived';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type StripIconConfig = {
  name: keyof typeof Ionicons.glyphMap;
  bg: string;
};

const stripIconConfig: Record<HubStatusStripItem['id'], StripIconConfig> = {
  satisfaction: { name: 'happy', bg: colors.success },
  risk: { name: 'warning', bg: colors.warning },
  team: { name: 'people', bg: colors.purple },
  activeEvents: { name: 'alert-circle', bg: colors.danger },
};

function StatusCell({ item }: { item: HubStatusStripItem }) {
  const icon = stripIconConfig[item.id];

  return (
    <View style={styles.cell}>
      <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={14} color="#FFFFFF" />
      </View>
      <Text style={styles.value}>{item.value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}

export function HubMiniStatusStrip() {
  const input = useHubDerivedInput();
  const resources = useGameStore((s) => s.resources);
  const items = useMemo(
    () => deriveHubStatusStrip(input, resources),
    [input, resources],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.card, shadows.soft]}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.cellWrap}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <StatusCell item={item} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: spacing.lg,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 2,
    zIndex: 2,
  },
  cellWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
    paddingHorizontal: 2,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 18,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 11,
    maxWidth: 72,
  },
});
