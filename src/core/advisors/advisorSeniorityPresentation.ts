import type { PlayerStyleProfile } from '@/core/playerStyle/playerStyleTypes';

import { ADVISOR_ID } from './advisorConstants';
import { getAdvisorReliabilityLabel } from './advisorState';
import type { AdvisorState } from './advisorTypes';
import type {
  AdvisorSeniorityCapability,
  AdvisorSeniorityDepth,
  AdvisorSeniorityInput,
  AdvisorSeniorityModel,
  AdvisorSenioritySurface,
  AdvisorSeniorityTier,
  AdvisorSeniorityTone,
} from './advisorSeniorityTypes';

export const TITLE_LIMIT = 32;
export const SHORT_TITLE_LIMIT = 18;
export const SUMMARY_LINE_LIMIT = 150;
export const INSIGHT_LINE_LIMIT = 180;

type TierDefinition = {
  title: string;
  shortTitle: string;
  depth: AdvisorSeniorityDepth;
  tone: AdvisorSeniorityTone;
  summaryLine: string;
  baseInsight: string;
  capabilities: AdvisorSeniorityCapability[];
  lockedPreview: AdvisorSeniorityCapability[];
  capabilityLabels: string[];
};

const TIER_DEFINITIONS: Record<AdvisorSeniorityTier, TierDefinition> = {
  trainee: {
    title: 'Stajyer Operasyon Asistanı',
    shortTitle: 'Stajyer',
    depth: 'basic_observation',
    tone: 'learning',
    summaryLine: 'Ece temel akışı kısa ve güvenli yorumlarla destekliyor.',
    baseInsight:
      'Bugün temel akışı öğreniyoruz. Önce olayı incele, sonra kararın sonucunu takip et.',
    capabilities: ['explain_event', 'explain_short_term_effect'],
    lockedPreview: ['explain_tradeoff', 'mention_player_style'],
    capabilityLabels: ['Olay okuma', 'Kısa etki'],
  },
  assistant: {
    title: 'Operasyon Asistanı',
    shortTitle: 'Asistan',
    depth: 'short_term_tradeoff',
    tone: 'calm',
    summaryLine: 'Ece bugünkü etki ile kısa vadeli dengeyi birlikte okuyor.',
    baseInsight:
      'Bu karar bugünkü şikayeti azaltabilir; fakat kaynak yükünü de artırabilir.',
    capabilities: ['explain_event', 'explain_short_term_effect', 'explain_tradeoff'],
    lockedPreview: ['mention_carry_over', 'mention_player_style'],
    capabilityLabels: ['Etki', 'Denge', 'Trade-off'],
  },
  field_advisor: {
    title: 'Saha Danışmanı',
    shortTitle: 'Saha Danışmanı',
    depth: 'resource_and_social',
    tone: 'operational',
    summaryLine: 'Ece kaynak ve sosyal etkiyi birlikte yorumlayabiliyor.',
    baseInsight:
      'Kaynak yükü ve sosyal görünürlük aynı anda değişiyor. Bugünkü hız yarın ekip temposuna iz bırakabilir.',
    capabilities: [
      'explain_tradeoff',
      'mention_resource_pressure',
      'mention_social_effect',
      'mention_risk_signal',
    ],
    lockedPreview: ['mention_player_style', 'mention_season_context'],
    capabilityLabels: ['Kaynak', 'Sosyal', 'Risk'],
  },
  operations_specialist: {
    title: 'Operasyon Uzmanı',
    shortTitle: 'Operasyon Uzmanı',
    depth: 'carry_over_and_style',
    tone: 'strategic',
    summaryLine: 'Ece carry-over, tarz ve risk sinyallerini birlikte okuyor.',
    baseInsight:
      'Son kararların hızlı müdahaleye yatkın. Bugün şikayet düşebilir, ancak araç yorgunluğu yarın rota planında dikkat isteyebilir.',
    capabilities: [
      'mention_carry_over',
      'mention_player_style',
      'mention_risk_signal',
      'explain_tradeoff',
    ],
    lockedPreview: ['mention_season_context'],
    capabilityLabels: ['Carry-over', 'Tarz', 'Risk'],
  },
  chief_advisor_preview: {
    title: 'Başdanışman Hazırlığı',
    shortTitle: 'Başdanışman',
    depth: 'strategic_context',
    tone: 'cautious',
    summaryLine: 'Pilot sonunda tarz ve kaynak dengesi birlikte değerlendirilecek.',
    baseInsight:
      'Pilotun sonunda tarzın, kaynak dengen ve mahalle etkilerin birlikte değerlendirilecek.',
    capabilities: [
      'mention_season_context',
      'mention_player_style',
      'mention_carry_over',
      'mention_risk_signal',
    ],
    lockedPreview: [],
    capabilityLabels: ['Pilot özeti', 'Strateji'],
  },
};

