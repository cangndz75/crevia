import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";

import { buildAuthorityGameplayPresentationContext } from "@/core/authority/authorityGameplayUnlockModel";
import { getRiskLevelLabel } from "@/core/content/mockGameData";
import {
  playLightImpactHaptic,
  playSelectionHaptic,
  playSuccessHaptic,
} from "@/core/feedback/hapticFeedback";
import type { EventCard } from "@/core/models/EventCard";
import { operationInspectScanConfig } from "@/core/motion/motionPresets";
import { eventDetail } from "@/features/events/theme/eventDetailTokens";
import {
  buildEventInspectPhasePresentation,
  type EventInspectInteractionState,
  type EventInspectRevealItem,
} from "@/features/events/utils/eventInspectPhasePresentation";
import {
  buildOperationWorkflowClarityPresentation,
  type OperationInvestigationChecklistItem,
  type OperationWorkflowAdvisorHint,
  type OperationWorkflowClarityPresentation,
  type OperationPrimaryCta,
} from "@/features/events/utils/operationWorkflowClarityPresentation";
import { OperationPhaseContentEnter } from "@/features/events/components/event-workflow/OperationPhaseContentEnter";
import { OperationPhaseProgressRail } from "@/features/events/components/event-workflow/OperationPhaseProgressRail";
import { OperationPhaseShellHeader } from "@/features/events/components/event-workflow/OperationPhaseShellHeader";
import { buildEventResultDistrictContextLine } from "@/features/events/utils/eventResultPresentation";
import { buildInspectHeroChips } from "@/features/events/utils/eventWorkflowPresentation";
import { OnboardingPhaseHint } from "@/features/onboarding/components/OnboardingPhaseHint";
import { CreviaMotionView, useCreviaReducedMotion } from "@/shared/motion";
import { useGameStore } from "@/store/useGameStore";
import { shadows } from "@/ui/theme/shadows";

type EventInspectPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  onOpenPlanning: () => void;
  phaseHint?: string | null;
  gameDay?: number;
  isDay1LearningEvent?: boolean;
};

type SignalId = "field" | "citizen" | "social";
type RiskId = "trust" | "reaction" | "resource";
type ActionId = "inspect" | "verify" | "note";
type InspectModal =
  | { type: "incident" }
  | { type: "signal"; signalId: SignalId }
  | { type: "risk"; riskId: RiskId }
  | { type: "note" }
  | { type: "unlocked" }
  | null;

type SignalSource = {
  id: SignalId;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  detail: string;
  findings: string[];
};

type RiskPreview = {
  id: RiskId;
  title: string;
  level: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  detail: string;
};

type InspectAction = {
  id: ActionId;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SIGNALS: SignalSource[] = [
  {
    id: "field",
    title: "Saha",
    icon: "walk-outline",
    detail: "Park çevresinde ışık seviyesi düşük.",
    findings: [
      "Aydınlatma direkleri zayıf.",
      "Ekip gözlemi doğrulandı.",
      "Akşam kullanımı azaldı.",
    ],
  },
  {
    id: "citizen",
    title: "Vatandaş",
    icon: "chatbubble-ellipses-outline",
    detail: "Şikayetler park çevresinde yoğunlaşıyor.",
    findings: [
      "Son bildirimler aynı noktada.",
      "Güven algısı düşüyor.",
      "Aile kullanımı azaldı.",
    ],
  },
  {
    id: "social",
    title: "Sosyal",
    icon: "radio-outline",
    detail: "Mahalle konuşmaları aynı sorunu işaret ediyor.",
    findings: [
      "Sosyal tepki yükseliyor.",
      "Gece saatleri öne çıkıyor.",
      "Duyarlılık orta seviyede.",
    ],
  },
];

const RISKS: RiskPreview[] = [
  {
    id: "trust",
    title: "Güven",
    level: "Yüksek",
    value: 88,
    color: "#D95F50",
    icon: "shield-outline",
    detail: "Akşam kullanımı düştüğü için güven algısı zayıflıyor.",
  },
  {
    id: "reaction",
    title: "Tepki",
    level: "Orta",
    value: 62,
    color: "#D9A646",
    icon: "alert-circle-outline",
    detail: "Vatandaş tepkisi büyümeden kısa planlama gerekiyor.",
  },
  {
    id: "resource",
    title: "Kaynak",
    level: "Düşük",
    value: 38,
    color: eventDetail.teal,
    icon: "briefcase-outline",
    detail: "Mevcut ekiplerle ilk müdahale hazırlanabilir.",
  },
];

const ACTIONS: InspectAction[] = [
  { id: "inspect", title: "Sinyali İncele", icon: "scan-outline" },
  { id: "verify", title: "Doğrula", icon: "checkmark-done-outline" },
  { id: "note", title: "Not Aç", icon: "create-outline" },
];

function normalizeCategory(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("light") || lower.includes("aydın"))
    return "Aydınlatma Sorunu";
  if (lower.includes("waste") || lower.includes("temizlik"))
    return "Temizlik Baskısı";
  if (lower.includes("noise")) return "Mahalle Gürültüsü";
  return category || "Aydınlatma Sorunu";
}

function shortRemainingLabel(label: string): string {
  return label.replace(" kaldı", "").replace("Öncelik: ", "");
}

