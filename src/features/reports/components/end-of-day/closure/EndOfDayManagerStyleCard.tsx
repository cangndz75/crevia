import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EndOfDayManagerStyleSurface } from '@/features/reports/presentation/closure/endOfDayManagerStylePresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { shadows } from '@/ui/theme/shadows';

const CARD_GRADIENT = ['#043A36', '#07564F', '#0A6B62'] as const;
const CREAM_SURFACE = '#F7F3EB';

const TONE_ACCENT: Record<EndOfDayManagerStyleSurface['styleTone'], string> = {
  balanced: gameUi.colors.goldAccent,
  risk: '#7EB8FF',
  resource: '#9AD4B0',
  public: '#FFD27A',
  crisis: '#FF9B7A',
  recovery: '#B8E0D2',
};

const SIGNAL_TONE: Record<
  EndOfDayManagerStyleSurface['behaviorSignals'][number]['tone'],
  { bg: string; text: string }
> = {
  positive: { bg: 'rgba(154, 212, 176, 0.18)', text: '#9AD4B0' },
  warning: { bg: 'rgba(255, 210, 122, 0.18)', text: '#FFD27A' },
  neutral: { bg: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255,255,255,0.82)' },
};

const IMPACT_TONE: Record<
  EndOfDayManagerStyleSurface['impactChips'][number]['tone'],
  string
> = {
  positive: '#9AD4B0',
  warning: '#FFD27A',
  neutral: 'rgba(255,255,255,0.78)',
};

type Props = {
  model: EndOfDayManagerStyleSurface;
  reducedMotion?: boolean;
  onCtaPress?: () => void;
};

export function EndOfDayManagerStyleCard({ model, reducedMotion, onCtaPress }: Props) {
  if (!model.visible) return null;

  const accent = TONE_ACCENT[model.styleTone];
  const entering = reducedMotion ? undefined : FadeInUp.delay(80).duration(280).springify().damping(24);

  return (
    <Animated.View entering={entering} style={[styles.outer, shadows.card]}>
      <LinearGradient
        colors={[...CARD_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.sectionKicker}>Yönetici profili</Text>
            <Text style={styles.headline}>{model.headline}</Text>
          </View>
          {model.status === 'early_signal' ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText} numberOfLines={1}>
                Erken sinyal
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.badge, { borderColor: accent }]}>
          <Ionicons name="ribbon-outline" size={14} color={accent} />
          <Text style={[styles.badgeText, { color: accent }]} numberOfLines={1}>
            {model.styleLabel}
          </Text>
        </View>

        <Text style={styles.summary} numberOfLines={3}>
          {model.summary}
        </Text>

        {model.behaviorSignals.length > 0 ? (
          <View style={styles.chipRow}>
            {model.behaviorSignals.map((signal) => {
              const tone = SIGNAL_TONE[signal.tone];
              return (
                <View key={signal.id} style={[styles.signalChip, { backgroundColor: tone.bg }]}>
                  <Text style={styles.signalLabel} numberOfLines={1}>
                    {signal.label}
                  </Text>
                  <Text style={[styles.signalValue, { color: tone.text }]} numberOfLines={1}>
                    {signal.value}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {model.impactChips.length > 0 ? (
          <View style={styles.impactRow}>
            {model.impactChips.map((chip) => (
              <View key={chip.id} style={styles.impactChip}>
                <Text style={styles.impactLabel} numberOfLines={1}>
                  {chip.label}
                </Text>
                <Text style={[styles.impactValue, { color: IMPACT_TONE[chip.tone] }]} numberOfLines={1}>
                  {chip.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {model.positiveReinforcement ? (
          <View style={styles.reinforcementRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color={gameUi.colors.goldAccent} />
            <Text style={styles.reinforcementText} numberOfLines={2}>
              {model.positiveReinforcement}
            </Text>
          </View>
        ) : null}

        {model.dominantWarning ? (
          <View style={styles.warningBox}>
            <View style={styles.warningHeader}>
              <Ionicons name="pulse-outline" size={14} color="#FFD27A" />
              <Text style={styles.warningTitle} numberOfLines={1}>
                {model.dominantWarning.title}
              </Text>
            </View>
            <Text style={styles.warningMessage} numberOfLines={3}>
              {model.dominantWarning.message}
            </Text>
          </View>
        ) : null}

        <View style={styles.advisorBox}>
          <Text style={styles.advisorLabel}>Ece</Text>
          <Text style={styles.advisorLine} numberOfLines={3}>
            {model.advisorLine}
          </Text>
        </View>

        {model.ctaLabel && onCtaPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onCtaPress}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={styles.ctaText}>{model.ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={CREAM_SURFACE} />
          </Pressable>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 22,
    overflow: 'hidden',
    minWidth: 0,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: gameUi.colors.goldAccent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    maxWidth: '38%',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.14)',
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signalChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 0,
    maxWidth: '48%',
    gap: 2,
  },
  signalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
  },
  signalValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  impactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  impactChip: {
    minWidth: 0,
    gap: 1,
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  impactValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  reinforcementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(216, 167, 46, 0.12)',
  },
  reinforcementText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
  },
  warningBox: {
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 210, 122, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 210, 122, 0.22)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD27A',
    flexShrink: 1,
  },
  warningMessage: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.86)',
  },
  advisorBox: {
    gap: 4,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  advisorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: gameUi.colors.goldAccent,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  advisorLine: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.82)',
    fontStyle: 'italic',
  },
  cta: {
    marginTop: 2,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(247, 243, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(247, 243, 235, 0.28)',
  },
  ctaPressed: {
    opacity: 0.82,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: CREAM_SURFACE,
  },
});