function clamp(text: string, limit: number): string {
  const t = text.trim();
  if (t.length <= limit) return t;
  return `${t.slice(0, limit - 1).trimEnd()}…`;
}

function tierRank(tier: AdvisorSeniorityTier): number {
  switch (tier) {
    case 'trainee':
      return 0;
    case 'assistant':
      return 1;
    case 'field_advisor':
      return 2;
    case 'operations_specialist':
      return 3;
    case 'chief_advisor_preview':
      return 4;
    default:
      return 0;
  }
}

export function inferAdvisorSeniorityTier(
  advisorState: AdvisorState | null | undefined,
  day: number,
): AdvisorSeniorityTier {
  if (day === 7) return 'chief_advisor_preview';
  if (day <= 2) return 'trainee';

  const level = advisorState?.level ?? 1;
  const experience = advisorState?.experience ?? 0;
  const band = advisorState?.reliabilityBand ?? 'early_observation';

  if (day <= 3 && level === 1 && experience < 80) return 'assistant';

  if (level >= 3 || band === 'expert' || experience >= 260) {
    return 'operations_specialist';
  }

  if (level >= 2 || band === 'reliable' || experience >= 100 || day >= 5) {
    return 'field_advisor';
  }

  if (day >= 4) return 'field_advisor';
  return 'assistant';
}

export function inferAdvisorSeniorityDepth(tier: AdvisorSeniorityTier): AdvisorSeniorityDepth {
  return TIER_DEFINITIONS[tier].depth;
}

export function buildAdvisorSeniorityCapabilities(
  tier: AdvisorSeniorityTier,
): AdvisorSeniorityCapability[] {
  return [...TIER_DEFINITIONS[tier].capabilities];
}

function tierAllowsCapability(
  tier: AdvisorSeniorityTier,
  capability: AdvisorSeniorityCapability,
): boolean {
  return TIER_DEFINITIONS[tier].capabilities.includes(capability);
}

function appendClause(base: string, clause: string): string {
  if (!clause.trim()) return base;
  if (base.includes(clause.slice(0, 24))) return base;
  return `${base} ${clause}`.trim();
}

export function buildAdvisorSeniorityInsightLine(
  input: AdvisorSeniorityInput,
  model: Pick<AdvisorSeniorityModel, 'tier' | 'unlockedCapabilities'>,
): string {
  const def = TIER_DEFINITIONS[model.tier];
  let line = def.baseInsight;

  if (
    tierAllowsCapability(model.tier, 'mention_resource_pressure') &&
    input.resourceFatigue?.state &&
    ['tired', 'strained', 'maintenance_risk'].includes(input.resourceFatigue.state)
  ) {
    line = appendClause(line, 'Kaynak yükü bugün yükselmiş görünüyor.');
  }

  if (
    tierAllowsCapability(model.tier, 'mention_social_effect') &&
    input.dynamicSocialEcho?.mention
  ) {
    line = appendClause(line, 'Sosyal görünürlük de aynı kararla etkilenebilir.');
  }

  if (
    tierAllowsCapability(model.tier, 'mention_carry_over') &&
    input.carryOverMemory?.summary
  ) {
    line = appendClause(line, 'Bir kısım baskı yarın izlenmeye devam edebilir.');
  }

  if (tierAllowsCapability(model.tier, 'mention_risk_signal') && input.mapBeforeAfter?.outcome === 'prevented') {
    line = appendClause(line, 'Risk sinyali büyümeden kontrol altında tutuldu.');
  }

  if (tierAllowsCapability(model.tier, 'mention_player_style')) {
    const style = input.playerStyleProfile;
    if (style?.visible && style.styleId !== 'unknown' && style.advisorLine) {
      if (model.tier === 'operations_specialist' || model.tier === 'chief_advisor_preview') {
        line = appendClause(line, style.advisorLine);
      }
    } else if (model.tier === 'assistant' && style?.visible) {
      line = appendClause(line, 'Tarz sinyali oluşmaya başladı; birkaç karar sonra netleşir.');
    }
  }

  if (
    tierAllowsCapability(model.tier, 'mention_season_context') &&
    model.tier === 'chief_advisor_preview'
  ) {
    line = appendClause(line, 'Pilot tarzın şekilleniyor; kişisel özet yakında daha net görünecek.');
  }

  if (input.day === 7 && model.tier === 'chief_advisor_preview') {
    line = TIER_DEFINITIONS.chief_advisor_preview.baseInsight;
  }

  return clamp(line, INSIGHT_LINE_LIMIT);
}

