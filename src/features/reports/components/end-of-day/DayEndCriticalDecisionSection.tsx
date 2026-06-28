import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type {
  CriticalDecisionImpactTileModel,
  DayEndCriticalDecisionPresentation,
} from '@/features/reports/presentation/dayEndCriticalDecisionPresentation';
import {
  CreviaAnimatedPressable,
  CreviaMotionView,
} from '@/shared/motion';
import { gameUi } from '@/ui/theme/gameUiTokens';

type Props = {
  model: DayEndCriticalDecisionPresentation;
  reducedMotion?: boolean;
  onShowDayFlow?: () => void;
};

type ImpactToneStyle = {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const IMPACT_TONES: Record<CriticalDecisionImpactTileModel['tone'], ImpactToneStyle> = {
  positive: {
    bg: '#E8F7ED',
    border: 'rgba(62,158,106,0.20)',
    iconBg: '#D6F0DF',
    iconColor: gameUi.colors.mintPositive,
    valueColor: '#187246',
    icon: 'people-outline',
  },
  team: {
    bg: '#E8F2FA',
    border: 'rgba(65,126,169,0.18)',
    iconBg: '#D8EAF6',
    iconColor: '#327EA8',
    valueColor: '#B95042',
    icon: 'construct-outline',
  },
  cost: {
    bg: '#FFF7E5',
    border: 'rgba(216,167,46,0.26)',
    iconBg: '#FFE9A8',
    iconColor: gameUi.colors.amberCaution,
    valueColor: '#B95042',
    icon: 'wallet-outline',
  },
};

function formatAnimatedValue(
  value: number,
  suffix?: string,
  precision = 0,
): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const formatted =
    precision > 0 ? absolute.toFixed(precision).replace(/\.0$/, '') : `${Math.round(absolute)}`;
  return `${sign}${formatted}${suffix ?? ''}`;
}

function AnimatedImpactValue({
  item,
  reducedMotion,
}: {
  item: CriticalDecisionImpactTileModel;
  reducedMotion: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(reducedMotion ? item.numericValue : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(item.numericValue);
      return;
    }

    const duration = 450;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(item.numericValue * eased);
      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 32);

    return () => clearInterval(timer);
  }, [item.numericValue, reducedMotion]);

  return (
    <Text style={[styles.impactValue, { color: IMPACT_TONES[item.tone].valueColor }]}>
      {reducedMotion
        ? item.value
        : formatAnimatedValue(displayValue, item.valueSuffix, item.precision)}
    </Text>
  );
}

function StageHeader({ model }: { model: DayEndCriticalDecisionPresentation['header'] }) {
  return (
    <View style={styles.compactHeader} accessibilityLabel={`${model.title}, ${model.dayLabel}`}>
      <View style={styles.avatar}>
        <Ionicons name="business-outline" size={17} color={gameUi.colors.primaryTealDark} />
      </View>
      <View style={styles.headerCopy}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {model.title}
          </Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText} numberOfLines={1}>
              {model.levelLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.headerMeta} numberOfLines={1}>
          {model.dayLabel}
        </Text>
        <View style={styles.progressTrack} accessibilityLabel="Seviye ilerleme çizgisi">
          <View style={[styles.progressFill, { width: `${Math.round(model.progressRatio * 100)}%` }]} />
        </View>
      </View>
      <View style={styles.resourcePill}>
        <Text style={styles.resourcePillText} numberOfLines={1}>
          {model.resourceLabel}
        </Text>
      </View>
    </View>
  );
}

function SectionTitle() {
  return (
    <CreviaMotionView surface="report" index={0} motionKind="line_appear" style={styles.titleBlock}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Bugünün Kritik Kararı
      </Text>
      <View style={styles.goldDivider} />
    </CreviaMotionView>
  );
}

function CitySilhouette() {
  return (
    <View pointerEvents="none" style={styles.silhouette}>
      <View style={[styles.tower, styles.towerShort]} />
      <View style={[styles.tower, styles.towerTall]} />
      <View style={[styles.tower, styles.towerMid]} />
      <View style={[styles.tower, styles.towerSmall]} />
    </View>
  );
}

