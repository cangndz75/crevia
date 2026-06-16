import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CENTER_SUPPORT_SECTION_MARGIN } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterOperationSignalItem,
  CenterOperationSignals,
  CenterOperationSignalTone,
} from '@/features/hub/utils/centerOperationSignalsPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  card: '#F7F0E4',
  cardWarm: '#FFF3D5',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#E8F4EF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  red: '#B85A4B',
  text: '#173D3A',
  muted: '#6D736C',
  border: 'rgba(7, 86, 79, 0.14)',
  white: '#FFFFFF',
} as const;

const toneStyles: Record<
  CenterOperationSignalTone,
  { accent: string; border: string; gradient: [string, string]; pill: string }
> = {
  success: {
    accent: palette.green,
    border: 'rgba(62,158,106,0.28)',
    gradient: ['#EAF7ED', '#DDEEE5'],
    pill: 'rgba(62,158,106,0.12)',
  },
  stable: {
    accent: palette.tealMid,
    border: palette.border,
    gradient: [palette.tealSoft, '#ECF5EF'],
    pill: palette.tealSoft,
  },
  warning: {
    accent: palette.amber,
    border: 'rgba(199,137,37,0.32)',
    gradient: ['#FFE5A2', '#F8E2B8'],
    pill: 'rgba(199,137,37,0.12)',
  },
  urgent: {
    accent: palette.red,
    border: 'rgba(184,90,75,0.28)',
    gradient: ['#FCF3F1', '#F8E8E4'],
    pill: 'rgba(184,90,75,0.1)',
  },
  neutral: {
    accent: palette.muted,
    border: palette.border,
    gradient: ['#FAF8F2', '#F3EEE3'],
    pill: 'rgba(7, 86, 79, 0.06)',
  },
};

type CenterOperationSignalsSectionProps = {
  signalsSection: CenterOperationSignals;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'bus-outline': 'bus-outline',
    'leaf-outline': 'leaf-outline',
    'flash-outline': 'flash-outline',
    'people-outline': 'people-outline',
    'cube-outline': 'cube-outline',
    'construct-outline': 'construct-outline',
    'pulse-outline': 'pulse-outline',
    'trending-up-outline': 'trending-up-outline',
    'flag-outline': 'flag-outline',
    'checkmark-circle-outline': 'checkmark-circle-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'people-circle-outline': 'people-circle-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function severityLabel(severity: CenterOperationSignalItem['severity']): string {
  switch (severity) {
    case 'urgent':
      return 'ACİL';
    case 'high':
      return 'YÜKSEK';
    case 'medium':
      return 'ORTA';
    default:
      return 'DÜŞÜK';
  }
}

function SignalCard({
  signal,
  reducedMotion,
  compact,
}: {
  signal: CenterOperationSignalItem;
  reducedMotion: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const tone = toneStyles[signal.tone];
  const clickable = Boolean(signal.route) && signal.actionKey !== 'none';
  const highlight = !reducedMotion && signal.motionHint?.shouldHighlight;

  const handlePress = () => {
    if (!clickable || !signal.route) return;
    playLightImpactHaptic();
    router.push(signal.route as Href);
  };

  const content = (
    <>
      <View style={[styles.accentBar, { backgroundColor: tone.accent }]} />
      <LinearGradient
        colors={tone.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconRing}>
        <View style={styles.iconCore}>
          <Ionicons name={resolveIcon(signal.iconKey)} size={18} color={tone.accent} />
        </View>
      </LinearGradient>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <View style={[styles.liveDot, { backgroundColor: tone.accent }]} />
          <Text style={styles.title} numberOfLines={1}>
            {signal.title}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={compact ? 2 : 2}>
          {signal.description}
        </Text>
        {signal.helperText ? (
          <Text style={styles.helperText} numberOfLines={1}>
            {signal.helperText}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailing}>
        <Text style={styles.impactLabel}>ETKİ</Text>
        <View style={[styles.impactPill, { backgroundColor: tone.pill, borderColor: tone.border }]}>
          <Text style={[styles.impactValue, { color: tone.accent }]} numberOfLines={1}>
            {severityLabel(signal.severity)}
          </Text>
        </View>
        {clickable ? (
          <View style={styles.chevronBtn}>
            <Ionicons name="chevron-forward" size={14} color={palette.tealMid} />
          </View>
        ) : null}
      </View>
    </>
  );

  if (!clickable) {
    return (
      <View
        style={[
          styles.card,
          { borderColor: tone.border },
          highlight ? styles.cardHighlight : undefined,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${signal.title}. ${signal.description}`}>
        {content}
      </View>
    );
  }

  return (
    <CreviaAnimatedPressable
      onPress={handlePress}
      reducedMotion={reducedMotion}
      accessibilityRole="button"
      accessibilityLabel={signal.title}
      style={[
        styles.card,
        { borderColor: tone.border },
        highlight ? styles.cardHighlight : undefined,
      ]}>
      {content}
    </CreviaAnimatedPressable>
  );
}

export function CenterOperationSignalsSection({
  signalsSection,
  visibility,
  reducedMotion = false,
}: CenterOperationSignalsSectionProps) {
  const router = useRouter();
  const isVisible = (visibility ?? signalsSection.visibility) !== 'hidden';

  if (!isVisible || signalsSection.signals.length === 0) {
    return null;
  }

  const handleViewAll = () => {
    if (!signalsSection.cta?.enabled || !signalsSection.cta.route) return;
    playLightImpactHaptic();
    router.push(signalsSection.cta.route as Href);
  };

  const isEmptyMode = signalsSection.displayMode === 'empty';

  return (
    <View style={styles.section} accessibilityLabel={signalsSection.accessibilityLabel}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionEyebrow}>OPERASYON SİNYALLERİ</Text>
          {signalsSection.subtitle ? (
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              {signalsSection.subtitle}
            </Text>
          ) : null}
        </View>
        {signalsSection.showViewAll && signalsSection.cta?.enabled ? (
          <CreviaAnimatedPressable
            onPress={handleViewAll}
            reducedMotion={reducedMotion}
            accessibilityRole="button"
            accessibilityLabel={signalsSection.cta.label}
            style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>TÜMÜNÜ GÖR</Text>
          </CreviaAnimatedPressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {signalsSection.signals.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            reducedMotion={reducedMotion}
            compact={isEmptyMode || signalsSection.displayMode === 'compact'}
          />
        ))}
      </View>

      {signalsSection.summaryLine && !isEmptyMode ? (
        <Text style={styles.summaryLine} numberOfLines={1}>
          {signalsSection.summaryLine}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: CENTER_SUPPORT_SECTION_MARGIN,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
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
  list: {
    paddingHorizontal: 2,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: palette.card,
    paddingVertical: 11,
    paddingRight: 10,
    paddingLeft: 0,
    gap: 10,
    overflow: 'hidden',
  },
  cardHighlight: {
    backgroundColor: palette.cardWarm,
    borderWidth: 1.5,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  iconRing: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.muted,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: palette.tealMid,
    fontWeight: '600',
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  impactLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: palette.muted,
  },
  impactPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 52,
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  chevronBtn: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: palette.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLine: {
    marginTop: 8,
    paddingHorizontal: 2,
    fontSize: 12,
    color: palette.muted,
    fontWeight: '500',
  },
});
