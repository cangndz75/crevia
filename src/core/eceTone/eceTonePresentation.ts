import type { DominantStrategyPattern } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { EventCard } from '@/core/models/EventCard';
import { buildPlayerStyleEceHint } from '@/core/playerStyle/playerStyleCardPresentation';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';

import type {
  BuildEcePhaseLineInput,
  EceAdvisorLine,
  EceAdvisorPhase,
  EceConfidence,
  EceMemoryContextInput,
  EceMemorySnapshot,
  EceOutcomeTone,
  EcePlayerDecisionPattern,
  EceResourceSignal,
  EceSignalLevel,
  EceSocialSignal,
  EceTone,
} from './eceToneTypes';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

export const ECE_PHASE_LINE_MAX = 120;
export const ECE_RESULT_REPORT_LINE_MAX = 140;

const TECHNICAL_TOKEN_PATTERN = /\b[a-z]+_[a-z_]+\b/;

const TONE_LABELS: Record<EceTone, string> = {
  supportive: 'Destekleyici',
  cautionary: 'Dikkat',
  direct: 'Doğrudan',
  strategic: 'Stratejik',
  skeptical: 'Temkinli',
  calm: 'Dengeli',
};

const PATTERN_FROM_DOMINANT: Partial<Record<DominantStrategyPattern, EcePlayerDecisionPattern>> = {
  rapid_response_overuse: 'rapid_response',
  preventive_overuse: 'preventive',
  balanced_default_overuse: 'balanced',
  resource_saving_overuse: 'resource_saving',
  public_trust_overfocus: 'public_trust_focus',
  crisis_priority_overfocus: 'crisis_priority',
  district_repetition: 'district_repetition',
};

const KIND_TO_PATTERN: Record<string, EcePlayerDecisionPattern> = {
  rapid_response: 'rapid_response',
  fast_response: 'rapid_response',
  balanced_plan: 'balanced',
  balanced_dispatch: 'balanced',
  preventive_route: 'preventive',
  long_term_fix: 'preventive',
  resource_heavy: 'resource_saving',
  resource_saving: 'resource_saving',
  communication_first: 'public_trust_focus',
  monitor_only: 'crisis_priority',
};