function DecisionHero({
  model,
  reducedMotion,
}: {
  model: DayEndCriticalDecisionPresentation['decision'];
  reducedMotion: boolean;
}) {
  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInUp.delay(40).duration(280).springify().damping(24)
      }
      style={styles.heroCard}
      accessibilityLabel={`${model.title}. ${model.subtitle}. ${model.chip}`}>
      <CitySilhouette />
      <View style={styles.heroIconWrap}>
        <Ionicons name="people-outline" size={22} color="#E8FFF5" />
        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInUp.delay(130).duration(320).springify().damping(12)
          }
          style={styles.checkBadge}>
          <Ionicons name="checkmark" size={12} color={gameUi.colors.primaryTealDark} />
        </Animated.View>
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {model.title}
        </Text>
        <Text style={styles.heroSubtitle} numberOfLines={3}>
          {model.subtitle}
        </Text>
        <View style={styles.heroChip}>
          <Text style={styles.heroChipText} numberOfLines={1}>
            {model.chip}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function ImpactTile({
  item,
  index,
  reducedMotion,
}: {
  item: CriticalDecisionImpactTileModel;
  index: number;
  reducedMotion: boolean;
}) {
  const tone = IMPACT_TONES[item.tone];

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInUp.delay(80 + index * 80).duration(240)
      }
      style={[styles.impactTile, { backgroundColor: tone.bg, borderColor: tone.border }]}
      accessibilityLabel={`${item.label}: ${item.value}. ${item.description}. ${item.helper}`}>
      <View style={[styles.impactIcon, { backgroundColor: tone.iconBg }]}>
        <Ionicons name={tone.icon} size={14} color={tone.iconColor} />
      </View>
      <Text style={styles.impactLabel} numberOfLines={1}>
        {item.label}
      </Text>
      <AnimatedImpactValue item={item} reducedMotion={reducedMotion} />
      <Text style={styles.impactDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.impactHelper} numberOfLines={2}>
        {item.helper}
      </Text>
    </Animated.View>
  );
}

function ReflectionCard({
  model,
  reducedMotion,
}: {
  model: DayEndCriticalDecisionPresentation['reflection'];
  reducedMotion: boolean;
}) {
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInUp.delay(220).duration(240)}
      style={styles.reflectionCard}
      accessibilityLabel={`${model.title}. ${model.body}. ${model.contribution}`}>
      <View style={styles.noteIcon}>
        <Ionicons name="document-text-outline" size={16} color={gameUi.colors.primaryTealMid} />
      </View>
      <View style={styles.noteCopy}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.noteBody} numberOfLines={4}>
          {model.body}
        </Text>
        <Text style={styles.contributionLine} numberOfLines={2}>
          {model.contribution}
        </Text>
      </View>
    </Animated.View>
  );
}

function AdvisorCard({
  model,
  reducedMotion,
}: {
  model: DayEndCriticalDecisionPresentation['advisor'];
  reducedMotion: boolean;
}) {
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInUp.delay(280).duration(240)}
      style={styles.advisorCard}
      accessibilityLabel={`${model.title}. ${model.body}`}>
      <View style={styles.eceAvatar}>
        <Text style={styles.eceAvatarText}>E</Text>
      </View>
      <View style={styles.noteCopy}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.noteBody} numberOfLines={3}>
          {model.body}
        </Text>
      </View>
    </Animated.View>
  );
}

function StageCta({
  model,
  reducedMotion,
  onShowDayFlow,
}: {
  model: DayEndCriticalDecisionPresentation['cta'];
  reducedMotion: boolean;
  onShowDayFlow?: () => void;
}) {
  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInUp.delay(340).duration(240)}>
      <Text style={styles.nextHint} numberOfLines={1}>
        {model.nextHint}
      </Text>
      <CreviaAnimatedPressable
        reducedMotion={reducedMotion}
        pressScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={model.accessibilityLabel}
        onPress={() => {
          playLightImpactHaptic();
          onShowDayFlow?.();
        }}
        style={styles.ctaButton}>
        <Text style={styles.ctaText} numberOfLines={1}>
          {model.label}
        </Text>
        <Ionicons name="arrow-down-circle-outline" size={21} color="#FFFCF5" />
      </CreviaAnimatedPressable>
    </Animated.View>
  );
}

