import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildEventResultAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { buildDecisionImpactExplanation } from '@/core/decisionImpactExplanation';
import { getEventAssignment } from '@/core/assignments/assignmentState';
import {
  buildResultCarryOverMemory,
  shouldShowCarryOverMemory,
} from '@/core/carryOver';
import {
  buildEventDomainResultFocus,
  shouldShowEventDomainFocus,
} from '@/core/events/eventDomainPresentation';
import { buildEventResultSystemsEchoModel } from '@/core/events/eventResultNewSystemsPresentation';
import { buildMapBeforeAfterSummary } from '@/core/mapPresence';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { EventCarryOverHintCard } from '@/features/events/components/EventCarryOverHintCard';
import { EventDomainFocusStrip } from '@/features/events/components/EventDomainFocusStrip';
import { EventMapImpactSummaryCard } from '@/features/events/components/EventMapImpactSummaryCard';
import { EventResultImpactExplanationCard } from '@/features/events/components/EventResultImpactExplanationCard';
import { EventResultSystemsEchoStrip } from '@/features/events/components/result/EventResultSystemsEchoStrip';
import {
  buildResourceFatiguePanelLine,
  buildResourceFatigueVisualSummary,
  inferResourceDomainFromEventFocus,
} from '@/core/resources';
import { ResourceFatigueStateChip } from '@/features/resources/components/ResourceFatigueStateChip';
import { trackOncePerRuntime } from '@/core/analytics/analyticsRuntime';
import type { EventCard, SolvedEvent } from '@/core/models/EventCard';
import type {
  DecisionMetricChange,
  DecisionMetricKey,
  DecisionResultSnapshot,
} from '@/features/events/types/decisionResultTypes';
import { createEmptyDecisionResultFallback } from '@/features/events/utils/decisionResultModel';
import { buildEventResultViewModel } from '@/features/events/utils/eventResultPresentation';
import {
  selectActiveTutorialStepForScreen,
} from '@/features/tutorial/tutorialSelectors';
import { selectLastDecisionResult, useGameStore } from '@/store/useGameStore';
import { useGameStatus } from '@/store/gameSelectors';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { getTimeGreeting } from '@/core/utils/timeGreeting';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { creviaAssets } from '@/core/assets/creviaAssets';
import { hubAssets } from '@/features/hub/utils/hubAssets';

const eceImage = hubAssets.advisorPortrait;
const municipalImage = creviaAssets.buildings.municipalHall3d;
const planImage = require('../../../../assets/b4.png');
const personnelImage = require('../../../../assets/b7.png');
const reportImage = require('../../../../assets/b8.png');
const vehicleImage = require('../../../../assets/b9.png');
const cumhuriyetImage = require('../../../../assets/districts/cumhuriyet/district_cumhuriyet_overview_01.png');
const sanayiImage = require('../../../../assets/districts/industrial_market/district_industrial_market_overview_01.png');
const yesilvadiImage = require('../../../../assets/districts/status/district_safe_zone_01.png');

const palette = {
  background: '#F7F1E6',
  card: '#FFFDF7',
  cardSoft: '#FDF8ED',
  tealDark: '#0E5F5B',
  teal: '#0F8F86',
  tealSoft: '#BDEFE7',
  green: '#4F9653',
  gold: '#D9AA2B',
  goldSoft: '#F2D479',
  textDark: '#183B3A',
  textMuted: '#6C7A78',
  border: 'rgba(20, 70, 66, 0.10)',
  white: '#FFFFFF',
} as const;

function resolveEventForResult(
  snapshot: DecisionResultSnapshot,
  events: EventCard[],
  solvedEvents: SolvedEvent[],
): EventCard | null {
  if (!snapshot.eventId) return null;
  const active = events.find((event) => event.id === snapshot.eventId);
  if (active) return active;
  const solved = solvedEvents.find((event) => event.id === snapshot.eventId);
  if (!solved) return null;

  return {
    id: solved.id,
    title: solved.title,
    category: snapshot.eventType ?? 'operations',
    riskLevel: 'medium',
    district: snapshot.neighborhoodName ?? 'Merkez',
    neighborhoodId: snapshot.neighborhoodId,
    description: snapshot.summaryText,
    contextTag: '',
    urgencyHours: 4,
    day: snapshot.day,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
  };
}