function clampText(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function normalizeLine(value: string): string {
  return value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function isDuplicateEceLine(
  line: string | undefined,
  avoidLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  return lineDuplicatesAvoidLines(line, avoidLines);
}

function pickVariant(
  candidates: string[],
  seed: string,
  avoidLines: string[] = [],
  max = ECE_PHASE_LINE_MAX,
): string {
  const safe = candidates
    .map((line) => clampText(line, max))
    .filter((line) => line.length > 0 && !TECHNICAL_TOKEN_PATTERN.test(line));
  const deduped = safe.filter((line) => !isDuplicateEceLine(line, avoidLines));
  const pool = deduped.length > 0 ? deduped : safe;
  if (pool.length === 0) {
    return clampText('Önce doğrula, sonra planla.', max);
  }
  return pool[hashSeed(seed) % pool.length];
}

function countPatternVotes(
  records: Array<{ kind?: string; districtName?: string }>,
): { pattern: EcePlayerDecisionPattern; district?: string } {
  const counts = new Map<EcePlayerDecisionPattern, number>();
  const districtCounts = new Map<string, number>();

  for (const record of records) {
    const kind = record.kind?.trim().toLowerCase();
    if (kind && KIND_TO_PATTERN[kind]) {
      const pattern = KIND_TO_PATTERN[kind];
      counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
    }
    const district = record.districtName?.trim();
    if (district) {
      districtCounts.set(district, (districtCounts.get(district) ?? 0) + 1);
    }
  }

  let topPattern: EcePlayerDecisionPattern = 'unknown';
  let topScore = 0;
  for (const [pattern, score] of counts.entries()) {
    if (score > topScore) {
      topPattern = pattern;
      topScore = score;
    }
  }

  let repeatedDistrict: string | undefined;
  let districtScore = 0;
  for (const [district, score] of districtCounts.entries()) {
    if (score >= 2 && score > districtScore) {
      repeatedDistrict = district;
      districtScore = score;
    }
  }

  if (districtScore >= 2 && (topScore < 2 || topPattern === 'unknown')) {
    return { pattern: 'district_repetition', district: repeatedDistrict };
  }

  return { pattern: topScore >= 2 ? topPattern : 'unknown', district: repeatedDistrict };
}

function inferPatternFromHistory(
  strategyHistory?: StrategyHistoryStateV1 | null,
): { pattern: EcePlayerDecisionPattern; district?: string; confidence: EceConfidence } {
  const decisions = strategyHistory?.decisionHistory ?? [];
  if (decisions.length === 0) {
    return { pattern: 'unknown', confidence: 'low' };
  }

  const recent = decisions.slice(-6).map((record) => ({
    kind: record.selectedDecisionKind,
    districtName: record.districtName,
  }));
  const vote = countPatternVotes(recent);
  const confidence: EceConfidence =
    decisions.length >= 5 && vote.pattern !== 'unknown' ? 'high' : decisions.length >= 3 ? 'medium' : 'low';
  return { ...vote, confidence };
}

function resolveSocialSignal(input: EceMemoryContextInput, event?: EventCard | null): EceSocialSignal {
  if (input.socialPulseLevel) return input.socialPulseLevel;
  if (input.socialSignalHeated || input.socialPressure) return 'heated';
  const satisfaction = event?.previewEffects?.publicSatisfaction ?? 0;
  if (satisfaction <= -4) return 'heated';
  if (satisfaction <= -2) return 'watching';
  return 'calm';
}

function resolveResourceSignal(input: EceMemoryContextInput, event?: EventCard | null): EceResourceSignal {
  if (input.resourcePressure) return 'strained';
  const hasCost = event?.decisions.some((decision) => {
    const costs = decision.costs;
    if (!costs) return false;
    return (costs.budget ?? 0) > 0 || (costs.staffHours ?? 0) > 0 || (costs.vehicleUsage ?? 0) > 0;
  });
  if (event?.riskLevel === 'critical') return 'critical';
  if (hasCost && (event?.riskLevel === 'high' || event?.riskLevel === 'medium')) return 'strained';
  return 'safe';
}

function resolveTrustSignal(input: EceMemoryContextInput, event?: EventCard | null): EceSignalLevel {
  if (input.trustPressure) return 'declining';
  const satisfaction = event?.previewEffects?.publicSatisfaction ?? 0;
  if (satisfaction >= 2) return 'improving';
  if (satisfaction <= -3) return 'declining';
  return 'stable';
}

function selectDominantTone(
  pattern: EcePlayerDecisionPattern,
  social: EceSocialSignal,
  resource: EceResourceSignal,
  day: number,
  outcome?: EceOutcomeTone,
): EceTone {
  if (outcome === 'positive') return 'supportive';
  if (outcome === 'critical' || outcome === 'warning') return 'cautionary';
  if (social === 'heated' || resource === 'critical') return 'cautionary';
  if (pattern === 'district_repetition' || pattern === 'rapid_response') return 'direct';
  if (day >= 8 || pattern === 'preventive') return 'strategic';
  if (pattern === 'unknown') return 'calm';
  if (pattern === 'balanced') return 'supportive';
  return 'cautionary';
}

export function buildEceMemorySnapshot(input: EceMemoryContextInput = {}): EceMemorySnapshot {
  const event = input.event ?? null;
  const day = input.day ?? event?.day ?? 1;
  const dominant = input.dominantStrategy;
  const historyInference = inferPatternFromHistory(input.strategyHistory);

  let recentDecisionPattern = historyInference.pattern;
  let confidence = historyInference.confidence;
  let repeatedDistrictName = historyInference.district;

  if (dominant?.isVisible && dominant.pattern !== 'none') {
    recentDecisionPattern = PATTERN_FROM_DOMINANT[dominant.pattern] ?? recentDecisionPattern;
    confidence =
      dominant.confidence === 'high'
        ? 'high'
        : dominant.confidence === 'medium'
          ? 'medium'
          : confidence;
    const districtSignal = dominant.signals.find((signal) => signal.districtName);
    if (districtSignal?.districtName) {
      repeatedDistrictName = districtSignal.districtName;
    }
  }

  if (recentDecisionPattern === 'unknown' && input.playerStyleProfile?.visible) {
    const styleId = input.playerStyleProfile.styleId;
    if (styleId === 'fast_responder') recentDecisionPattern = 'rapid_response';
    if (styleId === 'preventive_planner') recentDecisionPattern = 'preventive';
    if (styleId === 'resource_guardian') recentDecisionPattern = 'resource_saving';
    if (styleId === 'public_focused') recentDecisionPattern = 'public_trust_focus';
    if (styleId === 'crisis_watcher') recentDecisionPattern = 'crisis_priority';
    if (styleId === 'balanced_operator') recentDecisionPattern = 'balanced';
    if (input.playerStyleProfile.confidence === 'high') confidence = 'high';
    else if (input.playerStyleProfile.confidence === 'medium') confidence = 'medium';
  }

  const socialSignal = resolveSocialSignal(input, event);
  const resourceSignal = resolveResourceSignal(input, event);
  const trustSignal = resolveTrustSignal(input, event);
  const pressureFlags: string[] = [];
  if (resourceSignal !== 'safe') pressureFlags.push('resource');
  if (socialSignal === 'heated' || socialSignal === 'watching') pressureFlags.push('social');
  if (trustSignal === 'declining') pressureFlags.push('trust');
  if (event?.riskLevel === 'high' || event?.riskLevel === 'critical') pressureFlags.push('risk');

  const dominantTone = selectDominantTone(
    recentDecisionPattern,
    socialSignal,
    resourceSignal,
    day,
    input.recentOutcomeTone,
  );

  return {
    playerStyleLabel: input.advisorRelationship?.playerStyleSignal?.label ?? input.playerStyleProfile?.shortLabel,
    recentDecisionPattern,
    dominantTone,
    confidence: day <= 1 ? 'low' : confidence,
    recentDistrictName: input.districtName ?? event?.district,
    repeatedDistrictName,
    lastPlanId: input.selectedPlanId,
    lastPlanLabel: input.selectedPlanLabel,
    recentOutcomeTone: input.recentOutcomeTone,
    pressureFlags,
    trustSignal,
    resourceSignal,
    socialSignal,
  };
}

function buildLine(
  phase: EceAdvisorPhase,
  tone: EceTone,
  message: string,
  source: EceAdvisorLine['source'],
  confidence: EceConfidence,
  seed: string,
): EceAdvisorLine {
  const max = phase === 'result' || phase === 'report' ? ECE_RESULT_REPORT_LINE_MAX : ECE_PHASE_LINE_MAX;
  const clamped = clampText(message, max);
  return {
    id: `ece-${phase}-${seed}`,
    phase,
    tone,
    toneLabel: TONE_LABELS[tone],
    message: clamped,
    shortMessage: clampText(clamped, Math.min(96, max)),
    source,
    confidence,
  };
}

function styleNudgeLine(pattern: EcePlayerDecisionPattern, district?: string): string | undefined {
  switch (pattern) {
    case 'rapid_response':
      return 'Yine hızlı müdahaleye yaslanıyorsun. Kısa vadede etkili, ama ekip yorgunluğunu büyütebilir.';
    case 'balanced':
      return 'Dengeli çizgin riski büyütmeden ilerletiyor. Sosyal tepkiyi yine de izlemek gerekir.';
    case 'preventive':
      return 'Önleyici hamlelerin yarınki baskıyı azaltabilir. Bugünkü kaynak maliyetini kontrol et.';
    case 'resource_saving':
      return 'Kaynakları koruyorsun, ama bu olayda gecikme güveni düşürebilir.';
    case 'public_trust_focus':
      return 'Halk güvenini önceliklendiriyorsun. Kaynak baskısını görünmez bırakma.';
    case 'crisis_priority':
      return 'Krizleri öne almak mantıklı. Şehrin rutin basıncını da biriktirme.';
    case 'district_repetition':
      return district
        ? `${district}'e odaklanman sonuç veriyor, ama diğer bölgelerde beklenti birikebilir.`
        : 'Aynı mahalleye üst üste yükleniyorsun. Hizmet dengesi bozulabilir.';
    default:
      return undefined;
  }
}

export function buildInspectEceLine(input: BuildEcePhaseLineInput): EceAdvisorLine {
  const { memory, context, seed } = input;
  const avoid = input.avoidLines ?? context.avoidLines ?? [];
  const day = context.day ?? 1;

  if (day <= 1 || context.event?.day === 1) {
    return buildLine(
      'inspect',
      'calm',
      pickVariant(
        [
          'Önce sinyali netleştir. Plan aşamasında bedeli göreceksin.',
          'Önce olayı inceliyoruz. Bulgular planlama adımında yol gösterecek.',
        ],
        seed,
        avoid,
      ),
      'fallback',
      'low',
      seed,
    );
  }

  if (memory.socialSignal === 'heated') {
    return buildLine(
      'inspect',
      'cautionary',
      pickVariant(
        [
          'Sosyal nabız yükseliyor. Sahadan ikinci teyit almadan hızlı karar verme.',
          'Mahalle nabzı hassas. Eksik sinyalle sahaya çıkmak sonucu zayıflatabilir.',
        ],
        seed,
        avoid,
      ),
      'phase',
      memory.confidence,
      seed,
    );
  }

  if (context.evidenceSufficient) {
    return buildLine(
      'inspect',
      'strategic',
      pickVariant(
        [
          'Sinyal yeterince net. Şimdi planın bedelini görmen gerekiyor.',
          'Bulgular net. Planlama adımında kaynak ve sosyal etkiyi karşılaştır.',
        ],
        seed,
        avoid,
      ),
      'phase',
      memory.confidence,
      seed,
    );
  }

  if (memory.resourceSignal === 'strained' || memory.pressureFlags.includes('risk')) {
    return buildLine(
      'inspect',
      'cautionary',
      pickVariant(
        [
          'Önce sosyal nabzı ve saha bulgusunu doğrula. Eksik sinyal ile sahaya çıkmak sonucu zayıflatabilir.',
          'Risk sinyali güçlü. Planlama adımında hızlı çözüm yerine dengeli yaklaşımı kontrol et.',
        ],
        seed,
        avoid,
      ),
      'phase',
      memory.confidence,
      seed,
    );
  }

  const styleLine = memory.confidence !== 'low' ? styleNudgeLine(memory.recentDecisionPattern) : undefined;
  if (styleLine && day >= 4) {
    return buildLine('inspect', memory.dominantTone, styleLine, 'memory', memory.confidence, seed);
  }

  return buildLine(
    'inspect',
    'calm',
    pickVariant(['Önce doğrula, sonra planla.', 'Önce sinyali netleştir. Sonra planın bedelini gör.'], seed, avoid),
    'fallback',
    memory.confidence,
    seed,
  );
}

export function buildPlanEceLine(
  input: BuildEcePhaseLineInput & { selectedPlanId?: string | null },
): EceAdvisorLine {
  const { memory, context, seed } = input;
  const avoid = input.avoidLines ?? context.avoidLines ?? [];
  const day = context.day ?? 1;
  const planId = input.selectedPlanId ?? context.selectedPlanId;

  if (!planId) {
    return buildLine(
      'plan',
      'calm',
      'Önce bir plan seç. Sonra ekibi hangi tempoyla yönlendireceğini netleştir.',
      'fallback',
      'low',
      seed,
    );
  }

  if (day <= 1) {
    return buildLine(
      'plan',
      'calm',
      'Dengeli plan riski büyütmeden ilerler. İlk operasyonda kaynakları kontrollü kullan.',
      'fallback',
      'low',
      seed,
    );
  }

  const planLines: Record<string, string[]> = {
    rapid_response: [
      'Bu plan güveni hızlı toparlar. Ekip temposunu yarına taşımamaya dikkat et.',
      'Hızlı müdahale kısa vadede etkili. Ekip yorgunluğunu izle.',
    ],
    balanced_plan: [
      'Dengeli yaklaşım riski büyütmeden ilerler. Sosyal tepkiyi tamamen kapatmayabilir.',
      'Dengeli plan kaynak ve güven arasında orta yol sunar.',
    ],
    long_term_fix: [
      'Önleyici plan yarınki baskıyı azaltabilir. Kaynak maliyetini gözden kaçırma.',
      'Uzun vadeli plan bugünü rahatlatır; bugünkü maliyeti kontrol et.',
    ],
  };

  const baseCandidates = planLines[planId] ?? planLines.balanced_plan;
  let tone: EceTone =
    planId === 'rapid_response' ? 'cautionary' : planId === 'long_term_fix' ? 'strategic' : 'supportive';

  const styleLine =
    memory.confidence !== 'low' && memory.recentDecisionPattern !== 'unknown'
      ? styleNudgeLine(memory.recentDecisionPattern, memory.repeatedDistrictName)
      : undefined;

  if (styleLine && !isDuplicateEceLine(styleLine, [...avoid, ...baseCandidates])) {
    tone = memory.dominantTone;
    return buildLine('plan', tone, styleLine, 'memory', memory.confidence, seed);
  }

  return buildLine(
    'plan',
    tone,
    pickVariant(baseCandidates, `${seed}:${planId}`, avoid),
    'strategy',
    memory.confidence,
    seed,
  );
}

export function buildDispatchEceLine(
  input: BuildEcePhaseLineInput & { readinessRisky?: boolean; planReady?: boolean },
): EceAdvisorLine {
  const { memory, context, seed } = input;
  const avoid = input.avoidLines ?? context.avoidLines ?? [];
  const day = context.day ?? 1;

  if (day <= 1) {
    return buildLine(
      'dispatch',
      'calm',
      'Yönlendirme adımında ekibi sahaya çıkarıyoruz. Sonraki ekranda operasyonu takip edeceksin.',
      'fallback',
      'low',
      seed,
    );
  }

  if (input.readinessRisky || memory.resourceSignal === 'critical') {
    return buildLine(
      'dispatch',
      'cautionary',
      pickVariant(
        [
          'Kaynak baskısı orta seviyede. Operasyonu başlatabilirsin, ama yarınki kapasiteyi tüketme.',
          'Ekip yorgunluğu var. Bu seçim süre riskini artırabilir.',
        ],
        seed,
        avoid,
      ),
      'phase',
      memory.confidence,
      seed,
    );
  }

  if (memory.socialSignal === 'heated') {
    return buildLine(
      'dispatch',
      'cautionary',
      'Görünür müdahale sosyal tepkiyi azaltabilir. Gecikme algısı büyümeden hareket et.',
      'phase',
      memory.confidence,
      seed,
    );
  }

  return buildLine(
    'dispatch',
    'strategic',
    pickVariant(
      [
        'Plan hazır. Ekibi sahaya çıkarırken araç ve ekip temposunu birlikte izle.',
        'Atama dengeli görünüyor. Onayladıktan sonra ekibi sahaya yönlendir.',
      ],
      seed,
      avoid,
    ),
    'phase',
    memory.confidence,
    seed,
  );
}

export function buildFieldEceLine(
  input: BuildEcePhaseLineInput & { operationRisky?: boolean; microDecisionPending?: boolean },
): EceAdvisorLine {
  const { memory, context, seed } = input;
  const avoid = input.avoidLines ?? context.avoidLines ?? [];
  const day = context.day ?? 1;

  if (day <= 1) {
    return buildLine(
      'field',
      'calm',
      'Şimdi operasyonu takip ediyoruz. Tamamlandığında kararın şehir etkisini göreceksin.',
      'fallback',
      'low',
      seed,
    );
  }

  if (input.microDecisionPending || input.operationRisky) {
    return buildLine(
      'field',
      'cautionary',
      pickVariant(
        [
          'Operasyon ilerliyor. Risk düşüyor ama tamamen kapanmış değil.',
          'Atama riski sahada hissediliyor. Mikro karar çıkarsa planı korumak güvenli olabilir.',
        ],
        seed,
        avoid,
      ),
      'phase',
      memory.confidence,
      seed,
    );
  }

  return buildLine(
    'field',
    'supportive',
    pickVariant(
      [
        'Ekip sahada. İlk etki olumlu, ama nihai sonuç sosyal tepkiye göre şekillenecek.',
        'Operasyon akışı izleniyor. Tamamlandığında sonucu birlikte okuyacağız.',
      ],
      seed,
      avoid,
    ),
    'phase',
    memory.confidence,
    seed,
  );
}

export function buildResultEceLine(
  input: BuildEcePhaseLineInput & { outcomeTone?: EceOutcomeTone },
): EceAdvisorLine {
  const { memory, context, seed } = input;
  const avoid = input.avoidLines ?? context.avoidLines ?? [];
  const day = context.day ?? 1;
  const outcome = input.outcomeTone ?? memory.recentOutcomeTone ?? 'neutral';

  if (day <= 1) {
    return buildLine(
      'result',
      'calm',
      'İlk operasyon tamamlandı. Sonuç kartları, kararının şehir üzerindeki etkisini gösterir.',
      'fallback',
      'low',
      seed,
    );
  }

  const outcomeLines: Record<EceOutcomeTone, string[]> = {
    positive: [
      'Bu karar güveni toparladı. Aynı tempoyu kaynakları yormadan sürdür.',
      'Kararın sahada karşılık buldu. Etkinin rapora nasıl yansıdığını izle.',
    ],
    mixed: ['Sonuç iyi, ama bedelsiz değil. Ekip baskısı yarına taşınabilir.'],
    warning: [
      'Kısa vadede rahatlama var, fakat bu karar yeni bir kaynak baskısı doğurdu.',
      'Operasyon tamamlandı ama bazı etkiler yarına taşınabilir.',
    ],
    critical: ['Bu sonuç mahallede iz bırakır. Bir sonraki hamlede güveni onarmaya odaklan.'],
    neutral: ['Sonuç kayda alındı. Merkez ve rapor ekranından etkiyi takip edebilirsin.'],
  };

  const tone: EceTone =
    outcome === 'positive'
      ? 'supportive'
      : outcome === 'mixed'
        ? 'cautionary'
        : outcome === 'warning' || outcome === 'critical'
          ? 'cautionary'
          : 'calm';

  const styleLine =
    memory.confidence === 'high' && day >= 8
      ? styleNudgeLine(memory.recentDecisionPattern, memory.repeatedDistrictName)
      : undefined;

  if (styleLine && outcome !== 'critical' && !isDuplicateEceLine(styleLine, avoid)) {
    return buildLine('result', 'strategic', styleLine, 'memory', memory.confidence, seed);
  }

  const playerStyleHint =
    day >= 3 && context.playerStyleProfile?.visible
      ? buildPlayerStyleEceHint(context.playerStyleProfile, avoid)
      : null;
  if (
    playerStyleHint &&
    outcome !== 'critical' &&
    !isDuplicateEceLine(playerStyleHint, avoid)
  ) {
    return buildLine('result', 'strategic', playerStyleHint, 'memory', memory.confidence, seed);
  }

  return buildLine(
    'result',
    tone,
    pickVariant(outcomeLines[outcome], `${seed}:${outcome}`, avoid, ECE_RESULT_REPORT_LINE_MAX),
    'result',
    memory.confidence,
    seed,
  );
}

export function buildHubEceLine(input: BuildEcePhaseLineInput): string | undefined {
  const line = buildResultEceLine({
    ...input,
    outcomeTone: input.memory.recentOutcomeTone ?? 'mixed',
  });
  const message = clampText(line.message, 92);
  if (isDuplicateEceLine(message, input.avoidLines ?? input.context.avoidLines)) return undefined;
  return message;
}

export function buildReportEceReflection(input: BuildEcePhaseLineInput): string | undefined {
  const { memory, context, seed } = input;
  const avoid = input.avoidLines ?? context.avoidLines ?? [];
  const day = context.day ?? 1;

  if (day <= 1) return undefined;

  const reportLines: Record<EcePlayerDecisionPattern, string[]> = {
    rapid_response: [
      'Bugün hızlı müdahaleler güveni toparladı. Yarın ekip temposu daha kritik olacak.',
    ],
    balanced: [
      'Bugün dengeli kararlarla riski büyütmeden ilerledin. Sosyal beklenti tamamen kapanmadı.',
    ],
    preventive: [
      'Önleyici hamleler yarınki baskıyı hafifletebilir. Bugünkü kaynak maliyetini not et.',
    ],
    resource_saving: [
      'Kaynakları korudun, fakat bazı mahallelerde beklenti birikebilir.',
    ],
    public_trust_focus: [
      'Halk güvenine odaklandın. Yarın kaynak dengesini gözden kaçırma.',
    ],
    crisis_priority: [
      'Krizleri öne aldın. Rutin baskının yarın görünür olabileceğini unutma.',
    ],
    district_repetition: [
      memory.repeatedDistrictName
        ? `${memory.repeatedDistrictName} odaklı gün geçirdin. Diğer mahalle beklentisini izle.`
        : 'Tek mahalleye yoğunlaştın. Hizmet dengesini yarın kontrol et.',
    ],
    unknown: [
      'Bugün operasyonel denge korundu. Yarın öncelikleri netleştirmek işe yarar.',
    ],
  };

  const message = pickVariant(
    reportLines[memory.recentDecisionPattern],
    `${seed}:report`,
    avoid,
    ECE_RESULT_REPORT_LINE_MAX,
  );
  if (isDuplicateEceLine(message, avoid)) return undefined;
  return message;
}

export function mapEceToneToPlanAdvisorTone(
  tone: EceTone,
): 'calm' | 'teaching' | 'warning' | 'positive' {
  switch (tone) {
    case 'supportive':
      return 'positive';
    case 'cautionary':
    case 'direct':
    case 'skeptical':
      return 'warning';
    case 'strategic':
      return 'calm';
    default:
      return 'calm';
  }
}

export function mapEceToneToInspectAdvisorTone(
  tone: EceTone,
): 'calm' | 'teaching' | 'warning' | 'urgent' | 'positive' {
  switch (tone) {
    case 'cautionary':
    case 'direct':
    case 'skeptical':
      return 'warning';
    case 'supportive':
      return 'positive';
    default:
      return 'calm';
  }
}

export function mapEceToneToDispatchAdvisorTone(
  tone: EceTone,
): 'calm' | 'teaching' | 'warning' | 'positive' {
  switch (tone) {
    case 'supportive':
      return 'positive';
    case 'cautionary':
    case 'direct':
    case 'skeptical':
      return 'warning';
    default:
      return 'calm';
  }
}

export function mapEceToneToFieldAdvisorTone(
  tone: EceTone,
): 'calm' | 'teaching' | 'warning' | 'positive' {
  return mapEceToneToDispatchAdvisorTone(tone);
}

export function mapEceToneToResultAdvisorTone(
  tone: EceTone,
): 'calm' | 'teaching' | 'warning' | 'positive' {
  return mapEceToneToDispatchAdvisorTone(tone);
}

export function mapEceToneToToneLabel(tone: EceTone): string {
  return TONE_LABELS[tone];
}

export function buildEceWorkflowMemoryContext(input: {
  day?: number;
  event?: EventCard | null;
  strategyHistory?: StrategyHistoryStateV1 | null;
  dominantStrategy?: DominantStrategyDetectorResult | null;
  advisorRelationship?: import('@/core/advisorRelationship/advisorRelationshipTypes').AdvisorOperationalRelationshipModel | null;
  playerStyleProfile?: import('@/core/playerStyle/playerStyleTypes').PlayerStyleProfile | null;
  selectedPlanId?: string;
  selectedPlanLabel?: string;
  recentOutcomeTone?: EceOutcomeTone;
  avoidLines?: string[];
}): EceMemoryContextInput {
  return {
    day: input.day,
    event: input.event,
    eventId: input.event?.id,
    districtName: input.event?.district,
    strategyHistory: input.strategyHistory,
    dominantStrategy: input.dominantStrategy,
    advisorRelationship: input.advisorRelationship,
    playerStyleProfile: input.playerStyleProfile,
    selectedPlanId: input.selectedPlanId,
    selectedPlanLabel: input.selectedPlanLabel,
    recentOutcomeTone: input.recentOutcomeTone,
    avoidLines: input.avoidLines,
    resourcePressure: input.event?.riskLevel === 'high' || input.event?.riskLevel === 'critical',
    socialPressure: (input.event?.previewEffects?.publicSatisfaction ?? 0) <= -3,
    trustPressure: (input.event?.previewEffects?.publicSatisfaction ?? 0) <= -4,
  };
}

export type { EceAdvisorLine, EceMemoryContextInput, EceMemorySnapshot, EceTone };