export function EventInspectPhase({
  event,
  bottomPadding,
  onOpenPlanning,
  phaseHint = null,
  gameDay = 1,
  isDay1LearningEvent = false,
}: EventInspectPhaseProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useCreviaReducedMotion();
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const hasRevealedRef = useRef(false);
  const [interactionState, setInteractionState] =
    useState<EventInspectInteractionState>(() =>
      hasRevealedRef.current ? "revealed" : "idle",
    );
  const [confirmedSignals, setConfirmedSignals] = useState<SignalId[]>([]);
  const [activeModal, setActiveModal] = useState<InspectModal>(null);
  const [noteText, setNoteText] = useState("");

  const heroChips = useMemo(() => buildInspectHeroChips(event), [event]);
  const categoryLabel = useMemo(
    () => normalizeCategory(event.category),
    [event.category],
  );
  const districtContextLine = useMemo(
    () => buildEventResultDistrictContextLine(event),
    [event],
  );

  const authorityGameplayContext = useMemo(
    () =>
      buildAuthorityGameplayPresentationContext({
        authorityState,
        day: gameDay,
        isDay1LearningEvent,
      }),
    [authorityState, gameDay, isDay1LearningEvent],
  );

  const presentation = useMemo(
    () =>
      buildEventInspectPhasePresentation({
        event,
        interactionState,
        reducedMotion,
        day: gameDay,
        isDay1LearningEvent,
        authorityGameplayContext,
      }),
    [
      authorityGameplayContext,
      event,
      gameDay,
      interactionState,
      isDay1LearningEvent,
      reducedMotion,
    ],
  );

  const scanConfig = useMemo(
    () => operationInspectScanConfig(reducedMotion),
    [reducedMotion],
  );

  const compact = width < 370;
  const confirmedCount = confirmedSignals.length;
  const planUnlocked =
    interactionState === "revealed" || confirmedCount >= SIGNALS.length;

  const clarity = useMemo(
    () =>
      buildOperationWorkflowClarityPresentation({
        event,
        day: gameDay,
        interactionState,
        confirmedSignalIds: confirmedSignals,
        findings: presentation.findings,
        advisorComment: presentation.advisorComment,
        phaseHeader: presentation.phaseTransition.shell,
        isDay1LearningEvent,
      }),
    [
      confirmedSignals,
      event,
      gameDay,
      interactionState,
      isDay1LearningEvent,
      presentation.advisorComment,
      presentation.findings,
      presentation.phaseTransition.shell,
    ],
  );

  const mapSignalIdToModal = useCallback((signalAnalysisId: string): SignalId | null => {
    if (signalAnalysisId === 'social_pulse') return 'social';
    if (signalAnalysisId === 'field_observations') return 'field';
    if (signalAnalysisId === 'similar_cases') return 'citizen';
    return null;
  }, []);

  const mapEvidenceIdToSignal = useCallback((evidenceId: string): SignalId | null => {
    if (evidenceId === 'field_finding') return 'field';
    if (evidenceId === 'citizen_report') return 'citizen';
    if (evidenceId === 'social_echo') return 'social';
    return null;
  }, []);

  const mapRiskIdToModal = useCallback((riskPreviewId: string): RiskId => {
    if (riskPreviewId === 'operation_risk') return 'resource';
    if (riskPreviewId === 'resource_pressure' || riskPreviewId === 'press_reflection') {
      return 'reaction';
    }
    return 'trust';
  }, []);

  const handleLowerActionPress = useCallback(
    (actionKey: string) => {
      playLightImpactHaptic();
      switch (actionKey) {
        case 'scan_signal':
          if (interactionState === 'idle') {
            setInteractionState('analyzing');
          } else {
            setActiveModal({ type: 'incident' });
          }
          return;
        case 'view_risk':
          setActiveModal({ type: 'risk', riskId: 'trust' });
          return;
        case 'view_map':
          setActiveModal({ type: 'incident' });
          return;
        case 'open_note':
          setActiveModal({ type: 'note' });
          return;
        default:
          return;
      }
    },
    [interactionState],
  );

  const revealInspection = useCallback(() => {
    hasRevealedRef.current = true;
    setInteractionState("revealed");
  }, []);

  const confirmSignal = useCallback(
    (signalId: SignalId) => {
      setConfirmedSignals((current) => {
        if (current.includes(signalId)) return current;
        const next = [...current, signalId];
        if (next.length >= SIGNALS.length) {
          revealInspection();
          playSuccessHaptic();
          setActiveModal({ type: "unlocked" });
        } else {
          playSelectionHaptic();
        }
        return next;
      });
    },
    [revealInspection],
  );

  const confirmAllSignals = useCallback(() => {
    setConfirmedSignals(SIGNALS.map((signal) => signal.id));
    revealInspection();
    playSuccessHaptic();
    setActiveModal({ type: "unlocked" });
  }, [revealInspection]);

  const confirmNextMissingSignal = useCallback(() => {
    const next = clarity.investigationChecklist.find(
      (item) => item.status === 'waiting',
    );
    if (next) {
      confirmSignal(next.id);
      return;
    }
    confirmAllSignals();
  }, [clarity.investigationChecklist, confirmAllSignals, confirmSignal]);

  useEffect(() => {
    if (interactionState !== "analyzing") return;

    const durationMs = reducedMotion ? 0 : scanConfig.durationMs;
    const timer = setTimeout(() => {
      revealInspection();
      setConfirmedSignals(SIGNALS.map((signal) => signal.id));
      setActiveModal({ type: "unlocked" });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [
    interactionState,
    reducedMotion,
    revealInspection,
    scanConfig.durationMs,
  ]);

  const handleStickyPress = useCallback(() => {
    playLightImpactHaptic();
    if (clarity.primaryCta.actionKey === 'go_to_plan') {
      onOpenPlanning();
      return;
    }
    if (
      clarity.primaryCta.actionKey === 'verify_first' ||
      clarity.primaryCta.actionKey === 'complete_missing' ||
      clarity.primaryCta.actionKey === 'verify_critical'
    ) {
      confirmNextMissingSignal();
      return;
    }
    if (interactionState === "idle") {
      setInteractionState("analyzing");
    }
  }, [
    clarity.primaryCta.actionKey,
    confirmNextMissingSignal,
    interactionState,
    onOpenPlanning,
  ]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(
              bottomPadding,
              118 + Math.max(insets.bottom, 12),
            ),
          },
        ]}
      >
        <OperationPhaseShellHeader
          shell={clarity.phaseHeader}
          compact={compact}
          reducedMotion={reducedMotion}
        />
        <OperationPhaseProgressRail
          progress={presentation.phaseTransition.progress}
          reducedMotion={reducedMotion}
        />
        <OperationPhaseContentEnter reducedMotion={reducedMotion} index={2}>
          <InspectHeroBriefCard
            brief={clarity.investigationBrief}
            compact={compact}
            reducedMotion={reducedMotion}
          />
          {districtContextLine && clarity.densityBand === 'strategic' ? (
            <Text style={styles.districtContext} numberOfLines={1}>
              {districtContextLine}
            </Text>
          ) : null}
          <InvestigationChecklistCard
            items={clarity.investigationChecklist}
            verifiedCount={clarity.verifiedCount}
            requiredCount={clarity.requiredCount}
            onPressItem={(item) => {
              if (item.status === 'waiting') {
                confirmSignal(item.id);
              } else if (item.status === 'verified') {
                setActiveModal({ type: 'signal', signalId: item.id });
              }
            }}
          />
          <PlanningImpactCard presentation={clarity} />
          <ClarityAdvisorCard hint={clarity.advisorHint} />
        </OperationPhaseContentEnter>
        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}
      </ScrollView>

      <StickyUnlockBar
        cta={clarity.primaryCta}
        confirmedCount={clarity.verifiedCount}
        totalCount={clarity.requiredCount}
        loading={interactionState === "analyzing"}
        onPress={handleStickyPress}
      />

      <InspectModalHost
        modal={activeModal}
        noteText={noteText}
        setNoteText={setNoteText}
        onClose={() => setActiveModal(null)}
        onSignalConfirm={(signalId) => {
          confirmSignal(signalId);
          setActiveModal(null);
        }}
        onIncidentInspect={() => {
          setActiveModal(null);
          if (interactionState === "idle") setInteractionState("analyzing");
        }}
        onSaveNote={() => {
          playSuccessHaptic();
          setActiveModal(null);
        }}
        onGoPlan={() => {
          setActiveModal(null);
          onOpenPlanning();
        }}
      />
    </SafeAreaView>
  );
}

function resolveRevealToneColor(tone: EventInspectRevealItem["tone"]): string {
  if (tone === "urgent" || tone === "warning") return "#D9A646";
  if (tone === "positive") return eventDetail.teal;
  return eventDetail.tealDark;
}

