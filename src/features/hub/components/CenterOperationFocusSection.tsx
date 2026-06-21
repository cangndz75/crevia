import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterOperationFocus,
  CenterOperationFocusItem,
} from '@/features/hub/utils/centerOperationFocusPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';
import { CENTER_COMPACT_BREAKPOINT } from '@/features/hub/utils/centerLayoutTokens';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  cream: '#F7F3E7',
  card: '#FFFFFF',
  deepGreen: '#064E45',
  teal: '#07564F',
  muted: '#6B7D78',
  border: 'rgba(6, 78, 69, 0.12)',
} as const;

type CenterOperationFocusSectionProps = {
  focus: CenterOperationFocus;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
  onViewAllPress?: () => void;
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'locate-outline': 'locate-outline',
    'map-outline': 'map-outline',
    'people-outline': 'people-outline',
    'pulse-outline': 'pulse-outline',
    'bus-outline': 'bus-outline',
    'leaf-outline': 'leaf-outline',
    'flash-outline': 'flash-outline',
    'cube-outline': 'cube-outline',
    'construct-outline': 'construct-outline',
    'grid-outline': 'grid-outline',
    'flag-outline': 'flag-outline',
    'navigate-outline': 'navigate-outline',
    'radio-outline': 'radio-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function FocusTile({
  item,
  compact,
  reducedMotion,
}: {
  item: CenterOperationFocusItem;
  compact: boolean;
  reducedMotion: boolean;
}) {
  const router = useRouter();
  const clickable = Boolean(item.route) && !item.isLocked;

  const handlePress = () => {
    if (!clickable || !item.route) return;
    playLightImpactHaptic();
    router.push(item.route as Href);
  };

  const content = (
    <>
      <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
        <Ionicons
          name={resolveIcon(item.iconKey)}
          size={compact ? 20 : 22}
          color={item.isLocked ? palette.muted : palette.deepGreen}
        />
      </View>
      <Text
        style={[styles.tileLabel, compact && styles.tileLabelCompact, item.isLocked && styles.tileLabelMuted]}
        numberOfLines={2}>
        {item.title}
      </Text>
    </>
  );

  if (!clickable) {
    return (
      <View style={styles.tile} accessibilityRole="text" accessibilityLabel={item.title}>
        {content}
      </View>
    );
  }

  return (
    <CreviaAnimatedPressable
      onPress={handlePress}
      reducedMotion={reducedMotion}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={styles.tile}>
      {content}
    </CreviaAnimatedPressable>
  );
}

export function CenterOperationFocusSection({
  focus,
  visibility,
  reducedMotion = false,
  onViewAllPress,
}: CenterOperationFocusSectionProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width <= CENTER_COMPACT_BREAKPOINT;
  const isVisible = (visibility ?? focus.visibility) !== 'hidden';

  if (!isVisible || focus.items.length === 0) return null;

  const showViewAll = focus.showViewAll || Boolean(focus.cta?.route);
  const viewAllEnabled = focus.cta?.enabled !== false;

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
      return;
    }
    const route = focus.cta?.route ?? '/events';
    if (!viewAllEnabled) return;
    playLightImpactHaptic();
    router.push(route as Href);
  };

  return (
    <View style={styles.section} accessibilityLabel={focus.accessibilityLabel}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {focus.title}
        </Text>
        {showViewAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tümünü gör"
            onPress={handleViewAll}
            disabled={!viewAllEnabled}
            hitSlop={8}
            style={({ pressed }) => [styles.viewAllBtn, pressed && viewAllEnabled ? styles.viewAllPressed : undefined]}>
            <Text style={[styles.viewAllText, !viewAllEnabled && styles.viewAllTextMuted]} numberOfLines={1}>
              Tümünü Gör
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={viewAllEnabled ? palette.teal : palette.muted}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.tilesRow}>
          {focus.items.slice(0, 4).map((item) => (
            <FocusTile key={item.id} item={item} compact={compact} reducedMotion={reducedMotion} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: palette.deepGreen,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  viewAllPressed: {
    opacity: 0.75,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.teal,
  },
  viewAllTextMuted: {
    color: palette.muted,
  },
  card: {
    borderRadius: 24,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowColor: 'rgba(15, 60, 52, 0.12)',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
    minHeight: 96,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 78, 69, 0.06)',
  },
  iconCircleCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  tileLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.deepGreen,
    textAlign: 'center',
    minHeight: 28,
  },
  tileLabelCompact: {
    fontSize: 10,
    lineHeight: 13,
    minHeight: 26,
  },
  tileLabelMuted: {
    color: palette.muted,
  },
});
