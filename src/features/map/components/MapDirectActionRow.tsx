import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  MapActionBundleChip,
  MapActionBundlePresentation,
  MapDirectActionPresentation,
} from '@/core/mapDirectAction';
import { CreviaAnimatedPressable } from '@/shared/motion';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type MapDirectActionRowProps = {
  bundle: MapActionBundlePresentation;
  compact?: boolean;
  reducedMotion?: boolean;
  onActionPress: (action: MapDirectActionPresentation) => void;
};

function chipToneColor(tone: MapActionBundleChip['tone']) {
  switch (tone) {
    case 'positive':
    case 'active':
      return mapUi.teal;
    case 'warning':
    case 'critical':
      return '#F59E0B';
    case 'mixed':
      return mapUi.gold;
    default:
      return mapUi.textMuted;
  }
}

export function MapDirectActionRow({
  bundle,
  compact = false,
  reducedMotion = false,
  onActionPress,
}: MapDirectActionRowProps) {
  const primary = bundle.primaryAction;
  const secondaries = bundle.secondaryActions.filter((action) => action.enabled);

  return (
    <View style={styles.wrap}>
      {bundle.chips.length > 0 ? (
        <View style={styles.chipRow}>
          {bundle.chips.map((chip) => (
            <View key={`${chip.label}:${chip.value ?? ''}`} style={styles.infoChip}>
              <View style={[styles.chipDot, { backgroundColor: chipToneColor(chip.tone) }]} />
              <Text style={styles.chipLabel} numberOfLines={1}>
                {chip.label}
                {chip.value ? `: ${chip.value}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {primary ? (
        <CreviaAnimatedPressable
          onPress={() => onActionPress(primary)}
          reducedMotion={reducedMotion}
          pressScale={0.975}
          accessibilityRole="button"
          accessibilityLabel={primary.label}
          style={styles.primaryWrap}>
          <LinearGradient
            colors={['#0F766E', '#0D9488', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryBtn, compact && styles.primaryBtnCompact]}>
            <Text style={styles.primaryText} numberOfLines={1}>
              {primary.label}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#ECFDF5" />
          </LinearGradient>
        </CreviaAnimatedPressable>
      ) : null}

      {secondaries.length > 0 ? (
        <View style={styles.secondaryRow}>
          {secondaries.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onActionPress(action)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={action.label}>
              <Text style={styles.secondaryText} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: '100%',
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: mapUi.textSoft,
    flexShrink: 1,
  },
  primaryWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnCompact: {
    minHeight: 40,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ECFDF5',
    letterSpacing: 0.15,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  secondaryBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: mapUi.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    maxWidth: '100%',
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: mapUi.textSoft,
  },
  pressed: {
    opacity: 0.88,
  },
});
