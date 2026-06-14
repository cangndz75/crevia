import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type {
  CenterPortfolioItemModel,
  CenterPortfolioSurfaceModel,
  CenterPortfolioTone,
} from '@/features/hub/utils/centerDailyCapacityPortfolioPresentation';

const palette = {
  surface: '#FFFCF5',
  surfaceWarm: '#FFF6E6',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealDark: '#043A36',
  tealSoft: '#DFF1EB',
  gold: '#D8A72E',
  goldLight: '#FFE5A2',
  green: '#3E9E6A',
  red: '#C85A4B',
  text: '#173D3A',
  muted: '#68746E',
  border: 'rgba(7, 86, 79, 0.10)',
  white: '#FFFFFF',
} as const;

const toneColors: Record<CenterPortfolioTone, { icon: string; bg: string; border: string }> = {
  neutral: { icon: palette.tealMid, bg: palette.tealSoft, border: 'rgba(13,113,104,0.16)' },
  positive: { icon: palette.green, bg: '#E6F6EA', border: 'rgba(62,158,106,0.18)' },
  warning: { icon: palette.gold, bg: palette.surfaceWarm, border: 'rgba(216,167,46,0.24)' },
  locked: { icon: palette.muted, bg: '#EFEAE0', border: 'rgba(104,116,110,0.16)' },
};

type CenterPortfolioSurfaceProps = {
  portfolio: CenterPortfolioSurfaceModel;
};

function pressStyle(pressed: boolean) {
  return {
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.985 : 1 }],
  };
}

function PortfolioItem({ item }: { item: CenterPortfolioItemModel }) {
  const router = useRouter();
  const colors = toneColors[item.tone];
  const disabled = !item.isActionable || !item.ctaRoute;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        if (!item.ctaRoute) return;
        playLightImpactHaptic();
        router.push(item.ctaRoute as Href);
      }}
      style={({ pressed }) => [
        styles.itemRow,
        { backgroundColor: colors.bg, borderColor: colors.border },
        !disabled && pressed ? pressStyle(pressed) : undefined,
      ]}>
      <View style={[styles.itemIcon, { backgroundColor: palette.surface }]}>
        <Ionicons
          name={item.tone === 'positive' ? 'sparkles' : item.tone === 'warning' ? 'pulse' : 'radio'}
          size={15}
          color={colors.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      <View style={styles.itemCopy}>
        <View style={styles.itemMetaRow}>
          <Text style={styles.itemBadge} numberOfLines={1} ellipsizeMode="tail">
            {item.badgeLabel}
          </Text>
          <Text style={styles.itemStatus} numberOfLines={1} ellipsizeMode="tail">
            {item.statusLabel}
          </Text>
        </View>
        <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>
        <Text style={styles.itemDecision} numberOfLines={2} ellipsizeMode="tail">
          {item.decisionLine}
        </Text>
        {item.mapLine ? (
          <Text style={styles.itemMapLine} numberOfLines={1} ellipsizeMode="tail">
            {item.mapLine}
          </Text>
        ) : null}
      </View>
      <View style={[styles.itemAction, disabled ? styles.itemActionDisabled : undefined]}>
        <Ionicons
          name={disabled ? 'eye' : 'chevron-forward'}
          size={16}
          color={disabled ? palette.muted : palette.teal}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </Pressable>
  );
}

export function CenterPortfolioSurface({ portfolio }: CenterPortfolioSurfaceProps) {
  const router = useRouter();

  if (!portfolio.isVisible) return null;

  const tone = toneColors[portfolio.tone];
  const ctaDisabled = !portfolio.ctaRoute;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={portfolio.accessibilityLabel}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <Ionicons
            name="options"
            size={18}
            color={tone.icon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow} numberOfLines={1} ellipsizeMode="tail">
            {portfolio.title}
          </Text>
          <Text style={styles.summaryLine} numberOfLines={2} ellipsizeMode="tail">
            {portfolio.summaryLine}
          </Text>
        </View>
        <View style={styles.capacityPill}>
          <Text style={styles.capacityText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
            {portfolio.capacityLabel}
          </Text>
        </View>
      </View>

      {portfolio.primaryTradeoffLine ? (
        <Text style={styles.tradeoffLine} numberOfLines={2} ellipsizeMode="tail">
          {portfolio.primaryTradeoffLine}
        </Text>
      ) : null}

      <View style={styles.itemList}>
        {portfolio.items.map((item) => (
          <PortfolioItem key={item.id} item={item} />
        ))}
      </View>

      {portfolio.eceLine ? (
        <View style={styles.eceNote}>
          <Ionicons
            name="chatbubble-ellipses"
            size={14}
            color={palette.tealMid}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.eceText} numberOfLines={2} ellipsizeMode="tail">
            {portfolio.eceLine}
          </Text>
        </View>
      ) : null}

      {portfolio.ctaLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={portfolio.ctaLabel}
          accessibilityState={{ disabled: ctaDisabled }}
          disabled={ctaDisabled}
          onPress={() => {
            if (!portfolio.ctaRoute) return;
            playLightImpactHaptic();
            router.push(portfolio.ctaRoute as Href);
          }}
          style={({ pressed }) => [styles.ctaWrap, !ctaDisabled ? pressStyle(pressed) : undefined]}>
          <LinearGradient
            colors={ctaDisabled ? ['#EEE8DC', '#E4DED2'] : ['#FFE38D', '#E9AF34']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}>
            <Text style={[styles.ctaText, ctaDisabled ? styles.ctaTextDisabled : undefined]} numberOfLines={1}>
              {portfolio.ctaLabel}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={17}
              color={ctaDisabled ? palette.muted : palette.teal}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

const cardShadow = {
  shadowColor: palette.tealDark,
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 14,
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
  },
  summaryLine: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: palette.text,
  },
  capacityPill: {
    maxWidth: 108,
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.20)',
    flexShrink: 0,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.gold,
    fontVariant: ['tabular-nums'],
  },
  tradeoffLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: palette.muted,
  },
  itemList: {
    gap: 8,
  },
  itemRow: {
    minHeight: 76,
    borderRadius: 16,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    minWidth: 0,
  },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  itemBadge: {
    maxWidth: 92,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
    fontSize: 9,
    fontWeight: '900',
    color: palette.teal,
    backgroundColor: palette.surface,
    flexShrink: 1,
  },
  itemStatus: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '900',
    color: palette.muted,
  },
  itemTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: palette.text,
  },
  itemDecision: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.muted,
  },
  itemMapLine: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: palette.tealMid,
  },
  itemAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    flexShrink: 0,
  },
  itemActionDisabled: {
    opacity: 0.72,
  },
  eceNote: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.tealSoft,
    minWidth: 0,
  },
  eceText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: palette.teal,
  },
  ctaWrap: {
    alignSelf: 'flex-end',
    minWidth: 148,
    borderRadius: 999,
  },
  cta: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    color: palette.teal,
  },
  ctaTextDisabled: {
    color: palette.muted,
  },
});
