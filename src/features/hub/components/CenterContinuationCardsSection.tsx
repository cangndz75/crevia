import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CENTER_SUPPORT_SECTION_MARGIN } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterContinuationCard,
  CenterContinuationCards,
  CenterContinuationCardTone,
} from '@/features/hub/utils/centerContinuationCardsPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  card: '#FFFCF5',
  cardWarm: '#F8F4EB',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.08)',
  white: '#FFFFFF',
} as const;

const toneAccent: Record<
  CenterContinuationCardTone,
  { accent: string; pill: string; border: string }
> = {
  calm: { accent: palette.tealMid, pill: palette.tealSoft, border: palette.border },
  positive: { accent: palette.green, pill: 'rgba(62,158,106,0.1)', border: 'rgba(62,158,106,0.2)' },
  warning: { accent: palette.amber, pill: 'rgba(199,137,37,0.1)', border: 'rgba(199,137,37,0.22)' },
  teaching: { accent: palette.gold, pill: palette.goldSoft, border: 'rgba(216,167,46,0.22)' },
  neutral: { accent: palette.tealMid, pill: palette.tealSoft, border: palette.border },
};

type CenterContinuationCardsSectionProps = {
  continuation: CenterContinuationCards;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'checkmark-circle-outline': 'checkmark-circle-outline',
    'document-text-outline': 'document-text-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'book-outline': 'book-outline',
    'journal-outline': 'journal-outline',
    'time-outline': 'time-outline',
    'construct-outline': 'construct-outline',
    'people-outline': 'people-outline',
    'ribbon-outline': 'ribbon-outline',
    'sparkles-outline': 'sparkles-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function ContinuationMiniCard({
  card,
  layout,
  reducedMotion,
}: {
  card: CenterContinuationCard;
  layout: 'compact' | 'list';
  reducedMotion: boolean;
}) {
  const router = useRouter();
  const tone = toneAccent[card.tone] ?? toneAccent.neutral;
  const clickable = card.enabled && Boolean(card.route);
  const highlight = card.motionHint?.shouldHighlight && !reducedMotion;

  const handlePress = () => {
    if (!clickable || !card.route) return;
    playLightImpactHaptic();
    router.push(card.route as Href);
  };

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: tone.pill, borderColor: tone.border }]}>
        <Ionicons name={resolveIcon(card.iconKey)} size={14} color={tone.accent} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {card.title}
          </Text>
          {card.label ? (
            <View style={[styles.labelPill, { backgroundColor: tone.pill }]}>
              <Text style={[styles.labelText, { color: tone.accent }]} numberOfLines={1}>
                {card.label}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {card.body}
        </Text>
        {card.isLocked && card.lockedReason ? (
          <Text style={styles.lockedReason} numberOfLines={1}>
            {card.lockedReason}
          </Text>
        ) : null}
      </View>
      {clickable ? (
        <Ionicons name="chevron-forward" size={14} color={palette.tealMid} />
      ) : null}
    </>
  );

  const cardStyle = [
    styles.card,
    layout === 'compact' ? styles.cardCompact : styles.cardList,
    { borderColor: tone.border },
    highlight ? styles.cardHighlight : undefined,
    card.isLocked ? styles.cardLocked : undefined,
  ];

  if (!clickable) {
    return (
      <View style={cardStyle} accessibilityRole="text" accessibilityLabel={`${card.title}. ${card.body}`}>
        {content}
      </View>
    );
  }

  return (
    <CreviaAnimatedPressable
      onPress={handlePress}
      reducedMotion={reducedMotion}
      accessibilityRole="button"
      accessibilityLabel={card.title}
      style={cardStyle}>
      {content}
    </CreviaAnimatedPressable>
  );
}

export function CenterContinuationCardsSection({
  continuation,
  visibility,
  reducedMotion = false,
}: CenterContinuationCardsSectionProps) {
  const isVisible = (visibility ?? continuation.visibility) !== 'hidden';

  if (!isVisible || continuation.cards.length === 0) {
    return null;
  }

  const layout = continuation.displayMode === 'list' ? 'list' : 'compact';

  return (
    <View style={styles.section} accessibilityLabel={continuation.accessibilityLabel}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionEyebrow}>
          {(continuation.title ?? 'Devam').toLocaleUpperCase('tr-TR')}
        </Text>
        {continuation.helperText ? (
          <Text style={styles.helperText} numberOfLines={1}>
            {continuation.helperText}
          </Text>
        ) : null}
      </View>

      <View style={layout === 'compact' && continuation.cards.length === 2 ? styles.row : styles.list}>
        {continuation.cards.map((card) => (
          <View
            key={card.id}
            style={layout === 'compact' && continuation.cards.length === 2 ? styles.rowCell : undefined}>
            <ContinuationMiniCard card={card} layout={layout} reducedMotion={reducedMotion} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: CENTER_SUPPORT_SECTION_MARGIN,
  },
  headerRow: {
    marginBottom: 8,
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: palette.tealMid,
  },
  helperText: {
    fontSize: 11,
    color: palette.muted,
    fontWeight: '500',
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowCell: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 68,
  },
  cardCompact: {
    minHeight: 72,
  },
  cardList: {
    minHeight: 68,
  },
  cardHighlight: {
    backgroundColor: palette.cardWarm,
  },
  cardLocked: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#173D3A',
  },
  labelPill: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 84,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 11,
    lineHeight: 15,
    color: palette.muted,
    fontWeight: '500',
  },
  lockedReason: {
    fontSize: 10,
    color: palette.tealMid,
    fontWeight: '600',
  },
});
