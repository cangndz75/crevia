import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CENTER_SUPPORT_SECTION_MARGIN } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterQuickActionItem,
  CenterQuickActions,
  CenterQuickActionTone,
} from '@/features/hub/utils/centerQuickActionsPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  card: '#FFFCF5',
  cardWarm: '#FDF5E6',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldDark: '#9B741D',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.1)',
  white: '#FFFFFF',
} as const;

const toneConfig: Record<
  CenterQuickActionTone,
  { color: string; gradient: [string, string]; ring: string }
> = {
  teal: {
    color: palette.teal,
    gradient: ['#F4FAF8', '#E4F2EE'],
    ring: palette.tealSoft,
  },
  gold: {
    color: palette.goldDark,
    gradient: ['#FFFAF0', '#F8EFD4'],
    ring: palette.goldSoft,
  },
  green: {
    color: palette.green,
    gradient: ['#F2FAF4', '#E2F3E8'],
    ring: '#E8F5EA',
  },
  warning: {
    color: palette.goldDark,
    gradient: ['#FFF8EE', '#F8EFD4'],
    ring: palette.goldSoft,
  },
  neutral: {
    color: palette.muted,
    gradient: ['#FAF8F2', '#F3EEE3'],
    ring: 'rgba(7, 86, 79, 0.06)',
  },
  locked: {
    color: palette.muted,
    gradient: ['#F6F4EF', '#EEE9DF'],
    ring: 'rgba(7, 86, 79, 0.05)',
  },
};

type CenterQuickActionsSectionProps = {
  quickActions: CenterQuickActions;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'flag-outline': 'flag-outline',
    'map-outline': 'map-outline',
    'document-text-outline': 'document-text-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'people-outline': 'people-outline',
    'cube-outline': 'cube-outline',
    'bus-outline': 'bus-outline',
    'leaf-outline': 'leaf-outline',
    'flash-outline': 'flash-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function QuickActionTile({
  item,
  reducedMotion,
}: {
  item: CenterQuickActionItem;
  reducedMotion: boolean;
}) {
  const router = useRouter();
  const tone = toneConfig[item.tone];
  const clickable = item.enabled && Boolean(item.route);
  const highlight = !reducedMotion && item.motionHint?.shouldHighlight;

  const handlePress = () => {
    if (!clickable || !item.route) return;
    playLightImpactHaptic();
    router.push(item.route as Href);
  };

  const content = (
    <>
      <View style={styles.topRow}>
        <View style={[styles.iconRing, { backgroundColor: tone.ring }]}>
          <View style={styles.iconCore}>
            <Ionicons name={resolveIcon(item.iconKey)} size={17} color={tone.color} />
          </View>
        </View>
        {item.badgeText ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {item.badgeText}
            </Text>
          </View>
        ) : clickable ? (
          <View style={styles.arrowChip}>
            <Ionicons name="arrow-forward" size={11} color={palette.tealMid} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, item.status !== 'available' ? styles.labelMuted : undefined]} numberOfLines={1}>
        {item.label}
      </Text>
      {item.description ? (
        <Text style={styles.description} numberOfLines={1}>
          {item.lockedReason ?? item.description}
        </Text>
      ) : null}
    </>
  );

  if (!clickable) {
    return (
      <View
        style={[
          styles.tileOuter,
          highlight ? styles.tileHighlight : undefined,
          item.status !== 'available' ? styles.tileLocked : undefined,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${item.label}. ${item.lockedReason ?? item.description ?? ''}`}>
        <LinearGradient colors={tone.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
          {content}
        </LinearGradient>
      </View>
    );
  }

  return (
    <CreviaAnimatedPressable
      onPress={handlePress}
      reducedMotion={reducedMotion}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={[styles.tileOuter, highlight ? styles.tileHighlight : undefined]}>
      <LinearGradient colors={tone.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
        {content}
      </LinearGradient>
    </CreviaAnimatedPressable>
  );
}

export const CenterQuickActionsSection = memo(function CenterQuickActionsSection({
  quickActions,
  visibility,
  reducedMotion = false,
}: CenterQuickActionsSectionProps) {
  const isVisible = (visibility ?? quickActions.visibility) !== 'hidden';

  if (!isVisible || quickActions.items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} accessibilityLabel={quickActions.accessibilityLabel}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionEyebrow}>HIZLI İŞLEMLER</Text>
          {quickActions.subtitle ? (
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              {quickActions.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {quickActions.helperText ? (
        <Text style={styles.helperBanner} numberOfLines={2}>
          {quickActions.helperText}
        </Text>
      ) : null}

      <View style={styles.grid}>
        {quickActions.items.map((item) => (
          <View key={item.id} style={styles.gridCell}>
            <QuickActionTile item={item} reducedMotion={reducedMotion} />
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: CENTER_SUPPORT_SECTION_MARGIN,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerCopy: {
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: palette.tealMid,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '500',
  },
  helperBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 17,
    color: palette.muted,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  gridCell: {
    width: '47.5%',
    flexGrow: 1,
  },
  tileOuter: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  tileHighlight: {
    borderColor: 'rgba(7, 86, 79, 0.22)',
    backgroundColor: palette.cardWarm,
  },
  tileLocked: {
    opacity: 0.9,
  },
  tile: {
    minHeight: 96,
    padding: 10,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconRing: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowChip: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: palette.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: 999,
    backgroundColor: palette.tealSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.tealMid,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#173D3A',
  },
  labelMuted: {
    color: palette.muted,
  },
  description: {
    fontSize: 10,
    lineHeight: 14,
    color: palette.muted,
    fontWeight: '500',
  },
});
