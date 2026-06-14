import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';

import { buildAuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockModel';
import {
  playLightImpactHaptic,
  playSelectionHaptic,
  playSuccessHaptic,
} from '@/core/feedback/hapticFeedback';
import { operationInspectScanConfig } from '@/core/motion/motionPresets';
import type { EventCard } from '@/core/models/EventCard';
import { getRiskLevelLabel } from '@/core/content/mockGameData';
import { OnboardingPhaseHint } from '@/features/onboarding/components/OnboardingPhaseHint';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  buildEventInspectPhasePresentation,
  type EventInspectInteractionState,
} from '@/features/events/utils/eventInspectPhasePresentation';
import { buildEventResultDistrictContextLine } from '@/features/events/utils/eventResultPresentation';
import { buildInspectHeroChips } from '@/features/events/utils/eventWorkflowPresentation';
import { useGameStore } from '@/store/useGameStore';
import { CreviaMotionView, useCreviaReducedMotion } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type EventInspectPhaseProps = {
  event: EventCard;
  bottomPadding: number;
  onOpenPlanning: () => void;
  phaseHint?: string | null;
  gameDay?: number;
  isDay1LearningEvent?: boolean;
};

type SignalId = 'field' | 'citizen' | 'social';
type RiskId = 'trust' | 'reaction' | 'resource';
type ActionId = 'inspect' | 'verify' | 'note';
type InspectModal =
  | { type: 'incident' }
  | { type: 'signal'; signalId: SignalId }
  | { type: 'risk'; riskId: RiskId }
  | { type: 'note' }
  | { type: 'unlocked' }
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
    id: 'field',
    title: 'Saha',
    icon: 'walk-outline',
    detail: 'Park çevresinde ışık seviyesi düşük.',
    findings: ['Aydınlatma direkleri zayıf.', 'Ekip gözlemi doğrulandı.', 'Akşam kullanımı azaldı.'],
  },
  {
    id: 'citizen',
    title: 'Vatandaş',
    icon: 'chatbubble-ellipses-outline',
    detail: 'Şikayetler park çevresinde yoğunlaşıyor.',
    findings: ['Son bildirimler aynı noktada.', 'Güven algısı düşüyor.', 'Aile kullanımı azaldı.'],
  },
  {
    id: 'social',
    title: 'Sosyal',
    icon: 'radio-outline',
    detail: 'Mahalle konuşmaları aynı sorunu işaret ediyor.',
    findings: ['Sosyal tepki yükseliyor.', 'Gece saatleri öne çıkıyor.', 'Duyarlılık orta seviyede.'],
  },
];

const RISKS: RiskPreview[] = [
  {
    id: 'trust',
    title: 'Güven',
    level: 'Yüksek',
    value: 88,
    color: '#D95F50',
    icon: 'shield-outline',
    detail: 'Akşam kullanımı düştüğü için güven algısı zayıflıyor.',
  },
  {
    id: 'reaction',
    title: 'Tepki',
    level: 'Orta',
    value: 62,
    color: '#D9A646',
    icon: 'alert-circle-outline',
    detail: 'Vatandaş tepkisi büyümeden kısa planlama gerekiyor.',
  },
  {
    id: 'resource',
    title: 'Kaynak',
    level: 'Düşük',
    value: 38,
    color: eventDetail.teal,
    icon: 'briefcase-outline',
    detail: 'Mevcut ekiplerle ilk müdahale hazırlanabilir.',
  },
];

const ACTIONS: InspectAction[] = [
  { id: 'inspect', title: 'Sinyali İncele', icon: 'scan-outline' },
  { id: 'verify', title: 'Doğrula', icon: 'checkmark-done-outline' },
  { id: 'note', title: 'Not Aç', icon: 'create-outline' },
];

function normalizeCategory(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('light') || lower.includes('aydın')) return 'Aydınlatma Sorunu';
  if (lower.includes('waste') || lower.includes('temizlik')) return 'Temizlik Baskısı';
  if (lower.includes('noise')) return 'Mahalle Gürültüsü';
  return category || 'Aydınlatma Sorunu';
}