function findMetric(
  metrics: DecisionMetricChange[],
  key: DecisionMetricKey,
): DecisionMetricChange | undefined {
  return metrics.find((metric) => metric.key === key);
}

function signed(delta: number): string {
  if (delta === 0) return '0';
  return `${delta > 0 ? '+' : ''}${Math.round(delta)}`;
}

function metricValue(
  result: DecisionResultSnapshot,
  key: DecisionMetricKey,
  fallbackBefore: number,
  fallbackAfter: number,
) {
  const metric = findMetric(result.metricChanges, key);
  const before = Math.round(metric?.before ?? fallbackBefore);
  const after = Math.round(metric?.after ?? fallbackAfter);
  const delta = Math.round(metric?.delta ?? after - before);
  return { before, after, delta };
}

function trustValue(result: DecisionResultSnapshot) {
  const risk = findMetric(result.metricChanges, 'operationRisk');
  if (!risk) return { before: 67, after: 75, delta: 8 };
  const before = Math.max(0, Math.min(100, 100 - Math.round(risk.before ?? 33)));
  const after = Math.max(0, Math.min(100, 100 - Math.round(risk.after ?? 25)));
  return { before, after, delta: after - before };
}

function sourceGain(result: DecisionResultSnapshot): number {
  const budget = findMetric(result.metricChanges, 'budget');
  const delta = budget?.delta ?? 120;
  return Math.max(40, Math.abs(Math.round(delta / 10)));
}

function PremiumResultHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const status = useGameStatus();
  const greeting = useMemo(() => getTimeGreeting(), []);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Image source={municipalImage} style={styles.headerBgImage} contentFit="cover" />
      <View style={styles.headerShade} />
      <Pressable
        onPress={() => router.push('/profile' as Href)}
        accessibilityRole="button"
        accessibilityLabel="Profili aç">
        <HeaderAvatar size={54} level={status.level} showLevelBadge />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerGreeting} numberOfLines={1}>
          {greeting.title}, {status.playerName} {greeting.emoji}
        </Text>
        <View style={styles.headerMetaRow}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.82)" />
          <Text style={styles.headerMeta} numberOfLines={1}>
            {status.currentDay}. Gün · Merkez · Sv.{status.level}
          </Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.headerChipRow}>
          <View style={styles.headerChip}>
            <Ionicons name="ellipse" size={10} color={palette.gold} />
            <Text style={styles.headerChipText} numberOfLines={1}>
              {status.sourceShort}
            </Text>
          </View>
          <View style={styles.headerChip}>
            <Ionicons name="star" size={11} color={palette.gold} />
            <Text style={styles.headerChipText} numberOfLines={1}>
              {status.xp}/{status.xpTarget}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtonRow}>
          <View style={[styles.headerRoundButton, styles.headerRoundActive]}>
            <Ionicons name="bar-chart" size={17} color={palette.tealDark} />
          </View>
          <View style={[styles.headerRoundButton, styles.headerRoundGhost]}>
            <Ionicons name="notifications-outline" size={17} color={palette.white} />
          </View>
        </View>
      </View>
    </View>
  );
}

