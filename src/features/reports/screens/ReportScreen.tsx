import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, type ComponentProps } from 'react';
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  type ScrollView,
  View,
} from 'react-native';

import { buildCommonAnalyticsBase, trackCreviaEvent } from '@/core/analytics/analyticsRuntime';
import { resolveReportContinueCtaLabel } from '@/core/ux/uxFlowPresentation';
import { buildDay1TutorialPriorityLine } from '@/core/dailyPriority/dailyPriorityPresentation';
import { MAIN_OPERATION_PREVIEW_ROUTE } from '@/core/pilotCompletion';
import { buildDailyXpReport } from '@/core/xp/xpReport';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import { EndOfDayReportView } from '@/features/reports/components/end-of-day/EndOfDayReportView';
import { ReportReturnHubCta } from '@/features/reports/components/ReportReturnHubCta';
import { getPilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { useReportPilotCompletionSummary } from '@/features/pilot/hooks/usePilotCompletionSummary';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import {
  applyDay1TutorialReportCopy,
  selectActiveTutorialStepForScreen,
  selectShowDay1TutorialReportCopy,
} from '@/features/tutorial/tutorialSelectors';
import {
  selectDecisionHistory,
  selectLastDailyReport,
  useGameMetrics,
  useGameStore,
} from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { colors } from '@/ui/theme/colors';
import { reportAssets } from '@/features/reports/utils/reportAssets';
import { spacing } from '@/ui/theme/spacing';

const previewToneStyles = {
  people: {
    iconCircle: { backgroundColor: '#DDF5EE' },
    iconColor: '#0F8F86',
    segment: { backgroundColor: '#65BDAF' },
    segmentMuted: { backgroundColor: '#CDE9E3' },
  },
  team: {
    iconCircle: { backgroundColor: '#DCEEFF' },
    iconColor: '#2477A8',
    segment: { backgroundColor: '#78AEE0' },
    segmentMuted: { backgroundColor: '#D4E5F5' },
  },
  resource: {
    iconCircle: { backgroundColor: '#FFF1C9' },
    iconColor: '#D59A14',
    segment: { backgroundColor: '#E7BD58' },
    segmentMuted: { backgroundColor: '#F3DFAC' },
  },
} as const;

function goToHub(router: ReturnType<typeof useRouter>) {
  router.push('/');
}

type ReportEmptyProps = {
  onGoHub: () => void;
};

type ReportPreviewTone = 'people' | 'team' | 'resource';

type ReportPreviewMetricProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  tone: ReportPreviewTone;
};

function ReportPreviewMetric({ icon, title, tone }: ReportPreviewMetricProps) {
  const toneStyle = previewToneStyles[tone];

  return (
    <View style={styles.previewMetric}>
      <View style={[styles.previewIconCircle, toneStyle.iconCircle]}>
        <Ionicons name={icon} size={22} color={toneStyle.iconColor} />
      </View>
      <Text style={styles.previewMetricTitle} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.skeletonBlock}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineShort} />
      </View>

      <View style={styles.previewSegments}>
        <View style={[styles.previewSegment, toneStyle.segment]} />
        <View style={[styles.previewSegment, toneStyle.segment]} />
        <View style={[styles.previewSegment, toneStyle.segment]} />
        <View style={[styles.previewSegmentMuted, toneStyle.segmentMuted]} />
      </View>
    </View>
  );
}

function ReportEmpty({ onGoHub }: ReportEmptyProps) {
  return (
    <GameScreenShell screenTitle="Raporlar" contentStyle={styles.emptyContent}>
      <View style={styles.emptyHeroWrap}>
        <View style={styles.emptyHeroGlow} pointerEvents="none" />
        <Image
          source={reportAssets.emptyStateHero}
          style={styles.emptyHeroImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.emptyCopyBlock}>
        <Text style={styles.emptyTitle}>Henüz Gün Sonu Raporu Yok</Text>
        <Text style={styles.emptyBody}>
          Operasyon merkezinden günü bitirdiğinde burada günlük raporunu
          göreceksin.
        </Text>
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Raporunda Neler Olacak?</Text>

        <View style={styles.previewMetricsRow}>
          <ReportPreviewMetric
            icon="people"
            title="Halk Etkisi"
            tone="people"
          />
          <View style={styles.previewDivider} />
          <ReportPreviewMetric
            icon="construct"
            title="Ekip Etkisi"
            tone="team"
          />
          <View style={styles.previewDivider} />
          <ReportPreviewMetric
            icon="cube"
            title="Kaynak Etkisi"
            tone="resource"
          />
        </View>

        <View style={styles.lockStrip}>
          <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
          <Text style={styles.lockStripText} numberOfLines={2}>
            Raporlar, günü tamamladıktan sonra kilidini açılır.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onGoHub}
        style={({ pressed }) => [
          styles.emptyPrimaryCta,
          pressed ? styles.emptyPrimaryCtaPressed : null,
        ]}
      >
        <Text style={styles.emptyPrimaryCtaText}>Operasyon Merkezine Dön</Text>
        <Ionicons name="chevron-forward" size={26} color={colors.surface} />
      </Pressable>

      <View style={styles.tipRow}>
        <View style={styles.tipIconCircle}>
          <Ionicons name="bulb" size={22} color={colors.warning} />
        </View>
        <Text style={styles.tipText}>
          <Text style={styles.tipTextStrong}>İpucu: </Text>
          Daha iyi sonuçlar için altyapını geliştir ve halkının ihtiyaçlarını
          önceliklendir.
        </Text>
      </View>
    </GameScreenShell>
  );
}