function shortRemainingLabel(label: string): string {
  return label.replace(' kaldı', '').replace('Öncelik: ', '');
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
  const [interactionState, setInteractionState] = useState<EventInspectInteractionState>(() =>
    hasRevealedRef.current ? 'revealed' : 'idle',
  );
  const [confirmedSignals, setConfirmedSignals] = useState<SignalId[]>([]);
  const [activeModal, setActiveModal] = useState<InspectModal>(null);
  const [noteText, setNoteText] = useState('');

  const heroChips = useMemo(() => buildInspectHeroChips(event), [event]);
  const categoryLabel = useMemo(() => normalizeCategory(event.category), [event.category]);
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
  const planUnlocked = interactionState === 'revealed' || confirmedCount >= SIGNALS.length;

  const revealInspection = useCallback(() => {
    hasRevealedRef.current = true;
    setInteractionState('revealed');
  }, []);

  const confirmSignal = useCallback(
    (signalId: SignalId) => {
      setConfirmedSignals((current) => {
        if (current.includes(signalId)) return current;
        const next = [...current, signalId];
        if (next.length >= SIGNALS.length) {
          revealInspection();
          playSuccessHaptic();
          setActiveModal({ type: 'unlocked' });
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
    setActiveModal({ type: 'unlocked' });
  }, [revealInspection]);

  useEffect(() => {
    if (interactionState !== 'analyzing') return;

    const durationMs = reducedMotion ? 0 : scanConfig.durationMs;
    const timer = setTimeout(() => {
      revealInspection();
      setConfirmedSignals(SIGNALS.map((signal) => signal.id));
      setActiveModal({ type: 'unlocked' });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [interactionState, reducedMotion, revealInspection, scanConfig.durationMs]);

  const handleActionPress = useCallback(
    (actionId: ActionId) => {
      playLightImpactHaptic();
      if (actionId === 'note') {
        setActiveModal({ type: 'note' });
        return;
      }
      if (actionId === 'verify') {
        confirmAllSignals();
        return;
      }
      if (interactionState === 'idle') {
        setInteractionState('analyzing');
      } else {
        setActiveModal({ type: 'incident' });
      }
    },
    [confirmAllSignals, interactionState],
  );

  const handleStickyPress = useCallback(() => {
    playLightImpactHaptic();
    if (planUnlocked) {
      onOpenPlanning();
      return;
    }
    if (interactionState === 'idle') {
      setInteractionState('analyzing');
    }
  }, [interactionState, onOpenPlanning, planUnlocked]);

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.root}
      accessibilityLabel={presentation.accessibilityLabel}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(bottomPadding, 118 + Math.max(insets.bottom, 12)),
          },
        ]}>
        <InspectHeader compact={compact} />
        <EventBriefCard
          event={event}
          categoryLabel={categoryLabel}
          priorityLabel={getRiskLevelLabel(event.riskLevel)}
          remainingLabel={shortRemainingLabel(heroChips.remaining)}
          compact={compact}
        />
        {districtContextLine ? (
          <Text style={styles.districtContext} numberOfLines={1}>
            {districtContextLine}
          </Text>
        ) : null}
        <MiniIncidentSceneCard
          reducedMotion={reducedMotion}
          onOpen={() => setActiveModal({ type: 'incident' })}
        />
        <SignalSourceRow
          confirmedSignals={confirmedSignals}
          onPressSignal={(signalId) => setActiveModal({ type: 'signal', signalId })}
          reducedMotion={reducedMotion}
        />
        <RiskPreviewRow
          onPressRisk={(riskId) => setActiveModal({ type: 'risk', riskId })}
        />
        <AdvisorEceCard reducedMotion={reducedMotion} />
        {phaseHint ? <OnboardingPhaseHint text={phaseHint} /> : null}
        <InspectActionGrid
          completed={planUnlocked}
          onPressAction={handleActionPress}
        />
      </ScrollView>

      <StickyUnlockBar
        confirmedCount={planUnlocked ? SIGNALS.length : confirmedCount}
        totalCount={SIGNALS.length}
        unlocked={planUnlocked}
        loading={interactionState === 'analyzing'}
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
          if (interactionState === 'idle') setInteractionState('analyzing');
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

function InspectHeader({ compact }: { compact: boolean }) {
  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={0} style={styles.header}>
      <View style={styles.headerIconButton}>
        <Ionicons name="chevron-back" size={21} color={eventDetail.tealDark} />
      </View>
      <View style={styles.headerTitleBlock}>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>İncele</Text>
        <View style={styles.headerAccent}>
          <View style={styles.headerAccentLine} />
          <Ionicons name="sparkles" size={10} color="#C58B18" />
          <View style={styles.headerAccentLine} />
        </View>
      </View>
      <View style={styles.resourceBadges}>
        <View style={[styles.resourceBadge, styles.resourceBadgeMint]}>
          <Ionicons name="diamond-outline" size={13} color={eventDetail.teal} />
          <Text style={styles.resourceText}>1.250</Text>
        </View>
        <View style={[styles.resourceBadge, styles.resourceBadgeGold]}>
          <Ionicons name="medal-outline" size={13} color="#B77713" />
          <Text style={[styles.resourceText, styles.resourceTextGold]}>860</Text>
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
    pop.value = withSequence(withTiming(1, { duration: 280 }), withTiming(0, { duration: 260 }));
  }, [pop]);

  const crestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 1], [1, 1.07]) }],
  }));

  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={1} style={styles.cardWrap}>
      <View style={[styles.briefCard, shadows.soft]}>
        <Animated.View style={[styles.eventCrestOuter, crestStyle]}>
          <View style={styles.eventCrest}>
            <Ionicons name="bulb-outline" size={27} color="#F5C76A" />
          </View>
        </Animated.View>
        <View style={styles.briefTextBlock}>
          <Text style={styles.overline}>Olay Brifingi</Text>
          <Text style={[styles.briefTitle, compact && styles.briefTitleCompact]} numberOfLines={2}>
            {event.title || 'Mahalle Güveni Düşüyor'}
          </Text>
          <Text style={styles.briefMeta} numberOfLines={1}>
            {event.district || 'Çınar Mahallesi'}
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
            <Ionicons name="time-outline" size={12} color={eventDetail.tealDark} />
            <Text style={styles.timeText} numberOfLines={1}>
              {remainingLabel || '02:45'}
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
    <CreviaMotionView motionKind="card_enter" surface="shared" index={2} style={styles.cardWrap}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.sceneCard, shadows.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel="Mini olay sahnesini önizle">
        <IncidentSceneArt reducedMotion={reducedMotion} large={false} />
        <View style={styles.sceneFooter}>
          <Text style={styles.sceneStatus} numberOfLines={2}>
            Park aydınlatmaları çalışmıyor.
          </Text>
          <View style={styles.sceneMapButton}>
            <Ionicons name="map-outline" size={16} color={eventDetail.tealDark} />
          </View>
        </View>
      </Pressable>
    </CreviaMotionView>
  );
}