function PercentBar({ value, color }: { value: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.percentTrack}>
      <View style={[styles.percentFill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}

function BeforeAfterPanel({ result }: { result: DecisionResultSnapshot }) {
  const satisfaction = metricValue(result, 'publicSatisfaction', 63, 75);
  const trust = trustValue(result);

  return (
    <View style={styles.impactPanel}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Etki Özeti: {result.neighborhoodName ?? 'Merkez'}
      </Text>
      <View style={styles.beforeAfterRow}>
        <View style={styles.beforeAfterBox}>
          <Text style={styles.boxTitle} numberOfLines={1}>
            Önce
          </Text>
          <MetricLine label="Memnuniyet" value={satisfaction.before} color={palette.tealDark} />
          <MetricLine label="Güven" value={trust.before} color={palette.tealDark} />
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={30} color="rgba(14,95,91,0.22)" />
        </View>
        <View style={styles.beforeAfterBox}>
          <View style={styles.afterTitleRow}>
            <Text style={styles.boxTitle} numberOfLines={1}>
              Sonra
            </Text>
            <Ionicons name="happy-outline" size={13} color={palette.green} />
          </View>
          <MetricLine
            label="Memnuniyet"
            value={satisfaction.after}
            delta={satisfaction.delta}
            color={palette.green}
          />
          <MetricLine label="Güven" value={trust.after} delta={trust.delta} color={palette.green} />
        </View>
      </View>
    </View>
  );
}

function MetricLine({
  label,
  value,
  delta,
  color,
}: {
  label: string;
  value: number;
  delta?: number;
  color: string;
}) {
  return (
    <View style={styles.metricLine}>
      <View style={styles.metricLabelRow}>
        <Text style={styles.metricLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.metricPercent} numberOfLines={1}>
          {value}%
        </Text>
        {delta != null && delta !== 0 ? (
          <Text style={styles.metricDelta} numberOfLines={1}>
            ▲ {signed(delta)}
          </Text>
        ) : null}
      </View>
      <PercentBar value={value} color={color} />
    </View>
  );
}

function RewardHero({ result }: { result: DecisionResultSnapshot }) {
  const satisfaction = metricValue(result, 'publicSatisfaction', 63, 75);
  const trust = trustValue(result);

  return (
    <View style={styles.rewardHero}>
      <View style={styles.successMedal}>
        <View style={styles.medalRing}>
          <Ionicons name="checkmark" size={52} color={palette.white} />
        </View>
      </View>
      <View style={styles.rewardCopy}>
        <Text style={styles.rewardTitle} numberOfLines={2}>
          Görev Başarıyla Tamamlandı!
        </Text>
        <Text style={styles.rewardText} numberOfLines={2}>
          Planladığın operasyon hedefe ulaştı. Merkez’de olumlu etkiler hissediliyor.
        </Text>
        <View style={styles.rewardChips}>
          <View style={styles.rewardChip}>
            <Ionicons name="happy-outline" size={14} color={palette.green} />
            <Text style={styles.rewardChipText} numberOfLines={1}>
              {signed(satisfaction.delta)} Memnuniyet
            </Text>
          </View>
          <View style={styles.rewardChip}>
            <Ionicons name="shield-checkmark" size={14} color={palette.green} />
            <Text style={styles.rewardChipText} numberOfLines={1}>
              {signed(trust.delta)} Güven
            </Text>
          </View>
        </View>
      </View>
      <Image source={municipalImage} style={styles.rewardBuilding} contentFit="contain" />
    </View>
  );
}

function ResultStatCards({ result }: { result: DecisionResultSnapshot }) {
  const satisfaction = metricValue(result, 'publicSatisfaction', 63, 75);
  const trust = trustValue(result);
  const source = sourceGain(result);

  return (
    <View style={styles.statGrid}>
      <StatCard
        image={planImage}
        title="Kaynak Etkisi"
        value={`+${source}`}
        label="Kaynak"
        detailA="Taş"
        detailB="Kereste"
      />
      <StatCard
        image={personnelImage}
        title="Sosyal Etki"
        value={`+${Math.max(12, satisfaction.delta + 6)}`}
        label="Memnuniyet"
        body="Halk etkinlikleri ve hizmetler arttı."
      />
      <StatCard
        image={vehicleImage}
        title="Güven Etkisi"
        value={signed(trust.delta)}
        label="Güven"
        body="Güven artışı, operasyonları güçlendirdi."
      />
      <StatCard
        image={reportImage}
        title="Devreden Etki"
        value="+10%"
        label="Etki Kalıcılığı"
        body="Sonraki güne taşındı"
      />
    </View>
  );
}

function StatCard({
  image,
  title,
  value,
  label,
  body,
  detailA,
  detailB,
}: {
  image: number;
  title: string;
  value: string;
  label: string;
  body?: string;
  detailA?: string;
  detailB?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTitleRow}>
        <Image source={image} style={styles.statIcon} contentFit="contain" />
        <Text style={styles.statTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      {body ? (
        <Text style={styles.statBody} numberOfLines={2}>
          {body}
        </Text>
      ) : (
        <View style={styles.resourceLines}>
          <Text style={styles.resourceLine} numberOfLines={1}>
            🪨 {detailA} +60
          </Text>
          <Text style={styles.resourceLine} numberOfLines={1}>
            🪵 {detailB} +60
          </Text>
        </View>
      )}
    </View>
  );
}

function DistrictImpact({ result }: { result: DecisionResultSnapshot }) {
  const satisfaction = metricValue(result, 'publicSatisfaction', 63, 75);
  const districts = [
    { name: 'Cumhuriyet', image: cumhuriyetImage, delta: 0 },
    { name: 'Sanayi', image: sanayiImage, delta: 4 },
    { name: 'Merkez', image: municipalImage, delta: Math.max(8, satisfaction.delta) },
    { name: 'İstasyon', image: planImage, delta: 0 },
    { name: 'Yeşilvadi', image: yesilvadiImage, delta: 3 },
  ];

  return (
    <View style={styles.districtPanel}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="map" size={17} color={palette.tealDark} />
        <Text style={styles.sectionTitle} numberOfLines={1}>
          Bölgesel Etki
        </Text>
      </View>
      <View style={styles.districtRow}>
        {districts.map((district, index) => (
          <View
            key={district.name}
            style={[styles.districtItem, district.name === 'Merkez' && styles.districtItemActive]}>
            {index > 0 ? <View style={styles.districtConnector} /> : null}
            <Image source={district.image} style={styles.districtImage} contentFit="contain" />
            <Text style={styles.districtName} numberOfLines={1}>
              {district.name}
            </Text>
            <View style={styles.districtDeltaRow}>
              <Ionicons
                name={district.delta > 0 ? 'happy-outline' : 'remove-circle-outline'}
                size={13}
                color={district.delta > 0 ? palette.green : palette.gold}
              />
              <Text style={styles.districtDelta} numberOfLines={1}>
                {district.delta > 0 ? `+${district.delta}` : '0'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function EceComment({ fieldNote }: { fieldNote: string }) {
  return (
    <View style={styles.eceComment}>
      <Image source={eceImage} style={styles.eceCommentImage} contentFit="contain" />
      <View style={styles.eceCommentCopy}>
        <Text style={styles.eceCommentTitle} numberOfLines={1}>
          Ece’nin Yorumu
        </Text>
        <Text style={styles.eceCommentBody} numberOfLines={3}>
          {fieldNote || 'Harika bir iş çıkardın Can! Halkın memnuniyeti ve güveni yükseldi. Bu istikrarı koruyalım.'}
        </Text>
      </View>
    </View>
  );
}

export function DecisionResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const snapshot = useGameStore(selectLastDecisionResult);
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const activeEvents = gameState.events;
  const solvedEvents = gameState.solvedEvents;
  const currentDay = gameState.city.day;
  const operationSignals = useGameStore((s) => s.operationSignals);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const crisisState = useGameStore((s) => s.crisisState);
  const assignments = useGameStore((s) => s.assignments);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);

  const result = snapshot ?? createEmptyDecisionResultFallback();
  const isMissing = snapshot == null;

  const relatedEvent = useMemo(
    () => resolveEventForResult(result, activeEvents, solvedEvents),
    [activeEvents, result, solvedEvents],
  );

  useEffect(() => {
    if (isMissing || !result.eventId) return;
    trackOncePerRuntime(
      `event_completed:${result.eventId}`,
      'event_completed',
      buildEventResultAnalyticsPayload(
        relatedEvent,
        result.resultTone,
        gameState,
        monetization,
      ),
    );
  }, [gameState, isMissing, monetization, relatedEvent, result.eventId, result.resultTone]);

  const viewModel = useMemo(
    () =>
      buildEventResultViewModel(result, {
        event: relatedEvent,
        isFallback: isMissing,
      }),
    [isMissing, relatedEvent, result],
  );

  const domainResultFocus = useMemo(() => {
    if (!relatedEvent) return null;
    const satisfactionDelta = result.metricChanges.find((m) =>
      m.label.toLowerCase().includes('memnun'),
    )?.delta;
    const riskDelta = result.metricChanges.find((m) =>
      m.label.toLowerCase().includes('risk'),
    )?.delta;
    return buildEventDomainResultFocus(
      relatedEvent,
      {
        publicSatisfactionDelta: satisfactionDelta,
        riskDelta: riskDelta,
        successLabel: result.summaryTitle,
        tone: result.resultTone,
      },
      result.day ?? currentDay,
    );
  }, [currentDay, relatedEvent, result]);

  const showDomainResult =
    domainResultFocus &&
    shouldShowEventDomainFocus(
      result.day ?? currentDay,
      'result',
      domainResultFocus.model.focus,
    );

  const resultCarryOver = useMemo(() => {
    return buildResultCarryOverMemory({
      day: result.day ?? currentDay,
      currentEvent: relatedEvent ?? undefined,
      eventResult: {
        summaryText: result.summaryText,
        summaryTitle: result.summaryTitle,
        resultTone: result.resultTone,
        neighborhoodName: result.neighborhoodName,
        eventId: result.eventId,
      },
      suppressEchoDuplicate: Boolean(showDomainResult && domainResultFocus?.echoLine),
    });
  }, [
    currentDay,
    domainResultFocus?.echoLine,
    relatedEvent,
    result,
    showDomainResult,
  ]);

  const showResultCarryOver =
    resultCarryOver?.visible &&
    shouldShowCarryOverMemory(result.day ?? currentDay, 'result', {
      day: result.day ?? currentDay,
      currentEvent: relatedEvent ?? undefined,
      eventResult: {
        summaryText: result.summaryText,
        summaryTitle: result.summaryTitle,
        resultTone: result.resultTone,
      },
      suppressEchoDuplicate: Boolean(showDomainResult && domainResultFocus?.echoLine),
    });

  const impactExplanation = useMemo(
    () =>
      buildDecisionImpactExplanation({
        snapshot: result,
        event: relatedEvent,
        day: result.day ?? currentDay,
        operationSignals,
        resourceFatigue: operationalResources,
        carryOverSummary: resultCarryOver?.summary,
      }),
    [
      currentDay,
      operationalResources,
      operationSignals,
      relatedEvent,
      result,
      resultCarryOver?.summary,
    ],
  );

  const mapBeforeAfterSummary = useMemo(() => {
    if (isMissing) return null;
    const day = result.day ?? currentDay;
    const existingLines: string[] = [];
    if (domainResultFocus?.echoLine) existingLines.push(domainResultFocus.echoLine);
    if (resultCarryOver?.summary) existingLines.push(resultCarryOver.summary);
    if (result.summaryText) existingLines.push(result.summaryText);

    return buildMapBeforeAfterSummary({
      day,
      surface: 'result',
      activeEvent: relatedEvent ?? undefined,
      eventResult: {
        summaryText: result.summaryText,
        summaryTitle: result.summaryTitle,
        resultTone: result.resultTone,
        neighborhoodName: result.neighborhoodName,
        eventId: result.eventId,
      },
      eventDomainFocus: domainResultFocus?.model
        ? {
            focus: domainResultFocus.model.focus,
            reportEchoLine: domainResultFocus.echoLine ?? undefined,
            summary: domainResultFocus.model.summary,
          }
        : null,
      carryOverMemory: resultCarryOver
        ? {
            domain: resultCarryOver.domain,
            summary: resultCarryOver.summary,
            resolved: resultCarryOver.direction === 'positive_memory',
          }
        : null,
    });
  }, [
    currentDay,
    domainResultFocus?.echoLine,
    domainResultFocus?.model,
    isMissing,
    relatedEvent,
    result,
    resultCarryOver,
  ]);

  const showMapBeforeAfter =
    (result.day ?? currentDay) > 1 &&
    mapBeforeAfterSummary?.impact?.visible === true;

  const resultFatigueState = useMemo(() => {
    if (!relatedEvent || isMissing) return null;
    const domain = inferResourceDomainFromEventFocus(domainResultFocus?.model.focus);
    const primary = buildResourceFatigueVisualSummary({
      day: result.day ?? currentDay,
      surface: 'result',
      domain,
      operationalResources,
      operationSignals: {
        dailyFocus: operationSignals.dailyFocus,
        overall: { status: operationSignals.overall.status },
      },
      activeEvent: relatedEvent,
      eventDomainFocus: domainResultFocus?.model,
    }).primaryState;
    if (!primary) return null;
    const line = buildResourceFatiguePanelLine(primary);
    if (resultCarryOver?.summary && resultCarryOver.summary.length > 12) {
      if (line.toLowerCase().includes(resultCarryOver.summary.slice(0, 18).toLowerCase())) {
        return null;
      }
    }
    return primary;
  }, [
    currentDay,
    domainResultFocus?.model,
    isMissing,
    operationalResources,
    operationSignals,
    relatedEvent,
    result.day,
    resultCarryOver?.summary,
  ]);

  const resultSystemsEcho = useMemo(() => {
    if (isMissing) return null;
    const day = result.day ?? currentDay;
    const existingEchoLines: string[] = [];
    if (domainResultFocus?.echoLine) existingEchoLines.push(domainResultFocus.echoLine);
    if (resultCarryOver?.summary) existingEchoLines.push(resultCarryOver.summary);
    if (mapBeforeAfterSummary?.impact?.summary) {
      existingEchoLines.push(mapBeforeAfterSummary.impact.summary);
    }

    const assignment = result.eventId
      ? getEventAssignment(assignments, result.eventId)
      : undefined;

    return buildEventResultSystemsEchoModel({
      snapshot: result,
      event: relatedEvent ?? undefined,
      day,
      districtId: result.neighborhoodId ?? relatedEvent?.neighborhoodId,
      operationSignals,
      resourceFatigue: operationalResources,
      crisisState,
      rankKey: authorityState?.formalRankId,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      isPostPilot: day >= POST_PILOT_FIRST_OPERATION_DAY,
      isPilotCompleted: pilotStatus === 'completed',
      existingEchoLines,
      carryOverSummary: resultCarryOver?.summary,
      mapImpactSummary: mapBeforeAfterSummary?.impact?.summary,
      activeTaskRouteContext: {
        day,
        activeEvent: relatedEvent ?? undefined,
        assignment,
        operationSignals,
        operationalResources,
        crisisState,
        isResultPhase: true,
        eventPhase: 'result',
        rankKey: authorityState?.formalRankId,
        unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      },
    });
  }, [
    assignments,
    authorityState?.formalRankId,
    authorityState?.unlockedPermissionIds,
    crisisState,
    currentDay,
    domainResultFocus?.echoLine,
    isMissing,
    mapBeforeAfterSummary?.impact?.summary,
    operationalResources,
    operationSignals,
    pilotStatus,
    relatedEvent,
    result,
    resultCarryOver?.summary,
  ]);
  const resultSystemsAnalyticsContext = useMemo(
    () => {
      const day = result.day ?? currentDay;
      return {
        day,
        rankId: authorityState?.formalRankId,
        isPostPilot: day >= POST_PILOT_FIRST_OPERATION_DAY,
        source: 'decision_result_systems_echo',
      };
    },
    [authorityState?.formalRankId, currentDay, result.day],
  );

  const goHub = useCallback(() => {
    playLightImpactHaptic();
    router.replace('/');
  }, [router]);

  const goReports = useCallback(() => {
    playLightImpactHaptic();
    router.push('/reports' as Href);
  }, [router]);

  const legacyTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'decision_result'),
  );
  const { coachHint, dismissHint } = useOnboardingHint('decision_result');
  const scrollBottomPadding = tabBarHeight + Math.max(insets.bottom, 8) + 18;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: scrollBottomPadding },
        ]}>
        <PremiumResultHeader />

        <Animated.View entering={FadeInUp.duration(260)} style={styles.resultShell}>
          <View style={styles.resultTop}>
            <View style={styles.resultTitleBlock}>
              <Text style={styles.pageTitle} numberOfLines={1}>
                Operasyon Sonucu
              </Text>
              <Text style={styles.taskLine} numberOfLines={1}>
                Görev: {result.eventTitle || 'Merkez’e Kamu Memnuniyetini Artır'}
              </Text>
            </View>
            <Text style={styles.completedAt} numberOfLines={1}>
              Tamamlanma: 18:42
            </Text>
          </View>

          <Animated.View entering={ZoomIn.delay(80).duration(300)}>
            <RewardHero result={result} />
          </Animated.View>

          <EventResultImpactExplanationCard explanation={impactExplanation} compact />

          <BeforeAfterPanel result={result} />
          <ResultStatCards result={result} />

          {showDomainResult ? (
            <EventDomainFocusStrip
              model={{
                ...domainResultFocus.model,
                summary: domainResultFocus.echoLine ?? domainResultFocus.model.summary,
              }}
              surface="result"
              compact
            />
          ) : null}

          {showResultCarryOver && !showDomainResult ? (
            <EventCarryOverHintCard memory={resultCarryOver} compact />
          ) : null}

          {resultFatigueState ? (
            <View style={styles.fatigueChipRow}>
              <ResourceFatigueStateChip model={resultFatigueState} />
            </View>
          ) : null}

          {resultSystemsEcho?.visible ? (
            <EventResultSystemsEchoStrip
              model={resultSystemsEcho}
              analyticsContext={resultSystemsAnalyticsContext}
            />
          ) : null}

          {showMapBeforeAfter && mapBeforeAfterSummary?.impact ? (
            <EventMapImpactSummaryCard
              impact={mapBeforeAfterSummary.impact}
              compact={(result.day ?? currentDay) <= 2}
            />
          ) : null}

          <DistrictImpact result={result} />
          <EceComment fieldNote={viewModel.fieldNote} />

          <View style={styles.actionArea}>
            <Pressable
              onPress={goReports}
              accessibilityRole="button"
              accessibilityLabel="Gün sonu raporuna geç"
              style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}>
              <Ionicons name="newspaper-outline" size={19} color={palette.white} />
              <Text style={styles.primaryCtaText} numberOfLines={1}>
                Gün Sonu Raporuna Geç
              </Text>
            </Pressable>
            <Pressable
              onPress={goHub}
              accessibilityRole="button"
              accessibilityLabel="Merkeze dön"
              style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}>
              <Ionicons name="business" size={16} color={palette.tealDark} />
              <Text style={styles.secondaryCtaText} numberOfLines={1}>
                Merkeze Dön
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <TutorialCoachOverlay
        screen="decision_result"
        bottomOffset={tabBarHeight + 16}
      />
      {coachHint && !legacyTutorialStep ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
          bottomOffset={tabBarHeight + 16}
        />
      ) : null}
    </View>
  );
}