function InspectRevealFlow({
  items,
  revealed,
  reducedMotion,
}: {
  items: EventInspectRevealItem[];
  revealed: boolean;
  reducedMotion: boolean;
}) {
  return (
    <View style={styles.cardWrap}>
      <View style={[styles.revealFlowCard, shadows.soft]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sinyal çözümleme</Text>
          <Text style={styles.sectionMeta}>
            {revealed ? "Bulgu hazır" : "3 iz"}
          </Text>
        </View>
        <View style={styles.revealFlowList}>
          {items.map((item, index) => {
            const color = resolveRevealToneColor(item.tone);
            return (
              <CreviaMotionView
                key={item.id}
                motionKind="line_appear"
                surface="shared"
                index={index}
                reducedMotion={reducedMotion}
                style={styles.revealItem}
              >
                <View style={[styles.revealIcon, { backgroundColor: `${color}18` }]}>
                  <Ionicons
                    name={item.iconKey as keyof typeof Ionicons.glyphMap}
                    size={15}
                    color={color}
                  />
                </View>
                <View style={styles.revealCopy}>
                  <Text style={styles.revealTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.revealBody} numberOfLines={2}>
                    {revealed ? item.body : "Sinyali doğrula, bulgu netleşsin."}
                  </Text>
                </View>
                <View style={styles.revealChip}>
                  <Text style={styles.revealChipText} numberOfLines={1}>
                    {item.impactChip}
                  </Text>
                </View>
              </CreviaMotionView>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function InspectHeroBriefCard({
  brief,
  compact,
  reducedMotion,
}: {
  brief: OperationWorkflowClarityPresentation['investigationBrief'];
  compact: boolean;
  reducedMotion: boolean;
}) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={1}
      style={styles.cardWrap}
    >
      <View style={[styles.inspectHeroCard, shadows.soft]}>
        <InspectHeroVisual
          variant={brief.heroVisualVariant}
          markers={brief.markerItems}
          reducedMotion={reducedMotion}
        />
        <LinearGradient
          colors={["rgba(7, 35, 34, 0)", "rgba(7, 35, 34, 0.90)"]}
          style={styles.inspectHeroOverlay}
        />
        <View style={styles.inspectHeroContent}>
          <View style={styles.inspectHeroChipRow}>
            <View style={styles.inspectHeroChip}>
              <Ionicons name="location" size={12} color="#DDF4E8" />
              <Text style={styles.inspectHeroChipText} numberOfLines={1}>
                {brief.locationLabel}
              </Text>
            </View>
            <View style={[styles.inspectHeroChip, styles.inspectHeroChipGold]}>
              <Ionicons name="ellipse" size={7} color="#D9A646" />
              <Text style={styles.inspectHeroChipGoldText} numberOfLines={1}>
                {brief.priorityLabel}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.inspectHeroTitle, compact && styles.inspectHeroTitleCompact]}
            numberOfLines={2}>
            {brief.title}
          </Text>
          <Text style={styles.inspectHeroSubtitle} numberOfLines={1}>
            {brief.heroSubtitle}
          </Text>
          <View style={styles.inspectHeroMetrics}>
            <InspectHeroMetric
              icon="help"
              label={brief.missingInfoLabel}
              value={brief.infoProgressLabel}
              tone="teal"
            />
            <InspectHeroMetric
              icon="analytics"
              label="Plan kalitesi"
              value={brief.planQualityLabel}
              tone="blue"
            />
          </View>
          <View style={styles.inspectHeroRiskLine}>
            <Ionicons name="alert-circle" size={14} color="#F4D07B" />
            <Text style={styles.inspectHeroRiskText} numberOfLines={2}>
              {brief.riskLine}
            </Text>
          </View>
        </View>
      </View>
    </CreviaMotionView>
  );
}

function InspectHeroMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: 'teal' | 'blue';
}) {
  return (
    <View
      style={[
        styles.inspectHeroMetric,
        tone === 'blue' && styles.inspectHeroMetricBlue,
      ]}>
      <View style={styles.inspectHeroMetricIcon}>
        <Ionicons name={icon} size={15} color="#FFFFFF" />
      </View>
      <View style={styles.inspectHeroMetricCopy}>
        <Text style={styles.inspectHeroMetricLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.inspectHeroMetricValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function markerColor(tone: OperationWorkflowClarityPresentation['investigationBrief']['markerItems'][number]['tone']) {
  if (tone === 'warning') return '#D95F50';
  if (tone === 'gold') return '#D9A646';
  return eventDetail.teal;
}

function InspectHeroVisual({
  variant,
  markers,
  reducedMotion,
}: {
  variant: OperationWorkflowClarityPresentation['investigationBrief']['heroVisualVariant'];
  markers: OperationWorkflowClarityPresentation['investigationBrief']['markerItems'];
  reducedMotion: boolean;
}) {
  const isSchool = variant === 'school_cleaning';
  const isContainer = variant === 'container_overflow';
  const isLighting = variant === 'lighting_issue';

  return (
    <View style={styles.inspectHeroVisual}>
      <LinearGradient
        colors={["#DDF4E8", "#F7E3B9", "#183D3B"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" viewBox="0 0 340 230">
        <Defs>
          <SvgGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.42" />
            <Stop offset="1" stopColor="#0B2F30" stopOpacity="0.12" />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="340" height="230" fill="url(#heroShade)" />
        <Circle cx="58" cy="42" r="28" fill="#F7C95F" opacity="0.45" />
        <Path d="M0 72 C58 45 118 54 176 70 C232 86 284 72 340 48 V0 H0 Z" fill="#F8FCF2" opacity="0.72" />
        <Path d="M0 150 C70 128 142 134 206 148 C262 160 304 150 340 132 V230 H0 Z" fill="#6AA484" />
        <Path d="M0 172 C82 152 162 154 246 172 C286 180 318 177 340 168 V230 H0 Z" fill="#476A5B" />
        <Path d="M28 178 C92 150 166 158 258 136" stroke="#DED3BA" strokeWidth="17" strokeLinecap="round" fill="none" />
        <Path d="M30 177 C96 154 168 159 258 139" stroke="#F6EEE0" strokeWidth="9" strokeLinecap="round" fill="none" />
        <G>
          <Rect x="128" y={isSchool ? 58 : 72} width="124" height="72" rx="8" fill={isSchool ? "#F0C897" : "#E8D4AA"} />
          <Path d="M122 60 L190 28 L258 60 Z" fill="#C66F43" />
          <Rect x="178" y="95" width="22" height="35" rx="3" fill="#6D7F7D" />
          {[145, 168, 210, 232].map((x) => (
            <Rect key={x} x={x} y="75" width="15" height="14" rx="3" fill="#B9DBE1" opacity="0.95" />
          ))}
          {isSchool ? <Rect x="178" y="62" width="28" height="9" rx="3" fill="#2E9D99" /> : null}
        </G>
        <G opacity={isLighting ? 1 : 0.72}>
          <Rect x="68" y="90" width="4" height="62" rx="2" fill="#284642" />
          <Circle cx="70" cy="90" r="13" fill="#FFD98A" opacity={isLighting ? 0.46 : 0.24} />
          <Circle cx="70" cy="90" r="5" fill="#FFE8A9" />
        </G>
        <G>
          <Rect x="38" y="142" width="44" height="12" rx="5" fill="#365B55" />
          <Rect x="43" y="130" width="34" height="12" rx="3" fill="#8B6B43" />
          <Rect x="43" y="154" width="4" height="15" rx="2" fill="#284642" />
          <Rect x="73" y="154" width="4" height="15" rx="2" fill="#284642" />
        </G>
        <G opacity={isContainer ? 1 : 0.88}>
          <Rect x="244" y="150" width="38" height="30" rx="7" fill="#276E70" />
          <Rect x="250" y="143" width="29" height="9" rx="4" fill="#4B8F8A" />
          <Circle cx="252" cy="181" r="4" fill="#1E3432" />
          <Circle cx="276" cy="181" r="4" fill="#1E3432" />
          <Path d="M222 188 C238 177 262 190 292 180" stroke="#F1D2A1" strokeWidth="3" strokeDasharray="6 5" fill="none" />
          <Circle cx="224" cy="186" r="4" fill="#D95F50" opacity="0.72" />
          <Rect x="234" y="182" width="10" height="5" rx="2" fill="#F3E2BE" />
        </G>
        <G>
          <Rect x="90" y="119" width="4" height="42" rx="2" fill="#355750" />
          <Rect x="102" y="118" width="4" height="42" rx="2" fill="#355750" />
          <Rect x="84" y="126" width="30" height="4" rx="2" fill="#355750" />
          <Rect x="84" y="137" width="30" height="4" rx="2" fill="#355750" />
          <Rect x="84" y="148" width="30" height="4" rx="2" fill="#355750" />
        </G>
      </Svg>
      {markers.map((marker) => (
        <InspectHeroMarker
          key={marker.id}
          marker={marker}
          color={markerColor(marker.tone)}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

function InspectHeroMarker({
  marker,
  color,
  reducedMotion,
}: {
  marker: OperationWorkflowClarityPresentation['investigationBrief']['markerItems'][number];
  color: string;
  reducedMotion: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100 }),
        withTiming(0, { duration: 1100 }),
      ),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.22, 0.46]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.88, 1.18]) }],
  }));

  return (
    <View
      style={[
        styles.inspectHeroMarker,
        {
          left: `${marker.x}%`,
          top: `${marker.y}%`,
        },
      ]}>
      <Animated.View
        style={[
          styles.inspectHeroMarkerPulse,
          { backgroundColor: color },
          pulseStyle,
        ]}
      />
      <View style={[styles.inspectHeroMarkerCore, { backgroundColor: color }]}>
        <Ionicons
          name={marker.iconKey as keyof typeof Ionicons.glyphMap}
          size={14}
          color="#FFFFFF"
        />
      </View>
    </View>
  );
}

function checklistToneStyle(status: OperationInvestigationChecklistItem['status']) {
  if (status === 'verified') return styles.checklistStatusVerified;
  if (status === 'locked') return styles.checklistStatusLocked;
  if (status === 'optional') return styles.checklistStatusOptional;
  return styles.checklistStatusWaiting;
}

function checklistIconName(status: OperationInvestigationChecklistItem['status']) {
  if (status === 'verified') return 'checkmark-circle' as const;
  if (status === 'locked') return 'lock-closed-outline' as const;
  if (status === 'optional') return 'ellipse-outline' as const;
  return 'ellipse-outline' as const;
}

function InvestigationChecklistCard({
  items,
  verifiedCount,
  requiredCount,
  onPressItem,
}: {
  items: OperationInvestigationChecklistItem[];
  verifiedCount: number;
  requiredCount: number;
  onPressItem: (item: OperationInvestigationChecklistItem) => void;
}) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={2}
      style={styles.cardWrap}
    >
      <View style={[styles.checklistCard, shadows.soft]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Doğrulanacak Bilgiler</Text>
          <Text style={styles.sectionMeta}>{verifiedCount}/{requiredCount}</Text>
        </View>
        <View style={styles.checklistList}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onPressItem(item)}
              disabled={item.status === 'locked' || item.status === 'optional'}
              style={({ pressed }) => [
                styles.checklistRow,
                pressed && item.status !== 'locked' && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}: ${item.statusLabel}`}>
              <Ionicons
                name={checklistIconName(item.status)}
                size={20}
                color={item.status === 'verified' ? eventDetail.teal : 'rgba(107,125,120,0.62)'}
              />
              <View style={styles.checklistCopy}>
                <View style={styles.checklistTitleRow}>
                  <Text style={styles.checklistTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={[styles.checklistStatus, checklistToneStyle(item.status)]}>
                    <Text style={styles.checklistStatusText} numberOfLines={1}>
                      {item.statusLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.checklistBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <View style={styles.checklistImpactRow}>
                  <Text style={styles.checklistImpact} numberOfLines={1}>
                    Etki: {item.impactLabel}
                  </Text>
                  {item.ctaLabel ? (
                    <Text style={styles.checklistInlineCta} numberOfLines={1}>
                      {item.ctaLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </CreviaMotionView>
  );
}

function PlanningImpactCard({
  presentation,
}: {
  presentation: OperationWorkflowClarityPresentation;
}) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={3}
      style={styles.cardWrap}
    >
      <View style={[styles.planningImpactCard, shadows.soft]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{presentation.planningImpact.title}</Text>
          <Text style={styles.sectionMeta}>
            {presentation.densityBand === 'day1_simple' ? 'Sade' : 'Stratejik'}
          </Text>
        </View>
        {presentation.planningImpact.lines.map((line) => (
          <View key={line} style={styles.impactLineRow}>
            <View style={styles.impactDot} />
            <Text style={styles.impactLineText} numberOfLines={2}>
              {line}
            </Text>
          </View>
        ))}
      </View>
    </CreviaMotionView>
  );
}

function ClarityAdvisorCard({ hint }: { hint: OperationWorkflowAdvisorHint }) {
  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={4}
      style={styles.cardWrap}
    >
      <View style={[styles.clarityEceCard, shadows.soft]}>
        <View style={styles.clarityEceAvatar}>
          <Text style={styles.eceInitial}>E</Text>
        </View>
        <View style={styles.eceCopy}>
          <Text style={styles.eceName}>{hint.title}</Text>
          <Text style={styles.eceText} numberOfLines={3}>
            {hint.text}
          </Text>
        </View>
      </View>
    </CreviaMotionView>
  );
}

function EventBriefCard({
  event,
  categoryLabel,
  priorityLabel,
  remainingLabel,
  compact,
}: {
  event: EventCard;
  categoryLabel: string;
  priorityLabel: string;
  remainingLabel: string;
  compact: boolean;
}) {
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withSequence(
      withTiming(1, { duration: 280 }),
      withTiming(0, { duration: 260 }),
    );
  }, [pop]);

  const crestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 1], [1, 1.07]) }],
  }));

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={1}
      style={styles.cardWrap}
    >
      <View style={[styles.briefCard, shadows.soft]}>
        <Animated.View style={[styles.eventCrestOuter, crestStyle]}>
          <View style={styles.eventCrest}>
            <Ionicons name="bulb-outline" size={27} color="#F5C76A" />
          </View>
        </Animated.View>
        <View style={styles.briefTextBlock}>
          <Text style={styles.overline}>Olay Brifingi</Text>
          <Text
            style={[styles.briefTitle, compact && styles.briefTitleCompact]}
            numberOfLines={2}
          >
            {event.title || "Mahalle Güveni Düşüyor"}
          </Text>
          <Text style={styles.briefMeta} numberOfLines={1}>
            {event.district || "Çınar Mahallesi"}
          </Text>
          <Text style={styles.briefMeta} numberOfLines={1}>
            {categoryLabel}
          </Text>
        </View>
        <View style={styles.briefBadges}>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText} numberOfLines={1}>
              {priorityLabel}
            </Text>
          </View>
          <View style={styles.timeBadge}>
            <Ionicons
              name="time-outline"
              size={12}
              color={eventDetail.tealDark}
            />
            <Text style={styles.timeText} numberOfLines={1}>
              {remainingLabel || "02:45"}
            </Text>
          </View>
        </View>
      </View>
    </CreviaMotionView>
  );
}

function MiniIncidentSceneCard({
  reducedMotion,
  onOpen,
}: {
  reducedMotion: boolean;
  onOpen: () => void;
}) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={2}
      style={styles.cardWrap}
    >
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.sceneCard,
          shadows.card,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Mini olay sahnesini önizle"
      >
        <IncidentSceneArt reducedMotion={reducedMotion} large={false} />
        <View style={styles.sceneFooter}>
          <Text style={styles.sceneStatus} numberOfLines={2}>
            Park aydınlatmaları çalışmıyor.
          </Text>
          <View style={styles.sceneMapButton}>
            <Ionicons
              name="map-outline"
              size={16}
              color={eventDetail.tealDark}
            />
          </View>
        </View>
      </Pressable>
    </CreviaMotionView>
  );
}

function IncidentSceneArt({
  reducedMotion,
  large,
}: {
  reducedMotion: boolean;
  large: boolean;
}) {
  const zoom = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    zoom.value = withTiming(1, { duration: reducedMotion ? 0 : 800 });
    if (!reducedMotion) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 1200 }),
        ),
        -1,
        true,
      );
    }
  }, [pulse, reducedMotion, zoom]);

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(zoom.value, [0, 1], [0.96, 1]) }],
  }));

  const alertStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.14]) }],
  }));

  return (
    <Animated.View
      style={[styles.sceneArt, large && styles.sceneArtLarge, sceneStyle]}
    >
      <LinearGradient
        colors={["#244F58", "#123E43", "#F2B66A"]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" viewBox="0 0 330 170">
        <Defs>
          <SvgGradient id="fog" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.22" />
          </SvgGradient>
        </Defs>
        <Ellipse cx="166" cy="137" rx="142" ry="22" fill="rgba(9,40,43,0.24)" />
        <Path d="M38 120 L112 78 L202 118 L130 154 Z" fill="#8FCBAD" />
        <Path d="M112 78 L254 84 L296 121 L202 118 Z" fill="#C9DFB8" />
        <Path d="M130 154 L202 118 L296 121 L224 158 Z" fill="#69A887" />
        <Rect x="72" y="58" width="34" height="54" rx="4" fill="#E9D8B6" />
        <Rect x="118" y="44" width="42" height="70" rx="4" fill="#F3E2BE" />
        <Rect x="207" y="60" width="48" height="48" rx="4" fill="#EAD4AA" />
        {[82, 98, 129, 148, 219, 240].map((x) => (
          <Rect
            key={x}
            x={x}
            y={x < 200 ? 68 : 72}
            width="8"
            height="8"
            rx="2"
            fill="#FFD98A"
            opacity="0.82"
          />
        ))}
        <Path
          d="M58 132 C112 116 180 132 258 112"
          stroke="#365B55"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
          opacity="0.72"
        />
        <G>
          <Rect x="254" y="78" width="4" height="48" rx="2" fill="#263C3A" />
          <Circle cx="256" cy="78" r="15" fill="#D95F50" opacity="0.18" />
          <Circle cx="256" cy="78" r="8" fill="#D95F50" opacity="0.52" />
          <Path d="M256 68 L264 83 H248 Z" fill="#FFE1A3" />
          <Rect x="255" y="73" width="2" height="6" rx="1" fill="#8B3F2F" />
          <Circle cx="256" cy="82" r="1.5" fill="#8B3F2F" />
        </G>
        {[66, 154].map((x, i) => (
          <G key={x}>
            <Rect
              x={x}
              y={80 + i * 5}
              width="4"
              height="45"
              rx="2"
              fill="#263C3A"
            />
            <Circle
              cx={x + 2}
              cy={80 + i * 5}
              r="9"
              fill="#FFD98A"
              opacity={i === 0 ? 0.28 : 0.5}
            />
            <Circle
              cx={x + 2}
              cy={80 + i * 5}
              r="4"
              fill={i === 0 ? "#7F7560" : "#FFE6A7"}
            />
          </G>
        ))}
        <Rect x="166" y="120" width="25" height="13" rx="5" fill="#0B6B61" />
        <Circle cx="173" cy="134" r="3" fill="#1E302F" />
        <Circle cx="186" cy="134" r="3" fill="#1E302F" />
        <Path
          d="M166 139 C148 143 132 142 115 147"
          stroke="#EAD7B3"
          strokeWidth="2"
          strokeDasharray="5 4"
          fill="none"
          opacity="0.7"
        />
        <Rect x="0" y="112" width="330" height="58" fill="url(#fog)" />
      </Svg>
      <Animated.View
        style={[styles.signalRing, large && styles.signalRingLarge, alertStyle]}
      />
    </Animated.View>
  );
}

function SignalSourceRow({
  confirmedSignals,
  onPressSignal,
  reducedMotion,
}: {
  confirmedSignals: SignalId[];
  onPressSignal: (signalId: SignalId) => void;
  reducedMotion: boolean;
}) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={3}
      style={styles.cardWrap}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sinyal Kaynakları</Text>
        <Text style={styles.sectionMeta}>{confirmedSignals.length}/3</Text>
      </View>
      <View style={styles.signalRow}>
        {SIGNALS.map((signal, index) => (
          <SignalSourceCard
            key={signal.id}
            signal={signal}
            confirmed={confirmedSignals.includes(signal.id)}
            index={index}
            reducedMotion={reducedMotion}
            onPress={() => onPressSignal(signal.id)}
          />
        ))}
      </View>
    </CreviaMotionView>
  );
}

function SignalSourceCard({
  signal,
  confirmed,
  index,
  reducedMotion,
  onPress,
}: {
  signal: SignalSource;
  confirmed: boolean;
  index: number;
  reducedMotion: boolean;
  onPress: () => void;
}) {
  const pop = useSharedValue(0);

  useEffect(() => {
    if (!confirmed) return;
    pop.value = withSequence(
      withTiming(1, { duration: reducedMotion ? 0 : 160 + index * 60 }),
      withTiming(0, { duration: reducedMotion ? 0 : 180 }),
    );
  }, [confirmed, index, pop, reducedMotion]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 1], [1, 1.22]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.signalCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${signal.title} sinyal kaynağı`}
    >
      <View style={styles.signalIcon}>
        <Ionicons name={signal.icon} size={18} color={eventDetail.tealDark} />
      </View>
      <Text style={styles.signalTitle} numberOfLines={1}>
        {signal.title}
      </Text>
      <Animated.View
        style={[
          styles.signalCheck,
          confirmed && styles.signalCheckConfirmed,
          checkStyle,
        ]}
      >
        <Ionicons
          name="checkmark"
          size={11}
          color={confirmed ? "#FFFFFF" : eventDetail.teal}
        />
      </Animated.View>
    </Pressable>
  );
}