export function shouldShowAdvisorSeniority(
  day: number,
  surface: AdvisorSenioritySurface,
  model: AdvisorSeniorityModel,
): boolean {
  if (!model.visible) return false;
  if (day <= 1) return surface === 'hub' && model.tier === 'trainee';
  if (day === 1) return false;
  return true;
}

export function shouldSuppressPlayerStyleForSeniority(
  seniority: AdvisorSeniorityModel | null | undefined,
  playerStyle: PlayerStyleProfile | null | undefined,
): boolean {
  if (!seniority?.visible || !playerStyle?.visible) return false;
  if (tierRank(seniority.tier) < tierRank('operations_specialist')) return false;
  if (!seniority.unlockedCapabilities.includes('mention_player_style')) return false;
  const styleSnippet = playerStyle.advisorLine.slice(0, 40).toLowerCase();
  return seniority.insightLine.toLowerCase().includes(styleSnippet.slice(0, 20));
}

export function buildAdvisorSeniorityModel(input: AdvisorSeniorityInput): AdvisorSeniorityModel {
  const day = input.day;
  const surface = input.surface ?? 'hub';
  const tier = inferAdvisorSeniorityTier(input.advisorState, day);
  const def = TIER_DEFINITIONS[tier];
  const unlockedCapabilities = buildAdvisorSeniorityCapabilities(tier);
  const reliabilityLabel = input.advisorState
    ? getAdvisorReliabilityLabel(input.advisorState.reliabilityScore)
    : undefined;

  const partial: AdvisorSeniorityModel = {
    advisorId: input.advisorState?.advisorId ?? ADVISOR_ID,
    displayName: 'Ece',
    tier,
    title: clamp(def.title, TITLE_LIMIT),
    shortTitle: clamp(def.shortTitle, SHORT_TITLE_LIMIT),
    depth: def.depth,
    tone: def.tone,
    capabilityLabels: def.capabilityLabels.slice(0, 3),
    unlockedCapabilities,
    lockedPreviewCapabilities: def.lockedPreview,
    reliabilityLabel,
    confidenceLabel: reliabilityLabel,
    summaryLine: clamp(def.summaryLine, SUMMARY_LINE_LIMIT),
    insightLine: '',
    visible: day >= 1,
    maxLines: 2,
    debugReason: `tier:${tier} day:${day}`,
  };

  partial.insightLine = buildAdvisorSeniorityInsightLine(input, partial);

  if (day <= 1) {
    partial.visible = surface === 'hub';
    partial.maxLines = 1;
  } else if (day <= 3) {
    partial.visible = tier !== 'chief_advisor_preview' || day === 7;
    partial.maxLines = 2;
  } else {
    partial.visible = true;
  }

  partial.visible = shouldShowAdvisorSeniority(day, surface, partial);

  return partial;
}

export function formatAdvisorSeniorityDebug(model: AdvisorSeniorityModel): string {
  return `${model.tier}/${model.depth} caps=${model.unlockedCapabilities.length} ${model.debugReason ?? ''}`;
}