const softShadow = {
  shadowColor: '#253A37',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    paddingBottom: 18,
  },
  header: {
    minHeight: 118,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: palette.tealDark,
    overflow: 'hidden',
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  headerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 54, 51, 0.24)',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 10,
    gap: 6,
  },
  headerGreeting: {
    fontSize: 17,
    fontWeight: '900',
    color: palette.white,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.80)',
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  headerChipRow: {
    flexDirection: 'row',
    gap: 7,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 76,
    maxWidth: 84,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  headerChipText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '900',
    color: palette.white,
  },
  headerButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headerRoundButton: {
    width: 39,
    height: 39,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRoundActive: {
    backgroundColor: '#FFF1B8',
  },
  headerRoundGhost: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  resultShell: {
    marginHorizontal: 14,
    marginTop: -8,
    backgroundColor: palette.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 12,
    ...softShadow,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  resultTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: palette.textDark,
  },
  taskLine: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '800',
    color: palette.tealDark,
  },
  completedAt: {
    paddingTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: palette.textMuted,
    flexShrink: 0,
  },
  rewardHero: {
    minHeight: 136,
    borderRadius: 18,
    backgroundColor: '#F5F0E1',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    minWidth: 0,
  },
  successMedal: {
    width: 106,
    height: 106,
    borderRadius: 18,
    backgroundColor: '#F8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medalRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: palette.green,
    borderWidth: 5,
    borderColor: '#E8C869',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    zIndex: 1,
  },
  rewardTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    color: palette.textDark,
  },
  rewardText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: palette.textMuted,
  },
  rewardChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(189, 239, 231, 0.60)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 130,
  },
  rewardChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.tealDark,
  },
  rewardBuilding: {
    width: 136,
    height: 120,
    marginRight: -12,
    flexShrink: 0,
  },
  impactPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFCF5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.textDark,
  },
  beforeAfterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  beforeAfterBox: {
    flex: 1,
    minHeight: 78,
    borderRadius: 13,
    padding: 10,
    backgroundColor: '#F7F3EB',
    borderWidth: 1,
    borderColor: 'rgba(20,70,66,0.06)',
    gap: 7,
    minWidth: 0,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.textDark,
  },
  afterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLine: {
    gap: 3,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  metricLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 9,
    fontWeight: '800',
    color: palette.textMuted,
  },
  metricPercent: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.textDark,
  },
  metricDelta: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.green,
  },
  percentTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(20,70,66,0.12)',
    overflow: 'hidden',
  },
  percentFill: {
    height: '100%',
    borderRadius: 999,
  },
  arrowCircle: {
    width: 40,
    alignItems: 'center',
    flexShrink: 0,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '23.5%',
    minWidth: 78,
    flexGrow: 1,
    minHeight: 116,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFCF5',
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  statTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'stretch',
    minWidth: 0,
  },
  statIcon: {
    width: 20,
    height: 20,
    flexShrink: 0,
  },
  statTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 9,
    fontWeight: '900',
    color: palette.textDark,
  },
  statValue: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: '900',
    color: palette.tealDark,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.textDark,
    textAlign: 'center',
  },
  statBody: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '700',
    color: palette.textMuted,
    textAlign: 'center',
  },
  resourceLines: {
    marginTop: 4,
    gap: 2,
    alignSelf: 'stretch',
  },
  resourceLine: {
    fontSize: 8,
    fontWeight: '800',
    color: palette.textMuted,
  },
  districtPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
    backgroundColor: '#FFFCF5',
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minWidth: 0,
  },
  districtItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
    position: 'relative',
    paddingVertical: 4,
  },
  districtItemActive: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.tealSoft,
    backgroundColor: 'rgba(189,239,231,0.25)',
  },
  districtConnector: {
    position: 'absolute',
    left: '-50%',
    right: '50%',
    top: 32,
    height: 2,
    backgroundColor: palette.tealSoft,
  },
  districtImage: {
    width: 46,
    height: 38,
  },
  districtName: {
    fontSize: 8,
    fontWeight: '900',
    color: palette.textDark,
  },
  districtDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  districtDelta: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.tealDark,
  },
  eceComment: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 98,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFCF5',
    padding: 10,
    gap: 10,
    overflow: 'hidden',
  },
  eceCommentImage: {
    width: 78,
    height: 94,
    marginBottom: -14,
    flexShrink: 0,
  },
  eceCommentCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  eceCommentTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.textDark,
  },
  eceCommentBody: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: palette.textMuted,
  },
  actionArea: {
    gap: 8,
  },
  fatigueChipRow: {
    minWidth: 0,
    flexShrink: 1,
  },
  primaryCta: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: palette.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: '900',
    color: palette.white,
  },
  secondaryCta: {
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(20,70,66,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.60)',
  },
  secondaryCtaText: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.tealDark,
  },
  pressed: {
    opacity: 0.86,
  },
});