export function ReportScreen() {
  const router = useRouter();
  const reportScrollRef = useRef<ScrollView | null>(null);
  const dayFlowOffsetRef = useRef(0);
  const report = useGameStore(selectLastDailyReport);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const lastClosedDay = useGameStore((s) => s.lastClosedDay);
  const metrics = useGameMetrics();
  const playerProgressFromStore = useGameStore((s) => s.playerProgress);
  const decisionHistory = useGameStore(selectDecisionHistory);

  const onGoHub = () => {
    if (report) {
      trackCreviaEvent('hub_returned', buildCommonAnalyticsBase(gameState, 'hub', monetization));
    }
    goToHub(router);
  };

  const onDayFlowLayout = useCallback((event: LayoutChangeEvent) => {
    dayFlowOffsetRef.current = event.nativeEvent.layout.y;
  }, []);

  const onShowDayFlow = useCallback(() => {
    reportScrollRef.current?.scrollTo({
      y: Math.max(0, dayFlowOffsetRef.current - spacing.sm),
      animated: true,
    });
  }, []);

  if (!report) {
    return <ReportEmpty onGoHub={onGoHub} />;
  }

  const dailyXpReport = useMemo(() => {
    const progress = playerProgressFromStore ?? createInitialPlayerProgress();
    return buildDailyXpReport(progress.xpHistory, report.day);
  }, [playerProgressFromStore, report.day]);

  const pilotReportContext = getPilotReportContext({
    gameState,
    lastDailyReport: report,
    lastClosedDay,
    decisionHistory,
  });

  const useDay1ReportCopy = useGameStore(selectShowDay1TutorialReportCopy);
  const displayReport = useMemo(
    () => applyDay1TutorialReportCopy(report, useDay1ReportCopy),
    [report, useDay1ReportCopy],
  );
  const pilotCompletionSummary = useReportPilotCompletionSummary(
    displayReport.day,
  );

  const legacyTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'daily_report'),
  );
  const { coachHint, dismissHint } = useOnboardingHint('daily_report');

  const day1PriorityLine =
    displayReport.day === 1 ? buildDay1TutorialPriorityLine() : undefined;
  const day1GoalsLine =
    displayReport.day === 1 && useDay1ReportCopy
      ? 'İlk gün hedeflerini tanı; yarın tam takip başlar.'
      : undefined;

  const continueTitle = resolveReportContinueCtaLabel(
    displayReport.day,
    Boolean(pilotCompletionSummary),
  );

  const onContinue = () => {
    if (displayReport.day === 7 && pilotCompletionSummary) {
      router.push(MAIN_OPERATION_PREVIEW_ROUTE);
      return;
    }
    onGoHub();
  };

  return (
    <GameScreenShell
      scrollRef={reportScrollRef}
      headerVariant="none"
      backgroundColor="#F7F3EB"
      contentStyle={styles.content}>
      <View style={styles.stack}>
        <EndOfDayReportView
          report={displayReport}
          metrics={metrics}
          dailyXpReport={dailyXpReport}
          day1PriorityLine={day1PriorityLine}
          day1GoalsLine={day1GoalsLine}
          pilotReportContext={pilotReportContext}
          pilotCompletionSummary={pilotCompletionSummary}
          onShowDayFlow={onShowDayFlow}
          onDayFlowLayout={onDayFlowLayout}
        />
      </View>

      <ReportReturnHubCta title={continueTitle} onPress={onContinue} />
      <TutorialCoachOverlay screen="daily_report" />
      {coachHint && !legacyTutorialStep ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
        />
      ) : null}
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  stack: {
    gap: spacing.md,
  },
  emptyContent: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 200,
  },
  emptyHeroGlow: {
    position: 'absolute',
    width: 260,
    height: 180,
    borderRadius: 120,
    backgroundColor: 'rgba(221, 245, 238, 0.55)',
    top: 24,
  },
  emptyHeroImage: {
    alignSelf: 'center',
    width: '72%',
    maxWidth: 290,
    height: 220,
  },
  emptyCopyBlock: {
    gap: spacing.sm,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  emptyTitle: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 330,
    alignSelf: 'center',
  },
  previewCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
    shadowColor: '#0D3D3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: spacing.md,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  previewMetricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    marginVertical: spacing.xs,
  },
  previewMetric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMetricTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  skeletonBlock: {
    width: '100%',
    gap: 6,
    paddingHorizontal: 2,
  },
  skeletonLineWide: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8E6E1',
    width: '92%',
    alignSelf: 'center',
  },
  skeletonLineShort: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8E6E1',
    width: '68%',
    alignSelf: 'center',
  },
  previewSegments: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    width: '100%',
  },
  previewSegment: {
    flex: 1,
    maxWidth: 18,
    height: 6,
    borderRadius: 3,
  },
  previewSegmentMuted: {
    flex: 1,
    maxWidth: 18,
    height: 6,
    borderRadius: 3,
  },
  lockStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  lockStripText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyPrimaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 64,
    borderRadius: 28,
    backgroundColor: colors.headerTealDark,
    paddingHorizontal: spacing.xl,
    shadowColor: '#0D3D3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyPrimaryCtaPressed: {
    opacity: 0.92,
  },
  emptyPrimaryCtaText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  tipIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  tipTextStrong: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