function IncidentSceneArt({ reducedMotion, large }: { reducedMotion: boolean; large: boolean }) {
  const zoom = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    zoom.value = withTiming(1, { duration: reducedMotion ? 0 : 800 });
    if (!reducedMotion) {
      pulse.value = withRepeat(
        withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 1200 })),
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
    <Animated.View style={[styles.sceneArt, large && styles.sceneArtLarge, sceneStyle]}>
      <LinearGradient
        colors={['#244F58', '#123E43', '#F2B66A']}
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
          <Rect key={x} x={x} y={x < 200 ? 68 : 72} width="8" height="8" rx="2" fill="#FFD98A" opacity="0.82" />
        ))}
        <Path d="M58 132 C112 116 180 132 258 112" stroke="#365B55" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.72" />
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
            <Rect x={x} y={80 + i * 5} width="4" height="45" rx="2" fill="#263C3A" />
            <Circle cx={x + 2} cy={80 + i * 5} r="9" fill="#FFD98A" opacity={i === 0 ? 0.28 : 0.5} />
            <Circle cx={x + 2} cy={80 + i * 5} r="4" fill={i === 0 ? '#7F7560' : '#FFE6A7'} />
          </G>
        ))}
        <Rect x="166" y="120" width="25" height="13" rx="5" fill="#0B6B61" />
        <Circle cx="173" cy="134" r="3" fill="#1E302F" />
        <Circle cx="186" cy="134" r="3" fill="#1E302F" />
        <Path d="M166 139 C148 143 132 142 115 147" stroke="#EAD7B3" strokeWidth="2" strokeDasharray="5 4" fill="none" opacity="0.7" />
        <Rect x="0" y="112" width="330" height="58" fill="url(#fog)" />
      </Svg>
      <Animated.View style={[styles.signalRing, large && styles.signalRingLarge, alertStyle]} />
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
    <CreviaMotionView motionKind="card_enter" surface="shared" index={3} style={styles.cardWrap}>
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
      style={({ pressed }) => [styles.signalCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${signal.title} sinyal kaynağı`}>
      <View style={styles.signalIcon}>
        <Ionicons name={signal.icon} size={18} color={eventDetail.tealDark} />
      </View>
      <Text style={styles.signalTitle} numberOfLines={1}>
        {signal.title}
      </Text>
      <Animated.View style={[styles.signalCheck, confirmed && styles.signalCheckConfirmed, checkStyle]}>
        <Ionicons name="checkmark" size={11} color={confirmed ? '#FFFFFF' : eventDetail.teal} />
      </Animated.View>
    </Pressable>
  );
}

function RiskPreviewRow({ onPressRisk }: { onPressRisk: (riskId: RiskId) => void }) {
  return (
    <CreviaMotionView motionKind="card_enter" surface="shared" index={4} style={styles.cardWrap}>
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
      accessibilityLabel={`${risk.title} riski ${risk.level}`}>
      <Ionicons name={risk.icon} size={18} color={risk.color} />
      <Text style={styles.riskTitle} numberOfLines={1}>
        {risk.title}
      </Text>
      <Text style={styles.riskLevel} numberOfLines={1}>
        {risk.level}
      </Text>
      <View style={styles.riskTrack}>
        <Animated.View style={[styles.riskFill, { backgroundColor: risk.color }, fillStyle]} />
      </View>
    </Pressable>
  );
}

function AdvisorEceCard({ reducedMotion }: { reducedMotion: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 1200 })),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  return (
    <CreviaMotionView motionKind="line_appear" surface="shared" index={0} style={styles.cardWrap}>
      <View style={[styles.eceCard, shadows.soft]}>
        <LinearGradient colors={['#FFF1C9', '#FFFFFF']} style={styles.eceAvatar}>
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
    <CreviaMotionView motionKind="card_enter" surface="shared" index={5} style={styles.cardWrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>İnceleme Aksiyonları</Text>
      </View>
      <View style={styles.actionRow}>
        {ACTIONS.map((action) => (
          <InspectActionCard
            key={action.id}
            action={action}
            completed={completed && action.id !== 'note'}
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
      style={({ pressed }) => [styles.actionCard, shadows.soft, pressed && styles.actionPressed]}
      accessibilityRole="button"
      accessibilityLabel={action.title}>
      <View style={styles.actionIcon}>
        <Ionicons name={action.icon} size={24} color={eventDetail.tealDark} />
      </View>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {action.title}
      </Text>
      <View style={styles.actionArrow}>
        <Ionicons name={completed ? 'checkmark' : 'arrow-forward'} size={15} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

function StickyUnlockBar({
  confirmedCount,
  totalCount,
  unlocked,
  loading,
  onPress,
}: {
  confirmedCount: number;
  totalCount: number;
  unlocked: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const pct = Math.round((confirmedCount / totalCount) * 100);

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 360 });
  }, [pct, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={[styles.stickyWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <LinearGradient
        colors={unlocked ? [eventDetail.tealDark, eventDetail.teal] : ['#174B48', '#0B6B61']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.stickyBar}>
        <View style={styles.stickySignalIcon}>
          <Ionicons name={unlocked ? 'lock-open-outline' : 'radio-outline'} size={19} color="#FFFFFF" />
        </View>
        <View style={styles.stickyMiddle}>
          <View style={styles.stickyTitleRow}>
            <Text style={styles.stickyTitle}>{unlocked ? '3/3 sinyal' : `${confirmedCount}/3 sinyal`}</Text>
            <Text style={styles.stickyState}>{loading ? 'Taranıyor' : unlocked ? 'Planla açıldı' : 'Planla açılıyor'}</Text>
          </View>
          <View style={styles.stickyTrack}>
            <Animated.View style={[styles.stickyFill, fillStyle]} />
          </View>
        </View>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.stickyCta, pressed && styles.stickyCtaPressed]}
          accessibilityRole="button"
          accessibilityLabel={unlocked ? "Planla'ya geç" : 'İncelemeyi başlat'}>
          <Ionicons name={unlocked ? 'arrow-forward' : 'lock-closed-outline'} size={16} color={eventDetail.tealDark} />
          <Text style={styles.stickyCtaText} numberOfLines={1}>
            {unlocked ? 'Planla' : 'Açılıyor'}
          </Text>
        </Pressable>
      </LinearGradient>
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
  const signal = modal?.type === 'signal' ? SIGNALS.find((item) => item.id === modal.signalId) : null;
  const risk = modal?.type === 'risk' ? RISKS.find((item) => item.id === modal.riskId) : null;

  return (
    <Modal transparent visible={modal != null} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={styles.modalSheet}>
          {modal?.type === 'incident' ? (
            <IncidentPreviewModal onClose={onClose} onInspect={onIncidentInspect} />
          ) : null}
          {modal?.type === 'signal' && signal ? (
            <SignalDetailModal
              signal={signal}
              onClose={onClose}
              onConfirm={() => onSignalConfirm(signal.id)}
            />
          ) : null}
          {modal?.type === 'risk' && risk ? (
            <RiskDetailModal risk={risk} onClose={onClose} />
          ) : null}
          {modal?.type === 'note' ? (
            <FieldNoteModal
              noteText={noteText}
              setNoteText={setNoteText}
              onClose={onClose}
              onSave={onSaveNote}
            />
          ) : null}
          {modal?.type === 'unlocked' ? (
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
      <ModalButton label="Sinyali incele" icon="scan-outline" onPress={onInspect} />
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
            <Ionicons name="checkmark-circle" size={15} color={eventDetail.teal} />
            <Text style={styles.modalFindingText}>{finding}</Text>
          </View>
        ))}
      </View>
      <ModalButton label="Doğrula" icon="checkmark-done-outline" onPress={onConfirm} />
      <ModalGhostButton label="Kapat" onPress={onClose} />
    </View>
  );
}

function RiskDetailModal({ risk, onClose }: { risk: RiskPreview; onClose: () => void }) {
  return (
    <View style={styles.modalContent}>
      <ModalGrabber />
      <View style={[styles.modalIcon, { backgroundColor: `${risk.color}22` }]}>
        <Ionicons name={risk.icon} size={24} color={risk.color} />
      </View>
      <Text style={styles.modalTitle}>{risk.title} riski</Text>
      <Text style={[styles.modalRiskLevel, { color: risk.color }]}>{risk.level}</Text>
      <Text style={styles.modalBody}>{risk.detail}</Text>
      <View style={styles.modalProgressTrack}>
        <View style={[styles.modalProgressFill, { width: `${risk.value}%`, backgroundColor: risk.color }]} />
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
      <Text style={styles.modalBody}>Bu not Planla aşamasında kullanılacak.</Text>
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
    pop.value = withSequence(withTiming(1, { duration: 220 }), withTiming(0, { duration: 220 }));
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
      <ModalButton label="Planla'ya Geç" icon="arrow-forward" onPress={onGoPlan} />
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
      style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color="#FFFFFF" />
      <Text style={styles.modalButtonText}>{label}</Text>
    </Pressable>
  );
}

function ModalGhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.modalGhostButton} accessibilityRole="button">
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
  header: {
    minHeight: 52,
    paddingHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  headerTitleCompact: {
    fontSize: 22,
  },
  headerAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerAccentLine: {
    width: 26,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D9A646',
  },
  resourceBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  resourceBadge: {
    height: 30,
    minWidth: 38,
    borderRadius: 15,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  resourceBadgeMint: {
    backgroundColor: '#DDF4E8',
  },
  resourceBadgeGold: {
    backgroundColor: '#FFF1C9',
  },
  resourceText: {
    fontSize: 11,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  resourceTextGold: {
    color: '#9E6E0D',
  },
  briefCard: {
    minHeight: 124,
    borderRadius: eventDetail.cardRadius,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventCrestOuter: {
    width: 61,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#F2C45F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCrest: {
    width: 53,
    height: 60,
    borderRadius: 19,
    backgroundColor: eventDetail.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  overline: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B77713',
  },
  briefTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  briefTitleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  briefMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  briefBadges: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 7,
    maxWidth: 78,
  },
  priorityBadge: {
    maxWidth: 76,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#FFF1C9',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9E6E0D',
  },
  timeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#DDF4E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  districtContext: {
    marginHorizontal: eventDetail.screenPadding,
    marginTop: -4,
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  sceneCard: {
    height: 204,
    borderRadius: eventDetail.cardRadius,
    overflow: 'hidden',
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
    overflow: 'hidden',
  },
  signalRing: {
    position: 'absolute',
    right: 54,
    top: 62,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(217,95,80,0.65)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  sceneStatus: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  sceneMapButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4E8',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.teal,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signalCard: {
    flex: 1,
    minHeight: 86,
    minWidth: 0,
    borderRadius: 17,
    backgroundColor: '#EAF7F1',
    borderWidth: 1,
    borderColor: 'rgba(11,107,97,0.1)',
    padding: 10,
    justifyContent: 'space-between',
  },
  signalIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  signalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  signalCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(11,107,97,0.18)',
  },
  signalCheckConfirmed: {
    backgroundColor: eventDetail.teal,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 8,
  },
  riskCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 104,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 10,
    gap: 6,
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  riskLevel: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  riskTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E4E5DD',
  },
  riskFill: {
    height: 6,
    borderRadius: 3,
  },
  eceCard: {
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eceAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F2C45F',
  },
  eceInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  eceCopy: {
    flex: 1,
    minWidth: 0,
  },
  eceName: {
    fontSize: 14,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  eceText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  eceWave: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7F1',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 122,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
    padding: 10,
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7F1',
  },
  actionTitle: {
    minHeight: 34,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  actionArrow: {
    alignSelf: 'flex-end',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: eventDetail.screenPadding,
    paddingTop: 10,
    backgroundColor: 'rgba(245,243,234,0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6,63,59,0.08)',
  },
  stickyBar: {
    minHeight: 64,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickySignalIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  stickyMiddle: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  stickyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stickyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stickyState: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DDF4E8',
  },
  stickyTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  stickyFill: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#B9F2DB',
  },
  stickyCta: {
    minWidth: 86,
    height: 42,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  stickyCtaPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  stickyCtaText: {
    fontSize: 12,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(7,29,28,0.42)',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  modalSheet: {
    borderRadius: 26,
    backgroundColor: '#FFFDF7',
    overflow: 'hidden',
  },
  modalContent: {
    padding: 16,
    gap: 12,
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(107,125,120,0.24)',
    marginBottom: 2,
  },
  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF4E8',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  modalButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: eventDetail.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalGhostButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGhostText: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  modalFindingList: {
    gap: 8,
  },
  modalFindingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#F3F7EF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalFindingText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.textDark,
  },
  modalRiskLevel: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: -8,
  },
  modalProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E4E5DD',
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  noteInput: {
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.12)',
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: eventDetail.textDark,
    textAlignVertical: 'top',
  },
  unlockedIcon: {
    alignSelf: 'center',
    width: 74,
    height: 74,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eventDetail.tealDark,
  },
});
