import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CENTER_SUPPORT_SECTION_MARGIN } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterOperationFocus,
  CenterOperationFocusItem,
  CenterOperationFocusItemTone,
} from '@/features/hub/utils/centerOperationFocusPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  cream: '#FFFCF5',
  warm: '#FFF3D7',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealDark: '#043A36',
  tealSoft: '#DFF1EB',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  red: '#B85A4B',
  text: '#173D3A',
  muted: '#68746E',
  border: 'rgba(7, 86, 79, 0.12)',
  white: '#FFFFFF',
} as const;

const toneAccent: Record<
  CenterOperationFocusItemTone,
  { border: string; accent: string; pill: string; gradient: [string, string] }
> = {
  success: {
    border: 'rgba(62,158,106,0.30)',
    accent: palette.green,
    pill: 'rgba(62,158,106,0.12)',
    gradient: ['#FFF9E8', '#E6F6EA'],
  },
  stable: {
    border: palette.border,
    accent: palette.tealMid,
    pill: palette.tealSoft,
    gradient: ['#FFF8E6', '#E8F4EF'],
  },
  warning: {
    border: 'rgba(199,137,37,0.36)',
    accent: palette.amber,
    pill: 'rgba(199,137,37,0.12)',
    gradient: ['#FFF2D2', '#F8E7B5'],
  },
  urgent: {
    border: 'rgba(184,90,75,0.34)',
    accent: palette.red,
    pill: 'rgba(184,90,75,0.10)',
    gradient: ['#FFF1DB', '#F8DED8'],
  },
  locked: {
    border: 'rgba(7, 86, 79, 0.10)',
    accent: palette.gold,
    pill: 'rgba(216,167,46,0.13)',
    gradient: ['#F8F2E6', '#EEE7D9'],
  },
  neutral: {
    border: palette.border,
    accent: palette.tealMid,
    pill: palette.tealSoft,
    gradient: ['#FFF8E6', '#EFF7F4'],
  },
};

type CenterOperationFocusSectionProps = {
  focus: CenterOperationFocus;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
  onViewAllPress?: () => void;
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'bus-outline': 'bus-outline',
    'leaf-outline': 'leaf-outline',
    'flash-outline': 'flash-outline',
    'people-outline': 'people-outline',
    'cube-outline': 'cube-outline',
    'construct-outline': 'construct-outline',
    'grid-outline': 'grid-outline',
    'flag-outline': 'flag-outline',
    'map-outline': 'map-outline',
    'navigate-outline': 'navigate-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function statusLabel(item: CenterOperationFocusItem): string {
  if (item.isLocked) return item.statusLabel || 'Kilitli';
  if (item.isActiveTargetDomain) return 'Hazır';
  return item.statusLabel;
}

function FocusChip({ item }: { item: CenterOperationFocusItem }) {
  const tone = toneAccent[item.tone] ?? toneAccent.neutral;
  return (
    <View style={[styles.chip, { backgroundColor: tone.pill, borderColor: tone.border }]}>
      <Ionicons name={resolveIcon(item.iconKey)} size={12} color={tone.accent} />
      <Text style={[styles.chipText, { color: tone.accent }]} numberOfLines={1}>
        {item.title}
      </Text>
    </View>
  );
}

export function CenterOperationFocusSection({
  focus,
  visibility,
  reducedMotion = false,
  onViewAllPress,
}: CenterOperationFocusSectionProps) {
  const router = useRouter();
  const isVisible = (visibility ?? focus.visibility) !== 'hidden';

  if (!isVisible || focus.items.length === 0) return null;

  const primary =
    focus.items.find((item) => item.domain === focus.selectedDomain) ?? focus.items[0];
  const supporting = focus.items.filter((item) => item.id !== primary.id).slice(0, 3);
  const tone = toneAccent[primary.tone] ?? toneAccent.neutral;
  const clickable = Boolean(primary.route) && !primary.isLocked;

  const handlePress = () => {
    if (onViewAllPress) {
      onViewAllPress();
      return;
    }
    const route = primary.route ?? focus.cta?.route;
    if (!route || primary.isLocked || focus.cta?.enabled === false) return;
    playLightImpactHaptic();
    router.push(route as Href);
  };

  const content = (
    <LinearGradient
      colors={tone.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroGradient}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroCopy}>
          <Text style={styles.sectionLabel} numberOfLines={1}>
            OPERASYON HUB
          </Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {primary.isLocked ? 'İlk Operasyon Hazırlanıyor' : primary.title}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: tone.pill, borderColor: tone.border }]}>
          <Text style={[styles.statusText, { color: tone.accent }]} numberOfLines={1}>
            {statusLabel(primary)}
          </Text>
        </View>
      </View>

      <View style={styles.heroBodyRow}>
        <View style={[styles.heroIcon, { backgroundColor: palette.white, borderColor: tone.border }]}>
          <Ionicons name={resolveIcon(primary.iconKey)} size={22} color={tone.accent} />
        </View>
        <View style={styles.heroBodyCopy}>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {primary.subtitle ?? focus.subtitle ?? 'Bugünün operasyon kararı burada netleşir.'}
          </Text>
          <View style={styles.rewardRow}>
            <View style={styles.rewardChip}>
              <Text style={styles.rewardText} numberOfLines={1}>
                {primary.sourceLabel}
              </Text>
            </View>
            {supporting.slice(0, 2).map((item) => (
              <FocusChip key={item.id} item={item} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.contextLine} numberOfLines={2}>
          {focus.helperText ?? 'Bu operasyon tamamlanınca yeni sinyaller açılır.'}
        </Text>
        <View style={[styles.cta, !clickable ? styles.ctaDisabled : undefined]}>
          <Text style={styles.ctaText} numberOfLines={1}>
            {focus.cta?.label ?? (clickable ? 'İncele' : 'Yakında')}
          </Text>
          {clickable ? <Ionicons name="chevron-forward" size={14} color={palette.teal} /> : null}
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.section} accessibilityLabel={focus.accessibilityLabel}>
      {clickable ? (
        <CreviaAnimatedPressable
          onPress={handlePress}
          reducedMotion={reducedMotion}
          accessibilityRole="button"
          accessibilityLabel={`${primary.title}. ${primary.statusLabel}`}
          style={[styles.heroCard, { borderColor: tone.border }]}>
          {content}
        </CreviaAnimatedPressable>
      ) : (
        <View
          style={[styles.heroCard, { borderColor: tone.border }]}
          accessibilityRole="text"
          accessibilityLabel={`${primary.title}. ${primary.statusLabel}`}>
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: CENTER_SUPPORT_SECTION_MARGIN,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: palette.cream,
  },
  heroGradient: {
    padding: 15,
    gap: 13,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: palette.tealMid,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: palette.tealDark,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: 116,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  heroBodyRow: {
    flexDirection: 'row',
    gap: 11,
    minWidth: 0,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroBodyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 9,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: palette.text,
  },
  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rewardChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.22)',
    maxWidth: 136,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.gold,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
    maxWidth: 126,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '900',
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  contextLine: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: palette.muted,
  },
  cta: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: palette.goldSoft,
    flexShrink: 0,
    maxWidth: 126,
  },
  ctaDisabled: {
    opacity: 0.68,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.teal,
  },
});