function RiskPreviewRow({
  onPressRisk,
}: {
  onPressRisk: (riskId: RiskId) => void;
}) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={4}
      style={styles.cardWrap}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Risk Ön Okuması</Text>
      </View>
      <View style={styles.riskRow}>
        {RISKS.map((risk, index) => (
          <RiskPreviewCard
            key={risk.id}
            risk={risk}
            index={index}
            onPress={() => onPressRisk(risk.id)}
          />
        ))}
      </View>
    </CreviaMotionView>
  );
}

function RiskPreviewCard({
  risk,
  index,
  onPress,
}: {
  risk: RiskPreview;
  index: number;
  onPress: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(risk.value, { duration: 420 + index * 90 });
  }, [index, progress, risk.value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.riskCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${risk.title} riski ${risk.level}`}
    >
      <Ionicons name={risk.icon} size={18} color={risk.color} />
      <Text style={styles.riskTitle} numberOfLines={1}>
        {risk.title}
      </Text>
      <Text style={styles.riskLevel} numberOfLines={1}>
        {risk.level}
      </Text>
      <View style={styles.riskTrack}>
        <Animated.View
          style={[styles.riskFill, { backgroundColor: risk.color }, fillStyle]}
        />
      </View>
    </Pressable>
  );
}

function AdvisorEceCard({ reducedMotion }: { reducedMotion: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={0}
      style={styles.cardWrap}
    >
      <View style={[styles.eceCard, shadows.soft]}>
        <LinearGradient
          colors={["#FFF1C9", "#FFFFFF"]}
          style={styles.eceAvatar}
        >
          <Text style={styles.eceInitial}>E</Text>
        </LinearGradient>
        <View style={styles.eceCopy}>
          <Text style={styles.eceName}>Ece</Text>
          <Text style={styles.eceText} numberOfLines={2}>
            Önce doğrula, sonra planla.
          </Text>
        </View>
        <Animated.View style={[styles.eceWave, waveStyle]}>
          <Ionicons name="radio-outline" size={17} color={eventDetail.teal} />
        </Animated.View>
      </View>
    </CreviaMotionView>
  );
}

function InspectActionGrid({
  completed,
  onPressAction,
}: {
  completed: boolean;
  onPressAction: (actionId: ActionId) => void;
}) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={5}
      style={styles.cardWrap}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>İnceleme Aksiyonları</Text>
      </View>
      <View style={styles.actionRow}>
        {ACTIONS.map((action) => (
          <InspectActionCard
            key={action.id}
            action={action}
            completed={completed && action.id !== "note"}
            onPress={() => onPressAction(action.id)}
          />
        ))}
      </View>
    </CreviaMotionView>
  );
}

function InspectActionCard({
  action,
  completed,
  onPress,
}: {
  action: InspectAction;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        shadows.soft,
        pressed && styles.actionPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={action.title}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={action.icon} size={24} color={eventDetail.tealDark} />
      </View>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {action.title}
      </Text>
      <View style={styles.actionArrow}>
        <Ionicons
          name={completed ? "checkmark" : "arrow-forward"}
          size={15}
          color="#FFFFFF"
        />
      </View>
    </Pressable>
  );
}

function StickyUnlockBar({
  cta,
  confirmedCount,
  totalCount,
  loading,
  onPress,
}: {
  cta: OperationPrimaryCta;
  confirmedCount: number;
  totalCount: number;
  loading: boolean;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const pct = Math.round((confirmedCount / totalCount) * 100);
  const ready = cta.actionKey === "go_to_plan";

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 360 });
  }, [pct, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View
      style={[
        styles.stickyWrap,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View style={styles.stickyShell}>
        <View style={styles.stickyProgressRow}>
          <Text style={styles.stickyProgressLabel}>
            {ready ? `${totalCount}/${totalCount} sinyal` : `${confirmedCount}/${totalCount} sinyal`}
          </Text>
          <Text style={styles.stickyProgressState}>
            {loading
              ? "Doğrulanıyor"
              : ready
                ? "Planlamaya hazır"
                : cta.disabledReason ?? "Eksik bilgi var"}
          </Text>
          <View style={styles.stickyTrack}>
            <Animated.View style={[styles.stickyFill, fillStyle]} />
          </View>
        </View>
        <Pressable
          onPress={onPress}
          disabled={!cta.enabled}
          style={({ pressed }) => [
            styles.primaryCta,
            ready && styles.primaryCtaReady,
            !cta.enabled && styles.primaryCtaDisabled,
            pressed && cta.enabled && styles.primaryCtaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={cta.label}
        >
          <Text style={[styles.primaryCtaText, ready && styles.primaryCtaTextReady]} numberOfLines={1}>
            {cta.label}
          </Text>
          <Ionicons
            name={ready ? "arrow-forward" : "checkmark-circle-outline"}
            size={18}
            color={ready ? eventDetail.tealDark : "#FFFFFF"}
          />
        </Pressable>
      </View>
    </View>
  );
}

function InspectModalHost({
  modal,
  noteText,
  setNoteText,
  onClose,
  onSignalConfirm,
  onIncidentInspect,
  onSaveNote,
  onGoPlan,
}: {
  modal: InspectModal;
  noteText: string;
  setNoteText: (value: string) => void;
  onClose: () => void;
  onSignalConfirm: (signalId: SignalId) => void;
  onIncidentInspect: () => void;
  onSaveNote: () => void;
  onGoPlan: () => void;
}) {
  const signal =
    modal?.type === "signal"
      ? SIGNALS.find((item) => item.id === modal.signalId)
      : null;
  const risk =
    modal?.type === "risk"
      ? RISKS.find((item) => item.id === modal.riskId)
      : null;

  return (
    <Modal
      transparent
      visible={modal != null}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={styles.modalSheet}>
          {modal?.type === "incident" ? (
            <IncidentPreviewModal
              onClose={onClose}
              onInspect={onIncidentInspect}
            />
          ) : null}
          {modal?.type === "signal" && signal ? (
            <SignalDetailModal
              signal={signal}
              onClose={onClose}
              onConfirm={() => onSignalConfirm(signal.id)}
            />
          ) : null}
          {modal?.type === "risk" && risk ? (
            <RiskDetailModal risk={risk} onClose={onClose} />
          ) : null}
          {modal?.type === "note" ? (
            <FieldNoteModal
              noteText={noteText}
              setNoteText={setNoteText}
              onClose={onClose}
              onSave={onSaveNote}
            />
          ) : null}
          {modal?.type === "unlocked" ? (
            <PlanUnlockedModal onClose={onClose} onGoPlan={onGoPlan} />
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function IncidentPreviewModal({
  onClose,
  onInspect,
}: {
  onClose: () => void;
  onInspect: () => void;
}) {
  return (
    <View style={styles.modalContent}>
      <ModalGrabber />
      <IncidentSceneArt reducedMotion={false} large />
      <Text style={styles.modalTitle}>Sahne Önizleme</Text>
      <Text style={styles.modalBody}>
        Aydınlatma sorunu park çevresinde yoğunlaşıyor.
      </Text>
      <ModalButton
        label="Sinyali incele"
        icon="scan-outline"
        onPress={onInspect}
      />
      <ModalGhostButton label="Kapat" onPress={onClose} />
    </View>
  );
}

function SignalDetailModal({
  signal,
  onClose,
  onConfirm,
}: {
  signal: SignalSource;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.modalContent}>
      <ModalGrabber />
      <View style={styles.modalIcon}>
        <Ionicons name={signal.icon} size={24} color={eventDetail.tealDark} />
      </View>
      <Text style={styles.modalTitle}>{signal.title}</Text>
      <Text style={styles.modalBody}>{signal.detail}</Text>
      <View style={styles.modalFindingList}>
        {signal.findings.map((finding) => (
          <View key={finding} style={styles.modalFindingRow}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={eventDetail.teal}
            />
            <Text style={styles.modalFindingText}>{finding}</Text>
          </View>
        ))}
      </View>
      <ModalButton
        label="Doğrula"
        icon="checkmark-done-outline"
        onPress={onConfirm}
      />
      <ModalGhostButton label="Kapat" onPress={onClose} />
    </View>
  );
}

function RiskDetailModal({
  risk,
  onClose,
}: {
  risk: RiskPreview;
  onClose: () => void;
}) {
  return (
    <View style={styles.modalContent}>
      <ModalGrabber />
      <View style={[styles.modalIcon, { backgroundColor: `${risk.color}22` }]}>
        <Ionicons name={risk.icon} size={24} color={risk.color} />
      </View>
      <Text style={styles.modalTitle}>{risk.title} riski</Text>
      <Text style={[styles.modalRiskLevel, { color: risk.color }]}>
        {risk.level}
      </Text>
      <Text style={styles.modalBody}>{risk.detail}</Text>
      <View style={styles.modalProgressTrack}>
        <View
          style={[
            styles.modalProgressFill,
            { width: `${risk.value}%`, backgroundColor: risk.color },
          ]}
        />
      </View>
      <ModalButton label="Tamam" icon="checkmark-outline" onPress={onClose} />
    </View>
  );
}

function FieldNoteModal({
  noteText,
  setNoteText,
  onClose,
  onSave,
}: {
  noteText: string;
  setNoteText: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.modalContent}>
      <ModalGrabber />
      <Text style={styles.modalTitle}>Saha Notu</Text>
      <Text style={styles.modalBody}>
        Bu not Planla aşamasında kullanılacak.
      </Text>
      <TextInput
        value={noteText}
        onChangeText={setNoteText}
        placeholder="Saha notu ekle..."
        placeholderTextColor="rgba(107,125,120,0.7)"
        multiline
        style={styles.noteInput}
        maxFontSizeMultiplier={1.15}
      />
      <ModalButton label="Notu Kaydet" icon="save-outline" onPress={onSave} />
      <ModalGhostButton label="Kapat" onPress={onClose} />
    </View>
  );
}

function PlanUnlockedModal({
  onClose,
  onGoPlan,
}: {
  onClose: () => void;
  onGoPlan: () => void;
}) {
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(0, { duration: 220 }),
    );
  }, [pop]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 1], [1, 1.18]) }],
  }));

  return (
    <View style={styles.modalContent}>
      <ModalGrabber />
      <Animated.View style={[styles.unlockedIcon, checkStyle]}>
        <Ionicons name="lock-open-outline" size={34} color="#FFFFFF" />
      </Animated.View>
      <Text style={styles.modalTitle}>Planla açıldı</Text>
      <Text style={styles.modalBody}>
        Sinyaller doğrulandı. Şimdi çözüm planını seçebilirsin.
      </Text>
      <ModalButton
        label="Planla'ya Geç"
        icon="arrow-forward"
        onPress={onGoPlan}
      />
      <ModalGhostButton label="Kapat" onPress={onClose} />
    </View>
  );
}

function ModalGrabber() {
  return <View style={styles.modalGrabber} />;
}

function ModalButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.modalButton,
        pressed && styles.modalButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
      <Text style={styles.modalButtonText}>{label}</Text>
    </Pressable>
  );
}

function ModalGhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.modalGhostButton}
      accessibilityRole="button"
    >
      <Text style={styles.modalGhostText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: eventDetail.bg,
  },
  scroll: {
    gap: 13,
    paddingTop: 4,
  },
  cardWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  inspectHeroCard: {
    minHeight: 340,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: eventDetail.tealDark,
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.10)",
  },
  inspectHeroVisual: {
    minHeight: 214,
    backgroundColor: "#DDF4E8",
  },
  inspectHeroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 112,
    bottom: 0,
  },
  inspectHeroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    gap: 9,
  },
  inspectHeroChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  inspectHeroChip: {
    maxWidth: 158,
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(14, 104, 98, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  inspectHeroChipGold: {
    maxWidth: 134,
    backgroundColor: "rgba(255, 241, 201, 0.94)",
    borderColor: "rgba(217,166,70,0.30)",
  },
  inspectHeroChipText: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  inspectHeroChipGoldText: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
    color: "#9E6E0D",
  },
  inspectHeroTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  inspectHeroTitleCompact: {
    fontSize: 19,
    lineHeight: 23,
  },
  inspectHeroSubtitle: {
    marginTop: -4,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
  },
  inspectHeroMetrics: {
    flexDirection: "row",
    gap: 8,
  },
  inspectHeroMetric: {
    flex: 1,
    minHeight: 58,
    minWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(19, 126, 120, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },
  inspectHeroMetricBlue: {
    backgroundColor: "rgba(38, 74, 113, 0.90)",
  },
  inspectHeroMetricIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  inspectHeroMetricCopy: {
    flex: 1,
    minWidth: 0,
  },
  inspectHeroMetricLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.76)",
  },
  inspectHeroMetricValue: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  inspectHeroRiskLine: {
    minHeight: 32,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  inspectHeroRiskText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.84)",
  },
  inspectHeroMarker: {
    position: "absolute",
    width: 32,
    height: 32,
    marginLeft: -16,
    marginTop: -16,
    alignItems: "center",
    justifyContent: "center",
  },
  inspectHeroMarkerPulse: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  inspectHeroMarkerCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  clarityBriefCard: {
    borderRadius: eventDetail.cardRadius,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 15,
    gap: 12,
  },
  clarityBriefTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clarityBriefIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#DDF4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  clarityBriefTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  clarityBriefTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  clarityBriefDistrict: {
    fontSize: 12,
    fontWeight: "700",
    color: eventDetail.textMuted,
  },
  clarityBriefMetrics: {
    flexDirection: "row",
    gap: 8,
  },
  clarityBriefMetric: {
    flex: 1,
    minWidth: 0,
    borderRadius: 13,
    backgroundColor: "rgba(11,107,97,0.06)",
    borderWidth: 1,
    borderColor: "rgba(11,107,97,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clarityMetricLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    color: eventDetail.textMuted,
  },
  clarityMetricValue: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    color: eventDetail.tealDark,
  },
  clarityRiskLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderRadius: 13,
    backgroundColor: "#FFF8E3",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  clarityRiskText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: eventDetail.textDark,
  },
  checklistCard: {
    borderRadius: eventDetail.cardRadius,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 13,
    gap: 10,
  },
  checklistList: {
    gap: 8,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#F8FBF6",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.07)",
    padding: 10,
  },
  checklistCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  checklistTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checklistTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    color: eventDetail.textDark,
  },
  checklistBody: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: eventDetail.textMuted,
  },
  checklistStatus: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  checklistStatusVerified: {
    backgroundColor: "rgba(11,107,97,0.10)",
    borderColor: "rgba(11,107,97,0.20)",
  },
  checklistStatusWaiting: {
    backgroundColor: "#FFF8E3",
    borderColor: "rgba(216,167,46,0.30)",
  },
  checklistStatusLocked: {
    backgroundColor: "rgba(107,125,120,0.08)",
    borderColor: "rgba(107,125,120,0.15)",
  },
  checklistStatusOptional: {
    backgroundColor: "rgba(216,167,46,0.08)",
    borderColor: "rgba(216,167,46,0.16)",
  },
  checklistStatusText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
    color: eventDetail.tealDark,
  },
  checklistImpactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  checklistImpact: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: "#B77713",
  },
  checklistInlineCta: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    color: eventDetail.tealDark,
  },
  planningImpactCard: {
    borderRadius: eventDetail.cardRadius,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 13,
    gap: 9,
  },
  impactLineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  impactDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: eventDetail.teal,
  },
  impactLineText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: eventDetail.textDark,
  },
  clarityEceCard: {
    minHeight: 72,
    borderRadius: eventDetail.cardRadius,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(216,167,46,0.22)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clarityEceAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FFF1C9",
    alignItems: "center",
    justifyContent: "center",
  },
  briefCard: {
    minHeight: 124,
    borderRadius: eventDetail.cardRadius,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventCrestOuter: {
    width: 61,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#F2C45F",
    alignItems: "center",
    justifyContent: "center",
  },
  eventCrest: {
    width: 53,
    height: 60,
    borderRadius: 19,
    backgroundColor: eventDetail.tealDark,
    alignItems: "center",
    justifyContent: "center",
  },
  briefTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  overline: {
    fontSize: 10,
    fontWeight: "900",
    color: "#B77713",
  },
  briefTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  briefTitleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  briefMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: eventDetail.textMuted,
  },
  briefBadges: {
    alignSelf: "stretch",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 7,
    maxWidth: 78,
  },
  priorityBadge: {
    maxWidth: 76,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: "#FFF1C9",
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9E6E0D",
  },
  timeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#DDF4E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  timeText: {
    fontSize: 10,
    fontWeight: "900",
    color: eventDetail.tealDark,
  },
  districtContext: {
    marginHorizontal: eventDetail.screenPadding,
    marginTop: -4,
    fontSize: 11,
    fontWeight: "700",
    color: eventDetail.textMuted,
  },
  sceneCard: {
    height: 204,
    borderRadius: eventDetail.cardRadius,
    overflow: "hidden",
    backgroundColor: eventDetail.tealDark,
  },
  sceneArt: {
    flex: 1,
    minHeight: 156,
  },
  sceneArtLarge: {
    height: 220,
    flex: 0,
    borderRadius: 20,
    overflow: "hidden",
  },
  signalRing: {
    position: "absolute",
    right: 54,
    top: 62,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "rgba(217,95,80,0.65)",
  },
  signalRingLarge: {
    right: 72,
    top: 84,
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  sceneFooter: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  sceneStatus: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    color: eventDetail.textDark,
  },
  sceneMapButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDF4E8",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: "900",
    color: eventDetail.teal,
  },
  signalRow: {
    flexDirection: "row",
    gap: 8,
  },
  revealFlowCard: {
    borderRadius: eventDetail.cardRadius,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 13,
    gap: 8,
  },
  revealFlowList: {
    gap: 8,
  },
  revealItem: {
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: "#F6F2EA",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  revealIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  revealCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  revealTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: eventDetail.textDark,
  },
  revealBody: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    color: eventDetail.textMuted,
  },
  revealChip: {
    maxWidth: 88,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#DDF4E8",
  },
  revealChipText: {
    fontSize: 9,
    fontWeight: "900",
    color: eventDetail.tealDark,
  },
  signalCard: {
    flex: 1,
    minHeight: 86,
    minWidth: 0,
    borderRadius: 17,
    backgroundColor: "#EAF7F1",
    borderWidth: 1,
    borderColor: "rgba(11,107,97,0.1)",
    padding: 10,
    justifyContent: "space-between",
  },
  signalIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  signalTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: eventDetail.textDark,
  },
  signalCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(11,107,97,0.18)",
  },
  signalCheckConfirmed: {
    backgroundColor: eventDetail.teal,
  },
  riskRow: {
    flexDirection: "row",
    gap: 8,
  },
  riskCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 104,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 10,
    gap: 6,
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: eventDetail.textDark,
  },
  riskLevel: {
    fontSize: 11,
    fontWeight: "800",
    color: eventDetail.textMuted,
  },
  riskTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#E4E5DD",
  },
  riskFill: {
    height: 6,
    borderRadius: 3,
  },
  eceCard: {
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eceAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F2C45F",
  },
  eceInitial: {
    fontSize: 18,
    fontWeight: "900",
    color: eventDetail.tealDark,
  },
  eceCopy: {
    flex: 1,
    minWidth: 0,
  },
  eceName: {
    fontSize: 14,
    fontWeight: "900",
    color: eventDetail.textDark,
  },
  eceText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    color: eventDetail.textMuted,
  },
  eceWave: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF7F1",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 122,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.08)",
    padding: 10,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF7F1",
  },
  actionTitle: {
    minHeight: 34,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    color: eventDetail.textDark,
  },
  actionArrow: {
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: eventDetail.tealDark,
  },
  actionPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  stickyWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: eventDetail.screenPadding,
    paddingTop: 10,
    backgroundColor: "rgba(245,243,234,0.94)",
    borderTopWidth: 1,
    borderTopColor: "rgba(6,63,59,0.08)",
  },
  stickyShell: {
    gap: 10,
  },
  stickyProgressRow: {
    gap: 6,
  },
  stickyProgressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: eventDetail.tealDark,
  },
  stickyProgressState: {
    fontSize: 11,
    fontWeight: "700",
    color: eventDetail.textMuted,
  },
  primaryCta: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: eventDetail.tealDark,
  },
  primaryCtaReady: {
    backgroundColor: "#E8C36A",
    borderWidth: 1,
    borderColor: "#C58B18",
  },
  primaryCtaDisabled: {
    opacity: 0.55,
  },
  primaryCtaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  primaryCtaTextReady: {
    color: eventDetail.tealDark,
  },
  stickyBar: {
    minHeight: 64,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stickySignalIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  stickyMiddle: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  stickyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stickyTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  stickyState: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DDF4E8",
  },
  stickyTrack: {
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(11, 107, 97, 0.1)",
  },
  stickyFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: eventDetail.teal,
  },
  stickyCta: {
    minWidth: 86,
    height: 42,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
  },
  stickyCtaPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  stickyCtaText: {
    fontSize: 12,
    fontWeight: "900",
    color: eventDetail.tealDark,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(7,29,28,0.42)",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  modalSheet: {
    borderRadius: 26,
    backgroundColor: "#FFFDF7",
    overflow: "hidden",
  },
  modalContent: {
    padding: 16,
    gap: 12,
  },
  modalGrabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(107,125,120,0.24)",
    marginBottom: 2,
  },
  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDF4E8",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: eventDetail.textDark,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: eventDetail.textMuted,
  },
  modalButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: eventDetail.tealDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  modalGhostButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalGhostText: {
    fontSize: 13,
    fontWeight: "800",
    color: eventDetail.textMuted,
  },
  modalFindingList: {
    gap: 8,
  },
  modalFindingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#F3F7EF",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalFindingText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: eventDetail.textDark,
  },
  modalRiskLevel: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: -8,
  },
  modalProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E4E5DD",
    overflow: "hidden",
  },
  modalProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  noteInput: {
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(6,63,59,0.12)",
    backgroundColor: "#FFFFFF",
    padding: 12,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: eventDetail.textDark,
    textAlignVertical: "top",
  },
  unlockedIcon: {
    alignSelf: "center",
    width: 74,
    height: 74,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: eventDetail.tealDark,
  },
});
