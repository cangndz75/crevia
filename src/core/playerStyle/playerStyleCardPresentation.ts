import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { DominantStrategyPattern } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';

import {
  buildPlayerStyleProfile,
  type EventResultLike,
} from './playerStylePresentation';
import { PLAYER_STYLE_DEFINITIONS } from './playerStyleRules';
import type {
  PlayerStyleConfidence,
  PlayerStyleEvidenceChip,
  PlayerStyleId,
  PlayerStyleInput,
  PlayerStyleObservation,
  PlayerStylePresentationCard,
  PlayerStyleProfile,
  PlayerStyleSurface,
} from './playerStyleTypes';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

export const PLAYER_STYLE_REPORT_LINE_MAX = 160;
export const PLAYER_STYLE_ECE_HINT_MAX = 120;
export const PLAYER_STYLE_HUB_LINE_MAX = 80;

const CONFIDENCE_LABELS: Record<PlayerStyleConfidence, string> = {
  none: 'Tarz oluşuyor',
  low: 'Tarz oluşuyor',
  medium: 'Netleşiyor',
  high: 'Güçlü eğilim',
};

const REPORT_LINES: Record<PlayerStyleId, string> = {
  fast_responder:
    'Krizci Yönetici çizgin bugün güveni hızlı toparladı. Yarın ekip temposu daha kritik olacak.',
  preventive_planner:
    'Önleyici hamleler yarınki baskıyı hafifletebilir. Bugünkü kaynak maliyetini not et.',
  public_focused:
    'Halk güvenine odaklandın. Yarın kaynak dengesini gözden kaçırma.',
  resource_guardian:
    'Kaynak koruma çizgin kapasiteyi dengede tuttu, ancak sosyal beklenti tamamen kapanmadı.',
  crisis_watcher:
    'Risk izleme çizgin sorunları büyütmeden tuttu. Görünür etkiyi de izlemeye devam et.',
  balanced_operator:
    'Dengeli kararların riski büyütmeden ilerledi. Etki daha kademeli oluştu.',
  route_focused:
    'Rota disiplinin saha akışını korudu. Sosyal nabız bazı mahallelerde birikebilir.',
  district_loyalist:
    'Mahalle odağın seçtiğin bölgede iz bıraktı. Diğer bölgelerde beklenti birikebilir.',
  inconsistent_operator:
    'Uyumlu çizgin farklı baskılara esnek yanıt verdi. Birkaç gün içinde eğilim netleşecek.',
  unknown: 'Karar tarzın henüz oluşuyor. Birkaç operasyon sonra çizgin daha görünür olacak.',
};

const DOMINANT_PATTERN_OBSERVATION: Partial<
  Record<DominantStrategyPattern, { kind: import('./playerStyleTypes').PlayerStyleSignalKind; weight: number }>
> = {
  rapid_response_overuse: { kind: 'fast_response', weight: 2 },
  preventive_overuse: { kind: 'preventive', weight: 2 },
  balanced_default_overuse: { kind: 'district_balance', weight: 1.8 },
  resource_saving_overuse: { kind: 'resource_saving', weight: 2 },
  public_trust_overfocus: { kind: 'social_priority', weight: 2 },
  crisis_priority_overfocus: { kind: 'crisis_prevention', weight: 2 },
  district_repetition: { kind: 'district_focus', weight: 2.5 },
  route_heavy_repetition: { kind: 'route_continuity', weight: 2.5 },
  inconsistent_switching: { kind: 'mixed', weight: 2 },
};

function clamp(text: string, limit: number): string {
  const t = text.trim();
  if (t.length <= limit) return t;
  return `${t.slice(0, limit - 1).trimEnd()}…`;
}

function isDuplicateLine(line: string, avoidLines: string[]): boolean {
  return lineDuplicatesAvoidLines(line, avoidLines);
}

export function buildConfidenceLabel(confidence: PlayerStyleConfidence): string {
  return CONFIDENCE_LABELS[confidence] ?? CONFIDENCE_LABELS.low;
}

