import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';

type TaskFlowStep = {
  id: string;
  title: string;
  subtitle: string;
  state: 'completed' | 'active' | 'locked';
};

type StreakNode = {
  id: string;
  value: number;
  state: 'claimed' | 'active' | 'locked';
};

type ContinueOperationVariant = 'easy' | 'hard' | 'locked' | 'recommended';

type ContinueOperationModel = {
  id: string;
  title: string;
  badge: string;
  location: string;
  progress: number;
  variant: ContinueOperationVariant;
};

type SignalStatusCardProps = {
  statusTitle: string;
  statusSubtitle: string;
  ctaLabel: string;
  signalStrength: number;
  reducedMotion?: boolean;
};

type TaskFlowCardProps = {
  steps: TaskFlowStep[];
  reducedMotion?: boolean;
};

type DailyBonusCardProps = {
  streakNodes: StreakNode[];
  rewardAmount: number;
  reducedMotion?: boolean;
};

type ContinueOperationCardProps = ContinueOperationModel & {
  reducedMotion?: boolean;
};

type CenterLowerDashboardProps = {
  presentation: CenterHomePresentation;
  reducedMotion?: boolean;
};

const palette = {
  tealDeep: '#053E39',
  tealPanel: '#07564F',
  tealBright: '#21BFA8',
  mint: '#9DF2D2',
  cream: '#FFFCF5',
  creamSoft: '#F8F0DF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  purpleDeep: '#2A1749',
  purple: '#5B2B7A',
  violet: '#8261D8',
  plum: '#3D1F59',
  textLight: '#F5FFF9',
  mutedLight: 'rgba(245,255,249,0.72)',
  mutedDark: '#65716B',
  borderGold: 'rgba(245,227,175,0.26)',
  borderTeal: 'rgba(157,242,210,0.20)',
  shadow: '#043A36',
} as const;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function buildTaskSteps(presentation: CenterHomePresentation): TaskFlowStep[] {
  const activeDone = presentation.activeTarget.visibility === 'completed';
  return [
    {
      id: 'discover-city',
      title: 'Şehri Tanı',
      subtitle: 'Bölge bilgilerini keşfet.',
      state: 'completed',
    },
    {
      id: 'first-target',
      title: 'İlk Hedef',
      subtitle: 'Bir operasyona başla.',
      state: activeDone ? 'completed' : 'active',
    },
    {
      id: 'grow-reputation',
      title: 'İtibarını Büyüt',
      subtitle: 'Başarıda iz bırak.',
      state: activeDone ? 'active' : 'locked',
    },
  ];
}

function buildStreakNodes(presentation: CenterHomePresentation): StreakNode[] {
  const claimed = presentation.dailyReward.claimedToday;
  return [
    { id: 'bonus-20', value: 20, state: 'claimed' },
    { id: 'bonus-40', value: 40, state: claimed ? 'claimed' : 'active' },
    { id: 'bonus-60', value: 60, state: 'locked' },
  ];
}

function buildOperations(presentation: CenterHomePresentation): ContinueOperationModel[] {
  const primaryTitle =
    presentation.activeTarget.title?.trim() && presentation.activeTarget.title !== 'Aktif hedef'
      ? presentation.activeTarget.title
      : 'Roger Operasyonu';

  return [
    {
      id: 'roger-operation',
      title: primaryTitle,
      badge: 'Kolay',
      location: 'Konum: Çamlıca Bölgesi',
      progress: 65,
      variant: 'easy',
    },
    {
      id: 'next-operation',
      title: 'Yaklaşan Operasyon',
      badge: 'Zor',
      location: 'Konum: Boğaziçi Hattı',
      progress: 30,
      variant: 'hard',
    },
  ];
}

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
  playLightImpactHaptic();
  router.push(route as Href);
}

function CenterLowerSectionHeader({
  title,
  actionLabel,
  onActionPress,
  reducedMotion,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  reducedMotion?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle} numberOfLines={1}>
        {title}
      </Text>
      {actionLabel ? (
        <CreviaAnimatedPressable
          onPress={onActionPress}
          reducedMotion={reducedMotion}
          pressScale={0.96}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.sectionHeaderAction}>
          <Text style={styles.sectionHeaderActionText} numberOfLines={1}>
            {actionLabel}
          </Text>
        </CreviaAnimatedPressable>
      ) : null}
    </View>
  );
}

