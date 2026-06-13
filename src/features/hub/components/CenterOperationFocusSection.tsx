import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterOperationFocus,
  CenterOperationFocusItem,
  CenterOperationFocusItemTone,
} from '@/features/hub/utils/centerOperationFocusPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  card: '#FFFCF5',
  cardWarm: '#FDF5E6',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  green: '#3E9E6A',
  amber: '#C78925',
  red: '#B85A4B',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.1)',
  white: '#FFFFFF',
} as const;

const toneAccent: Record<
  CenterOperationFocusItemTone,
  { border: string; accent: string; pill: string }
> = {
  success: {
    border: 'rgba(62,158,106,0.28)',
    accent: palette.green,
    pill: 'rgba(62,158,106,0.12)',
  },
  stable: {
    border: palette.border,
    accent: palette.tealMid,
    pill: palette.tealSoft,
  },
  warning: {
    border: 'rgba(199,137,37,0.32)',
    accent: palette.amber,
    pill: 'rgba(199,137,37,0.12)',
  },
  urgent: {
    border: 'rgba(184,90,75,0.32)',
    accent: palette.red,
    pill: 'rgba(184,90,75,0.1)',
  },
  locked: {
    border: 'rgba(7, 86, 79, 0.08)',
    accent: palette.muted,
    pill: 'rgba(7, 86, 79, 0.06)',
  },
  neutral: {
    border: palette.border,
    accent: palette.tealMid,
    pill: palette.tealSoft,
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

function FocusDomainCard({
  item,
  selected,
  reducedMotion,
}: {
  item: CenterOperationFocusItem;
  selected: boolean;
  reducedMotion: boolean;
}) {
  const router = useRouter();
  const tone = toneAccent[item.tone];
  const clickable = Boolean(item.route) && !item.isLocked;
  const highlight =
    !reducedMotion && (selected || item.motionHint?.shouldHighlight);

  const handlePress = () => {
    if (!clickable || !item.route) return;
    playLightImpactHaptic();
    router.push(item.route as Href);
  };

  const content = (
    <>
      <View style={[styles.iconRing, { backgroundColor: tone.pill, borderColor: tone.border }]}>
        <Ionicons name={resolveIcon(item.iconKey)} size={18} color={tone.accent} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <View style={[styles.statusPill, { backgroundColor: tone.pill }]}>
        <Text style={[styles.statusLabel, { color: tone.accent }]} numberOfLines={1}>
          {item.statusLabel}
        </Text>
      </View>
      {item.subtitle ? (
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      ) : null}
    </>
  );

  if (!clickable) {
    return (
      <View
        style={[
          styles.card,
          { borderColor: tone.border },
          highlight ? styles.cardActive : undefined,
          item.isLocked ? styles.cardLocked : undefined,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${item.title}. ${item.statusLabel}. ${item.subtitle ?? ''}`}>
        {content}
      </View>
    );
  }

  return (
    <CreviaAnimatedPressable
      onPress={handlePress}
      reducedMotion={reducedMotion}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.statusLabel}`}
      style={[
        styles.card,
        { borderColor: tone.border },
        highlight ? styles.cardActive : undefined,
      ]}>
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
  const isVisible = (visibility ?? focus.visibility) !== 'hidden';

  if (!isVisible || focus.items.length === 0) {
    return null;
  }

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
      return;
    }
    if (focus.cta?.enabled && focus.cta.route) {
      playLightImpactHaptic();
      router.push(focus.cta.route as Href);
    }
  };

  const useCarousel =
    focus.displayMode === 'carousel' ||
    focus.displayMode === 'locked' ||
    focus.displayMode === 'empty' ||
    focus.items.length >= 3;

  return (
    <View style={styles.section} accessibilityLabel={focus.accessibilityLabel}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionEyebrow}>OPERASYON ODAĞI</Text>
          {focus.subtitle ? (
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              {focus.subtitle}
            </Text>
          ) : null}
        </View>
        {focus.showViewAll && focus.cta?.enabled ? (
          <CreviaAnimatedPressable
            onPress={handleViewAll}
            reducedMotion={reducedMotion}
            accessibilityRole="button"
            accessibilityLabel={focus.cta.label}
            style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>TÜMÜNÜ GÖR</Text>
          </CreviaAnimatedPressable>
        ) : null}
      </View>

      {useCarousel ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}>
          {focus.items.map((item) => (
            <FocusDomainCard
              key={item.id}
              item={item}
              selected={item.domain === focus.selectedDomain}
              reducedMotion={reducedMotion}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.compactRow}>
          {focus.items.map((item) => (
            <View key={item.id} style={styles.compactCell}>
              <FocusDomainCard
                item={item}
                selected={item.domain === focus.selectedDomain}
                reducedMotion={reducedMotion}
              />
            </View>
          ))}
        </View>
      )}

      {focus.helperText ? (
        <Text style={styles.helperText} numberOfLines={2}>
          {focus.helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 20,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
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
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: palette.tealMid,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  compactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  compactCell: {
    width: '48%',
    flexGrow: 1,
  },
  card: {
    width: 148,
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: palette.card,
    padding: 12,
    gap: 6,
  },
  cardActive: {
    borderWidth: 1.5,
    backgroundColor: palette.cardWarm,
  },
  cardLocked: {
    opacity: 0.88,
  },
  iconRing: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: palette.muted,
    fontWeight: '500',
  },
  helperText: {
    marginTop: 8,
    paddingHorizontal: 20,
    fontSize: 12,
    lineHeight: 17,
    color: palette.muted,
    fontWeight: '500',
  },
});
