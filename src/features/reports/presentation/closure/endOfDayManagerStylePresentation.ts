import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import {
  buildPrimaryDominantStrategyCard,
  buildReportDominantStrategyNote,
} from '@/core/dominantStrategyDetector';
import {
  buildPlayerStyleEvidenceChips,
  buildPlayerStyleEceHint,
  buildPlayerStyleFromStrategyContext,
} from '@/core/playerStyle';
import { PLAYER_STYLE_DEFINITIONS } from '@/core/playerStyle/playerStyleRules';
import type { PlayerStyleId, PlayerStyleProfile } from '@/core/playerStyle/playerStyleTypes';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

export type ManagerStyleSignalTone = 'positive' | 'warning' | 'neutral';

export type EndOfDayManagerStyleSurface = {
  visible: boolean;
  status: 'no_history' | 'early_signal' | 'detected_style' | 'dominant_warning';
  styleLabel: string;
  styleTone: 'balanced' | 'risk' | 'resource' | 'public' | 'crisis' | 'recovery';
  headline: string;
  summary: string;
  behaviorSignals: Array<{
    id: string;
    label: string;
    value: string;
    tone: ManagerStyleSignalTone;
  }>;
  impactChips: Array<{
    id: string;
    label: string;
    value: string;
    tone: ManagerStyleSignalTone;
  }>;
  advisorLine: string;
  ctaLabel?: string;
  positiveReinforcement?: string;
  recoveryNote?: string;
  dominantWarning?: {
    title: string;
    message: string;
  };
};

export type BuildEndOfDayManagerStyleInput = {
  day: number;
  metrics: GameMetrics;
  decisionsToday: DecisionRecord[];
  criticalDecision?: DecisionRecord | null;
  decisionHistory?: Array<{
    day: number;
    decisionLabel: string;
    eventTitle: string;
  }>;
  strategyHistory?: StrategyHistoryStateV1 | null;
  dominantStrategy?: DominantStrategyDetectorResult | null;
  dominantStrategyNote?: string | null;
  managementStyleLine?: string | null;
  districtNeglectRecoveryNote?: string | null;
  positiveComebackNote?: string | null;
  tomorrowFocusLine?: string | null;
  socialPulseScore?: number;
  showStyleDetailCta?: boolean;
  avoidLines?: string[];
};

const STYLE_TONE_MAP: Record<PlayerStyleId, EndOfDayManagerStyleSurface['styleTone']> = {
  fast_responder: 'crisis',
  preventive_planner: 'recovery',
  public_focused: 'public',
  resource_guardian: 'resource',
  crisis_watcher: 'risk',
  balanced_operator: 'balanced',
  route_focused: 'balanced',
  district_loyalist: 'public',
  inconsistent_operator: 'balanced',
  unknown: 'balanced',
};

const EARLY_SIGNAL_LABEL = 'Erken Yönetim Sinyali';
const FORMING_LABEL = 'Tarz oluşuyor';