export function buildPlayerStyleInputFromStrategyContext(args: {
  day: number;
  surface?: PlayerStyleSurface;
  decisionHistory?: PlayerStyleInput['decisionHistory'];
  strategyHistory?: StrategyHistoryStateV1 | null;
  dominantStrategy?: DominantStrategyDetectorResult | null;
  dailyReports?: PlayerStyleInput['dailyReports'];
  recentResults?: PlayerStyleInput['recentResults'];
  carryOverMemory?: PlayerStyleInput['carryOverMemory'];
  resourceFatigue?: PlayerStyleInput['resourceFatigue'];
  socialEcho?: PlayerStyleInput['socialEcho'];
}): PlayerStyleInput {
  const recentResults: PlayerStyleInput['recentResults'] = [...(args.recentResults ?? [])];
  const history = args.strategyHistory?.decisionHistory ?? [];

  for (const record of history.filter((r) => r.day <= args.day).slice(-6)) {
    recentResults.push({
      decisionLabel: record.decisionLabel,
      summaryTitle: record.decisionLabel,
      selectedDecisionKind: record.selectedDecisionKind as EventResultLike['selectedDecisionKind'],
    });
  }

  return {
    day: args.day,
    surface: args.surface,
    decisionHistory: args.decisionHistory,
    strategyHistory: args.strategyHistory ?? undefined,
    dominantStrategy: args.dominantStrategy ?? undefined,
    dailyReports: args.dailyReports,
    recentResults,
    carryOverMemory: args.carryOverMemory,
    resourceFatigue: args.resourceFatigue,
    socialEcho: args.socialEcho,
  };
}