function RadarRing({
  signalStrength,
  reducedMotion,
}: {
  signalStrength: number;
  reducedMotion?: boolean;
}) {
  const strength = clampPercent(signalStrength);
  return (
    <View style={styles.radarWrap}>
      <View style={[styles.radarRing, styles.radarRingOuter]} />
      <View style={[styles.radarRing, styles.radarRingMiddle]} />
      <View style={[styles.radarRing, styles.radarRingInner]} />
      <View style={[styles.signalDot, styles.signalDotOne]} />
      <View style={[styles.signalDot, styles.signalDotTwo]} />
      <View style={[styles.signalDot, styles.signalDotThree]} />
      <View
        style={[
          styles.radarCore,
          !reducedMotion && strength >= 70 ? styles.radarCoreActive : undefined,
        ]}>
        <Ionicons name="wifi" size={23} color={palette.goldSoft} />
      </View>
    </View>
  );
}

function SignalStatusCard({
  statusTitle,
  statusSubtitle,
  ctaLabel,
  signalStrength,
  reducedMotion,
}: SignalStatusCardProps) {
  const router = useRouter();
  return (
    <LinearGradient
      colors={[palette.tealPanel, palette.tealDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.topCard}>
      <View style={styles.cardGlowMint} />
      <Text style={styles.cardEyebrow} numberOfLines={1}>
        SİNYAL DURUMU
      </Text>
      <RadarRing signalStrength={signalStrength} reducedMotion={reducedMotion} />
      <View style={styles.signalCopy}>
        <Text style={styles.signalTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
          {statusTitle}
        </Text>
        <Text style={styles.signalSubtitle} numberOfLines={1}>
          {statusSubtitle}
        </Text>
      </View>
      <CreviaAnimatedPressable
        onPress={() => pushRoute(router, '/events')}
        reducedMotion={reducedMotion}
        pressScale={0.965}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        style={styles.signalCta}>
        <Ionicons name="stats-chart" size={12} color={palette.goldSoft} />
        <Text style={styles.signalCtaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
          {ctaLabel}
        </Text>
      </CreviaAnimatedPressable>
    </LinearGradient>
  );
}

function TaskFlowCard({ steps, reducedMotion }: TaskFlowCardProps) {
  const router = useRouter();
  return (
    <LinearGradient
      colors={[palette.tealPanel, palette.tealDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.topCard}>
      <View style={styles.cardGlowGold} />
      <Text style={styles.cardEyebrow} numberOfLines={1}>
        GÖREV AKIŞI
      </Text>
      <View style={styles.taskList}>
        {steps.map((step, index) => {
          const completed = step.state === 'completed';
          const active = step.state === 'active';
          const locked = step.state === 'locked';
          return (
            <View key={step.id} style={styles.taskRow}>
              <View style={styles.taskRail}>
                <View
                  style={[
                    styles.taskBadge,
                    completed ? styles.taskBadgeCompleted : undefined,
                    active ? styles.taskBadgeActive : undefined,
                    locked ? styles.taskBadgeLocked : undefined,
                  ]}>
                  <Text style={styles.taskBadgeText}>{index + 1}</Text>
                </View>
                {index < steps.length - 1 ? <View style={styles.taskConnector} /> : null}
              </View>
              <View style={styles.taskCopy}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {step.title}
                </Text>
                <Text style={styles.taskSubtitle} numberOfLines={1}>
                  {step.subtitle}
                </Text>
              </View>
              <Ionicons
                name={completed ? 'checkmark-circle' : locked ? 'lock-closed' : 'chevron-forward'}
                size={16}
                color={completed ? palette.mint : locked ? palette.goldSoft : palette.gold}
              />
            </View>
          );
        })}
      </View>
      <CreviaAnimatedPressable
        onPress={() => pushRoute(router, '/events')}
        reducedMotion={reducedMotion}
        pressScale={0.965}
        accessibilityRole="button"
        accessibilityLabel="Tüm görevleri gör"
        style={styles.taskCta}>
        <Text style={styles.taskCtaText} numberOfLines={1}>
          Tüm görevleri gör
        </Text>
        <Ionicons name="chevron-forward" size={13} color={palette.tealDeep} />
      </CreviaAnimatedPressable>
    </LinearGradient>
  );
}

function DailyBonusCard({ streakNodes, rewardAmount, reducedMotion }: DailyBonusCardProps) {
  return (
    <LinearGradient
      colors={[palette.purpleDeep, palette.purple, palette.plum]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bonusCard}>
      <View style={styles.bonusGlow} />
      <View style={styles.bonusCopy}>
        <Text style={styles.bonusEyebrow} numberOfLines={1}>
          GÜNLÜK BONUS
        </Text>
        <Text style={styles.bonusSubtitle} numberOfLines={1}>
          Serini koru, ödülleri topla!
        </Text>
      </View>
      <View style={styles.bonusNodes}>
        {streakNodes.map((node) => (
          <View key={node.id} style={styles.bonusNodeWrap}>
            <View
              style={[
                styles.bonusNode,
                node.state === 'claimed' ? styles.bonusNodeClaimed : undefined,
                node.state === 'active' && !reducedMotion ? styles.bonusNodeActive : undefined,
              ]}>
              <Ionicons
                name={node.state === 'locked' ? 'lock-closed' : 'checkmark'}
                size={11}
                color={node.state === 'locked' ? palette.mutedLight : palette.tealDeep}
              />
            </View>
            <Text style={styles.bonusNodeText} numberOfLines={1}>
              {node.value}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.rewardWrap}>
        <View style={styles.rewardChest}>
          <Ionicons name="cube" size={18} color={palette.goldSoft} />
        </View>
        <View style={styles.rewardAmount}>
          <Ionicons name="diamond" size={12} color="#D7C8FF" />
          <Text style={styles.rewardAmountText}>{rewardAmount}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function ContinueOperationCard({
  title,
  badge,
  location,
  progress,
  variant,
  reducedMotion,
}: ContinueOperationCardProps) {
  const router = useRouter();
  const isHard = variant === 'hard' || variant === 'locked';
  const value = clampPercent(progress);
  return (
    <CreviaAnimatedPressable
      onPress={() => pushRoute(router, '/events')}
      reducedMotion={reducedMotion}
      pressScale={0.97}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${location}. Yüzde ${value}.`}
      style={styles.operationPressable}>
      <LinearGradient
        colors={isHard ? [palette.plum, '#182848'] : [palette.tealPanel, '#2C7E64']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.operationCard}>
        <View style={isHard ? styles.operationMoon : styles.operationSun} />
        <View style={styles.skyline}>
          <View style={[styles.tower, styles.towerSmall]} />
          <View style={[styles.tower, styles.towerTall]} />
          <View style={[styles.tower, styles.towerMid]} />
        </View>
        <View style={styles.operationTopRow}>
          <View style={[styles.operationBadge, isHard ? styles.operationBadgeHard : undefined]}>
            <Text style={styles.operationBadgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
          <Ionicons
            name={isHard ? 'lock-closed' : 'chevron-forward'}
            size={15}
            color={palette.goldSoft}
          />
        </View>
        <View style={styles.operationCopy}>
          <Text style={styles.operationTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.operationLocation} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>%{value}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${value}%` },
                isHard ? styles.progressFillHard : undefined,
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </CreviaAnimatedPressable>
  );
}

export function CenterLowerDashboard({
  presentation,
  reducedMotion = false,
}: CenterLowerDashboardProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const stackTopCards = width < 350;
  const signalScore =
    presentation.operationSignals.signals[0]?.severity === 'urgent'
      ? 58
      : presentation.operationSignals.signals[0]?.severity === 'high'
        ? 72
        : 88;
  const operations = buildOperations(presentation);

  return (
    <View style={styles.root}>
      <View style={[styles.topGrid, stackTopCards ? styles.topGridStacked : undefined]}>
        <View style={styles.topGridCell}>
          <SignalStatusCard
            statusTitle="Sinyalin güçlü"
            statusSubtitle="Akış seninle."
            ctaLabel="Detayları İncele"
            signalStrength={signalScore}
            reducedMotion={reducedMotion}
          />
        </View>
        <View style={styles.topGridCell}>
          <TaskFlowCard steps={buildTaskSteps(presentation)} reducedMotion={reducedMotion} />
        </View>
      </View>

      <DailyBonusCard
        streakNodes={buildStreakNodes(presentation)}
        rewardAmount={100}
        reducedMotion={reducedMotion}
      />

      <View style={styles.continueSection}>
        <CenterLowerSectionHeader
          title="DEVAM ET"
          actionLabel="Hepsini Gör"
          onActionPress={() => pushRoute(router, '/events')}
          reducedMotion={reducedMotion}
        />
        <View style={styles.operationGrid}>
          {operations.map((operation) => (
            <ContinueOperationCard key={operation.id} {...operation} reducedMotion={reducedMotion} />
          ))}
        </View>
      </View>
    </View>
  );
}

const panelShadow = {
  shadowColor: palette.shadow,
  shadowOpacity: 0.14,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 9 },
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  root: {
    gap: 14,
    minWidth: 0,
  },
  topGrid: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  topGridStacked: {
    flexDirection: 'column',
  },
  topGridCell: {
    flex: 1,
    minWidth: 0,
  },
  topCard: {
    minHeight: 224,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderGold,
    padding: 12,
    overflow: 'hidden',
    ...panelShadow,
  },
  cardGlowMint: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    width: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: 'rgba(33,191,168,0.14)',
  },
  cardGlowGold: {
    position: 'absolute',
    right: -20,
    top: -18,
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: 'rgba(245,227,175,0.13)',
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: palette.goldSoft,
  },
  radarWrap: {
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.24)',
  },
  radarRingOuter: {
    width: 94,
    height: 94,
  },
  radarRingMiddle: {
    width: 70,
    height: 70,
  },
  radarRingInner: {
    width: 46,
    height: 46,
    borderColor: 'rgba(245,227,175,0.34)',
  },
  radarCore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.36)',
  },
  radarCoreActive: {
    transform: [{ scale: 1.02 }],
  },
  signalDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.mint,
  },
  signalDotOne: {
    top: 17,
    right: 39,
  },
  signalDotTwo: {
    left: 35,
    bottom: 26,
    backgroundColor: palette.goldSoft,
  },
  signalDotThree: {
    right: 29,
    bottom: 36,
  },
  signalCopy: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  signalTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: palette.textLight,
    textAlign: 'center',
  },
  signalSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: palette.mutedLight,
    textAlign: 'center',
  },
  signalCta: {
    minHeight: 32,
    borderRadius: 999,
    marginTop: 'auto',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: palette.borderGold,
  },
  signalCtaText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '900',
    color: palette.goldSoft,
  },
  taskList: {
    gap: 7,
    marginTop: 10,
  },
  taskRow: {
    minHeight: 41,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  taskRail: {
    width: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  taskBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.borderTeal,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  taskBadgeCompleted: {
    backgroundColor: 'rgba(157,242,210,0.20)',
    borderColor: 'rgba(157,242,210,0.34)',
  },
  taskBadgeActive: {
    backgroundColor: palette.goldSoft,
    borderColor: palette.gold,
  },
  taskBadgeLocked: {
    opacity: 0.64,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.textLight,
  },
  taskConnector: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(245,227,175,0.18)',
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.textLight,
  },
  taskSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: palette.mutedLight,
  },
  taskCta: {
    minHeight: 31,
    borderRadius: 999,
    marginTop: 'auto',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: palette.goldSoft,
  },
  taskCtaText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDeep,
  },
  bonusCard: {
    minHeight: 88,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(215,200,255,0.22)',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    ...panelShadow,
  },
  bonusGlow: {
    position: 'absolute',
    right: -18,
    top: -28,
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: 'rgba(130,97,216,0.28)',
  },
  bonusCopy: {
    flex: 1,
    minWidth: 82,
    gap: 3,
  },
  bonusEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: palette.goldSoft,
  },
  bonusSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: palette.mutedLight,
  },
  bonusNodes: {
    flexDirection: 'row',
    gap: 7,
    flexShrink: 0,
  },
  bonusNodeWrap: {
    alignItems: 'center',
    gap: 3,
  },
  bonusNode: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  bonusNodeClaimed: {
    backgroundColor: palette.goldSoft,
    borderColor: palette.gold,
  },
  bonusNodeActive: {
    borderColor: '#D7C8FF',
  },
  bonusNodeText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.mutedLight,
  },
  rewardWrap: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  rewardChest: {
    width: 34,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,227,175,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.28)',
  },
  rewardAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rewardAmountText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D7C8FF',
  },
  continueSection: {
    gap: 9,
    minWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: palette.tealDeep,
  },
  sectionHeaderAction: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sectionHeaderActionText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.tealPanel,
  },
  operationGrid: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  operationPressable: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
  },
  operationCard: {
    minHeight: 152,
    borderRadius: 22,
    padding: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderGold,
  },
  operationSun: {
    position: 'absolute',
    right: 14,
    top: 17,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245,227,175,0.24)',
  },
  operationMoon: {
    position: 'absolute',
    right: 14,
    top: 17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(215,200,255,0.22)',
  },
  skyline: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 34,
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    opacity: 0.22,
  },
  tower: {
    width: 20,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: palette.cream,
  },
  towerSmall: {
    height: 20,
  },
  towerTall: {
    height: 34,
  },
  towerMid: {
    height: 27,
  },
  operationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  operationBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(157,242,210,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.24)',
    maxWidth: 78,
  },
  operationBadgeHard: {
    backgroundColor: 'rgba(245,227,175,0.14)',
    borderColor: 'rgba(245,227,175,0.26)',
  },
  operationBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.goldSoft,
  },
  operationCopy: {
    marginTop: 28,
    gap: 5,
    minWidth: 0,
  },
  operationTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: palette.textLight,
  },
  operationLocation: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: palette.mutedLight,
  },
  progressRow: {
    marginTop: 'auto',
    gap: 5,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.goldSoft,
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.mint,
  },
  progressFillHard: {
    backgroundColor: '#D7C8FF',
  },
});