export function DayEndCriticalDecisionSection({
  model,
  reducedMotion = false,
  onShowDayFlow,
}: Props) {
  const impactItems = useMemo(() => model.impacts, [model.impacts]);

  return (
    <View style={styles.section}>
      <StageHeader model={model.header} />
      <SectionTitle />
      <DecisionHero model={model.decision} reducedMotion={reducedMotion} />

      <View style={styles.impactSection}>
        <Text style={styles.impactSectionTitle} numberOfLines={1}>
          Kararın Etkisi
        </Text>
        <View style={styles.impactGrid}>
          {impactItems.map((item, index) => (
            <ImpactTile
              key={item.key}
              item={item}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </View>
      </View>

      <ReflectionCard model={model.reflection} reducedMotion={reducedMotion} />
      <AdvisorCard model={model.advisor} reducedMotion={reducedMotion} />
      <StageCta model={model.cta} reducedMotion={reducedMotion} onShowDayFlow={onShowDayFlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
    paddingHorizontal: 2,
    minWidth: 0,
  },
  compactHeader: {
    minHeight: 62,
    borderRadius: 22,
    backgroundColor: '#FFFCF5',
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...gameUi.shadow.soft,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.10)',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: gameUi.colors.textPrimary,
  },
  headerMeta: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
  levelBadge: {
    borderRadius: 999,
    backgroundColor: '#F5E2A5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 72,
  },
  levelBadgeText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    color: '#624813',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(7,86,79,0.10)',
    overflow: 'hidden',
    width: '78%',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: gameUi.colors.goldAccent,
  },
  resourcePill: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: '#F6EBC9',
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.30)',
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 116,
  },
  resourcePillText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: '#624813',
  },
  titleBlock: {
    gap: 7,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    color: gameUi.colors.textPrimary,
  },
  goldDivider: {
    width: 54,
    height: 3,
    borderRadius: 3,
    backgroundColor: gameUi.colors.goldAccent,
  },
  heroCard: {
    minHeight: 154,
    borderRadius: 24,
    backgroundColor: gameUi.colors.primaryTealDark,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    overflow: 'hidden',
    ...gameUi.shadow.hero,
  },
  silhouette: {
    position: 'absolute',
    right: 12,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    opacity: 0.12,
  },
  tower: {
    width: 20,
    backgroundColor: '#EAF5EE',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  towerShort: {
    height: 46,
  },
  towerTall: {
    height: 78,
  },
  towerMid: {
    height: 60,
  },
  towerSmall: {
    height: 36,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(234,245,238,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  checkBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: gameUi.colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: '#FFFCF5',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255,252,245,0.78)',
  },
  heroChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(216,167,46,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.32)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  heroChipText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: '#FFE9A8',
  },
  impactSection: {
    gap: 10,
    minWidth: 0,
  },
  impactSectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: gameUi.colors.textPrimary,
    paddingHorizontal: 2,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  impactTile: {
    flex: 1,
    minWidth: 0,
    minHeight: 142,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 5,
  },
  impactIcon: {
    width: 27,
    height: 27,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactLabel: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: gameUi.colors.textMuted,
  },
  impactValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  impactDescription: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: gameUi.colors.textPrimary,
  },
  impactHelper: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
  reflectionCard: {
    borderRadius: 22,
    backgroundColor: '#FFFCF5',
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    padding: 14,
    flexDirection: 'row',
    gap: 11,
    ...gameUi.shadow.soft,
  },
  advisorCard: {
    borderRadius: 22,
    backgroundColor: '#EDF7EE',
    borderWidth: 1,
    borderColor: 'rgba(62,158,106,0.18)',
    padding: 14,
    flexDirection: 'row',
    gap: 11,
  },
  noteIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#E6F4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: gameUi.colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eceAvatarText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFCF5',
  },
  noteCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  noteTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: gameUi.colors.textPrimary,
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#3D4F4C',
  },
  contributionLine: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: gameUi.colors.primaryTealMid,
  },
  nextHint: {
    marginBottom: 7,
    paddingHorizontal: 4,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: gameUi.colors.textMuted,
  },
  ctaButton: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: gameUi.colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    ...gameUi.shadow.card,
  },
  ctaText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFCF5',
  },
});