export function buildPlayerStyleEvidenceChips(profile: PlayerStyleProfile): PlayerStyleEvidenceChip[] {
  const def = PLAYER_STYLE_DEFINITIONS[profile.styleId];
  const chips: PlayerStyleEvidenceChip[] = [];
  const seen = new Set<string>();

  const push = (chip: PlayerStyleEvidenceChip) => {
    const key = `${chip.label}:${chip.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    chips.push(chip);
  };

  push({
    label: profile.shortLabel,
    value: profile.tags[0] ?? 'Eğilim',
    tone: profile.tone === 'warning' ? 'warning' : 'positive',
  });

  if (def.strengthLineAlt) {
    push({
      label: def.strengthLine,
      value: def.strengthLineAlt,
      tone: 'positive',
    });
  } else {
    push({
      label: 'Güçlü yan',
      value: def.strengthLine,
      tone: 'positive',
    });
  }

  if (profile.riskLine) {
    push({
      label: 'Dikkat',
      value: profile.riskLine,
      tone: 'warning',
    });
  }

  const kindCounts = new Map<string, number>();
  for (const obs of profile.observations) {
    kindCounts.set(obs.kind, (kindCounts.get(obs.kind) ?? 0) + 1);
  }
  const topKind = [...kindCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topKind && chips.length < 3) {
    const kindLabels: Record<string, string> = {
      fast_response: 'Hızlı müdahale',
      preventive: 'Önleyici plan',
      social_priority: 'Sosyal güven',
      resource_saving: 'Kaynak koruma',
      route_continuity: 'Rota disiplini',
      district_focus: 'Mahalle odağı',
    };
    const label = kindLabels[topKind];
    if (label) {
      push({ label: 'Sinyal', value: label, tone: 'neutral' });
    }
  }

  return chips.slice(0, 3);
}

export function buildPlayerStylePresentationCard(
  profile: PlayerStyleProfile,
): PlayerStylePresentationCard {
  const def = PLAYER_STYLE_DEFINITIONS[profile.styleId];
  const strengths = [def.strengthLine];
  if (def.strengthLineAlt) strengths.push(def.strengthLineAlt);

  const watchouts = profile.riskLine ? [profile.riskLine] : def.riskLine ? [def.riskLine] : [];

  return {
    visible: profile.visible,
    sectionTitle: 'Yönetici Tarzı',
    microcopy: 'Son kararlarına göre',
    label: profile.title,
    shortLabel: profile.shortLabel,
    description: profile.summary,
    strengths: strengths.slice(0, 2),
    watchouts: watchouts.slice(0, 1),
    currentSignal: def.currentSignal,
    confidence: profile.confidence,
    confidenceLabel: buildConfidenceLabel(profile.confidence),
    tone: profile.tone,
    evidenceChips: buildPlayerStyleEvidenceChips(profile),
    styleId: profile.styleId,
  };
}

export function buildPlayerStyleProfileCard(input: PlayerStyleInput): PlayerStylePresentationCard {
  const profile = buildPlayerStyleProfile(input);
  return buildPlayerStylePresentationCard(profile);
}

export function buildPlayerStyleReportLine(
  profile: PlayerStyleProfile,
  avoidLines: string[] = [],
): string | null {
  if (!profile.visible || profile.confidence === 'none') return null;
  const line = REPORT_LINES[profile.styleId] ?? REPORT_LINES.unknown;
  const clamped = clamp(line, PLAYER_STYLE_REPORT_LINE_MAX);
  if (isDuplicateLine(clamped, avoidLines)) return null;
  return clamped;
}

export function buildPlayerStyleEceHint(
  profile: PlayerStyleProfile,
  avoidLines: string[] = [],
): string | null {
  if (!profile.visible || profile.confidence === 'none') return null;
  const hint = clamp(profile.advisorLine, PLAYER_STYLE_ECE_HINT_MAX);
  if (isDuplicateLine(hint, avoidLines)) return null;
  return hint;
}

export function buildPlayerStyleHubLine(profile: PlayerStyleProfile): string | null {
  if (!profile.visible) return null;
  if (profile.confidence === 'none' || profile.styleId === 'unknown') return null;
  return clamp(
    `Yönetici çizgin: ${profile.title}. ${profile.summary}`,
    PLAYER_STYLE_HUB_LINE_MAX,
  );
}

export function inferObservationsFromDominantStrategy(
  dominant: DominantStrategyDetectorResult | null | undefined,
  day: number,
): PlayerStyleObservation[] {
  if (!dominant?.isVisible || dominant.pattern === 'none') return [];
  const mapping = DOMINANT_PATTERN_OBSERVATION[dominant.pattern];
  if (!mapping) return [];
  return [
    {
      id: `pstyle-dominant-${dominant.pattern}`,
      day,
      kind: mapping.kind,
      weight: mapping.weight,
      source: 'fallback',
      debugReason: `dominant:${dominant.pattern}`,
    },
  ];
}

export function inferObservationsFromStrategyHistory(
  strategyHistory: StrategyHistoryStateV1 | null | undefined,
  day: number,
): PlayerStyleObservation[] {
  if (!strategyHistory) return [];
  const observations: PlayerStyleObservation[] = [];
  const recentDecisions = strategyHistory.decisionHistory.filter((r) => r.day <= day).slice(-8);
  const districtCounts = new Map<string, number>();

  for (const record of recentDecisions) {
    if (record.districtId) {
      districtCounts.set(record.districtId, (districtCounts.get(record.districtId) ?? 0) + 1);
    }
    const domainTags = record.domainTags ?? [];
    if (domainTags.includes('vehicle_route') || domainTags.includes('personnel')) {
      observations.push({
        id: `pstyle-strategy-route-${record.id}`,
        day,
        kind: 'route_continuity',
        weight: 1.2,
        source: 'fallback',
        domain: domainTags[0],
        debugReason: 'strategy:route_domain',
      });
    }
  }

  const topDistrict = [...districtCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topDistrict && topDistrict[1] >= 3) {
    observations.push({
      id: `pstyle-strategy-district-${topDistrict[0]}`,
      day,
      kind: 'district_focus',
      weight: 1.8,
      source: 'fallback',
      districtId: topDistrict[0],
      debugReason: 'strategy:district_repeat',
    });
  }

  return observations;
}

export function buildPlayerStyleFromStrategyContext(
  args: Parameters<typeof buildPlayerStyleInputFromStrategyContext>[0],
): PlayerStyleProfile {
  const input = buildPlayerStyleInputFromStrategyContext(args);
  return buildPlayerStyleProfile(input);
}