function clamp(text: string, max = 140): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function sumEffect(
  decisions: DecisionRecord[],
  key: 'publicSatisfaction' | 'trust' | 'budget' | 'staffMorale' | 'risk',
): number {
  return decisions.reduce((sum, record) => {
    const value = record.appliedEffects[key];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function formatBudget(value: number): string {
  if (Math.abs(value) >= 1000) {
    const rounded = Math.round(value / 100) / 10;
    return `${rounded > 0 ? '+' : ''}${rounded}K`;
  }
  return formatSigned(value);
}

function mapEvidenceTone(
  tone: 'positive' | 'mixed' | 'warning' | 'neutral',
): ManagerStyleSignalTone {
  if (tone === 'positive') return 'positive';
  if (tone === 'warning' || tone === 'mixed') return 'warning';
  return 'neutral';
}

function buildImpactChips(decisions: DecisionRecord[], socialPulseScore?: number): EndOfDayManagerStyleSurface['impactChips'] {
  const chips: EndOfDayManagerStyleSurface['impactChips'] = [];
  const trust = sumEffect(decisions, 'publicSatisfaction') + sumEffect(decisions, 'trust');
  const risk = sumEffect(decisions, 'risk');
  const budget = sumEffect(decisions, 'budget');
  const morale = sumEffect(decisions, 'staffMorale');

  if (trust !== 0) {
    chips.push({
      id: 'trust',
      label: 'Güven',
      value: formatSigned(trust),
      tone: trust > 0 ? 'positive' : 'warning',
    });
  }
  if (risk !== 0) {
    chips.push({
      id: 'risk',
      label: 'Risk',
      value: formatSigned(risk),
      tone: risk < 0 ? 'positive' : 'warning',
    });
  }
  if (budget !== 0) {
    chips.push({
      id: 'budget',
      label: 'Kaynak',
      value: formatBudget(budget),
      tone: budget > 0 ? 'positive' : 'warning',
    });
  }
  if (morale !== 0) {
    chips.push({
      id: 'morale',
      label: 'Ekip',
      value: formatSigned(morale),
      tone: morale > 0 ? 'positive' : 'warning',
    });
  }
  if (socialPulseScore != null && chips.length < 4) {
    const socialTone: ManagerStyleSignalTone =
      socialPulseScore >= 58 ? 'positive' : socialPulseScore < 45 ? 'warning' : 'neutral';
    chips.push({
      id: 'social',
      label: 'Sosyal nabız',
      value: socialPulseScore >= 58 ? 'Sakin' : socialPulseScore < 45 ? 'Baskılı' : 'Dengeli',
      tone: socialTone,
    });
  }

  return chips.slice(0, 5);
}

function buildEarlyBehaviorSignals(
  profile: PlayerStyleProfile,
  decisionsToday: DecisionRecord[],
): EndOfDayManagerStyleSurface['behaviorSignals'] {
  const chips = buildPlayerStyleEvidenceChips(profile);
  if (chips.length >= 2) {
    return chips.slice(0, 3).map((chip, index) => ({
      id: `signal-${index}`,
      label: chip.label,
      value: chip.value,
      tone: mapEvidenceTone(chip.tone),
    }));
  }

  const signals: EndOfDayManagerStyleSurface['behaviorSignals'] = [];
  const labels = decisionsToday.map((d) => d.decisionLabel.toLowerCase()).join(' ');
  if (labels.includes('hızlı') || labels.includes('acil')) {
    signals.push({ id: 'fast', label: 'Müdahale hızı', value: 'Yüksek', tone: 'warning' });
  }
  if (labels.includes('plan') || labels.includes('önley')) {
    signals.push({ id: 'plan', label: 'Planlama', value: 'Güçlü', tone: 'positive' });
  }
  if (labels.includes('iletişim') || labels.includes('sosyal')) {
    signals.push({ id: 'social', label: 'Halk etkisi', value: 'Pozitif', tone: 'positive' });
  }
  if (signals.length === 0 && profile.tags[0]) {
    signals.push({ id: 'tag', label: 'Eğilim', value: profile.tags[0], tone: 'neutral' });
  }
  if (signals.length === 0) {
    signals.push({ id: 'forming', label: 'Sinyal', value: 'Oluşuyor', tone: 'neutral' });
  }
  return signals.slice(0, 3);
}

function buildEarlySummary(profile: PlayerStyleProfile, decisionsToday: DecisionRecord[]): string {
  const def = PLAYER_STYLE_DEFINITIONS[profile.styleId];
  if (profile.styleId !== 'unknown' && profile.confidence !== 'none') {
    return clamp(def.currentSignal);
  }
  const labels = decisionsToday.map((d) => d.decisionLabel.toLowerCase()).join(' ');
  if (labels.includes('hızlı') || labels.includes('acil')) {
    return 'Bugünkü kararların hızlı müdahale eğilimi gösteriyor.';
  }
  if (labels.includes('plan') || labels.includes('önley')) {
    return 'Bugünkü kararların önleyici plan eğilimi gösteriyor.';
  }
  if (decisionsToday.length > 0) {
    return 'İlk yönetim sinyallerin oluşuyor; birkaç gün içinde tarzın netleşecek.';
  }
  return 'Bugünkü karar verisi henüz yeterli değil.';
}

function buildDetectedSummary(profile: PlayerStyleProfile, managementStyleLine?: string | null): string {
  if (managementStyleLine && managementStyleLine.length > 48) {
    return clamp(managementStyleLine.split('.')[0] ?? managementStyleLine, 120);
  }
  const def = PLAYER_STYLE_DEFINITIONS[profile.styleId];
  return clamp(`${def.summary} ${def.currentSignal}`.trim(), 120);
}

function buildPositiveReinforcement(
  input: BuildEndOfDayManagerStyleInput,
  profile: PlayerStyleProfile,
): string | undefined {
  if (input.positiveComebackNote) {
    return clamp(input.positiveComebackNote, 110);
  }
  const decision = input.criticalDecision ?? input.decisionsToday[input.decisionsToday.length - 1];
  if (!decision) return undefined;

  const trust = sumEffect([decision], 'publicSatisfaction') + sumEffect([decision], 'trust');
  const risk = sumEffect([decision], 'risk');
  const district = decision.neighborhoodName ?? 'Mahalle';

  if (trust >= 3 && risk <= 0) {
    return clamp(
      `Doğru anda müdahale ettin. ${district}'te kriz büyümeden kontrol altına alındı.`,
      110,
    );
  }
  if (profile.styleId === 'balanced_operator' && trust >= 0 && risk <= 0) {
    return 'Dengeli oynadın; risk büyümeden şehir nabzı korundu.';
  }
  return undefined;
}

function resolveAdvisorLine(
  profile: PlayerStyleProfile,
  input: BuildEndOfDayManagerStyleInput,
  avoid: string[],
): string {
  const styleHint = buildPlayerStyleEceHint(profile, avoid);
  if (styleHint) return styleHint;

  if (input.tomorrowFocusLine && !lineDuplicatesAvoidLines(input.tomorrowFocusLine, avoid)) {
    return clamp(`Yarın: ${input.tomorrowFocusLine}`, 120);
  }

  const dominantNote = buildReportDominantStrategyNote(input.dominantStrategy, avoid);
  if (dominantNote) return clamp(dominantNote, 120);

  return clamp(PLAYER_STYLE_DEFINITIONS[profile.styleId]?.advisorLine ?? profile.advisorLine, 120);
}

function resolveDominantWarning(
  dominant: DominantStrategyDetectorResult | null | undefined,
  avoid: string[],
): EndOfDayManagerStyleSurface['dominantWarning'] | undefined {
  const card = buildPrimaryDominantStrategyCard(dominant);
  if (!card || !dominant?.isVisible || dominant.pattern === 'none') return undefined;
  const message = dominant.counterSignalLine ?? card.line;
  if (lineDuplicatesAvoidLines(message, avoid)) return undefined;
  return {
    title: card.title,
    message: clamp(message, 120),
  };
}

export function buildEndOfDayManagerStyleSurface(
  input: BuildEndOfDayManagerStyleInput,
): EndOfDayManagerStyleSurface {
  const avoid = input.avoidLines ?? [];
  const hasHistory =
    input.decisionsToday.length > 0 ||
    (input.strategyHistory?.decisionHistory?.length ?? 0) > 0 ||
    (input.decisionHistory?.length ?? 0) > 0;

  const profile = buildPlayerStyleFromStrategyContext({
    day: input.day,
    surface: 'report',
    decisionHistory: input.decisionHistory ?? [],
    strategyHistory: input.strategyHistory ?? undefined,
    dominantStrategy: input.dominantStrategy,
  });

  const dominantWarning = resolveDominantWarning(input.dominantStrategy, avoid);
  const impactChips = buildImpactChips(input.decisionsToday, input.socialPulseScore);
  const positiveReinforcement = buildPositiveReinforcement(input, profile);
  const recoveryNote = input.districtNeglectRecoveryNote
    ? clamp(input.districtNeglectRecoveryNote, 110)
    : undefined;

  if (!hasHistory) {
    return {
      visible: true,
      status: 'no_history',
      styleLabel: FORMING_LABEL,
      styleTone: 'balanced',
      headline: 'Bugünkü Yönetim Tarzın',
      summary: 'Bugünkü karar verisi henüz yeterli değil.',
      behaviorSignals: [],
      impactChips,
      advisorLine: 'Yarın ilk kararların tarzını daha net gösterecek.',
      ctaLabel: undefined,
      positiveReinforcement,
      recoveryNote,
      dominantWarning,
    };
  }

  const isEarly = input.day < 8;
  const isBalanced = profile.styleId === 'balanced_operator' && profile.confidence !== 'none';
  const hasDominantPattern =
    Boolean(dominantWarning) && input.day >= 4 && !isEarly;

  let status: EndOfDayManagerStyleSurface['status'] = 'detected_style';
  if (isEarly) {
    status = 'early_signal';
  } else if (hasDominantPattern) {
    status = 'dominant_warning';
  }

  const def = PLAYER_STYLE_DEFINITIONS[profile.styleId];
  const styleLabel = isEarly
    ? profile.confidence === 'none' || profile.styleId === 'unknown'
      ? EARLY_SIGNAL_LABEL
      : FORMING_LABEL
    : def.title;

  const summary = isEarly
    ? buildEarlySummary(profile, input.decisionsToday)
    : buildDetectedSummary(profile, input.managementStyleLine);

  const behaviorSignals = isEarly
    ? buildEarlyBehaviorSignals(profile, input.decisionsToday)
    : buildPlayerStyleEvidenceChips(profile)
        .slice(0, 3)
        .map((chip, index) => ({
          id: `signal-${index}`,
          label: chip.label,
          value: chip.value,
          tone: mapEvidenceTone(chip.tone),
        }));

  let advisorLine = resolveAdvisorLine(profile, input, avoid);
  if (recoveryNote && !lineDuplicatesAvoidLines(recoveryNote, [advisorLine, ...avoid])) {
    advisorLine = recoveryNote;
  } else if (
    isBalanced &&
    positiveReinforcement &&
    !lineDuplicatesAvoidLines(positiveReinforcement, [advisorLine, ...avoid])
  ) {
    advisorLine = positiveReinforcement;
  }

  const ctaLabel =
    input.showStyleDetailCta && input.day >= 8
      ? 'Tarz detayını gör'
      : input.day >= 3 && input.showStyleDetailCta
        ? 'Karar izini incele'
        : undefined;

  return {
    visible: true,
    status,
    styleLabel,
    styleTone: STYLE_TONE_MAP[profile.styleId] ?? 'balanced',
    headline: 'Bugünkü Yönetim Tarzın',
    summary,
    behaviorSignals,
    impactChips,
    advisorLine,
    ctaLabel,
    positiveReinforcement:
      isBalanced || status === 'detected_style' ? positiveReinforcement : undefined,
    recoveryNote,
    dominantWarning,
  };
}
