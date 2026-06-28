import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';

export type DecisionStoryImpactLine = {
  key: string;
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EndOfDayDecisionStoryPresentation = {
  visible: boolean;
  decisionSentence: string;
  impactLines: DecisionStoryImpactLine[];
  outcomeBadge: string;
  outcomeBadgeTone: 'positive' | 'neutral' | 'warning' | 'mixed';
  playerStyleTag?: string | null;
  decisionLabel?: string | null;
  districtName?: string | null;
};

export type BuildDecisionStoryInput = {
  day: number;
  metrics: GameMetrics;
  decisionsToday: DecisionRecord[];
  criticalDecision?: DecisionRecord | null;
  cityReaction?: PostDecisionCityReactionPresentation | null;
  managementStyleLine?: string | null;
  decisionImpactLine?: string | null;
  avoidLines?: string[];
};

type HighlightCandidate = {
  score: number;
  sentence: string;
  impacts: DecisionStoryImpactLine[];
  badge: string;
  badgeTone: EndOfDayDecisionStoryPresentation['outcomeBadgeTone'];
  styleTag?: string | null;
};

function clampLine(text: string, max = 110): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function lineDuplicatesAvoid(line: string, avoid: string[]): boolean {
  const norm = line.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
  return avoid.some((a) => {
    const an = a.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
    return an.length > 8 && (norm.includes(an) || an.includes(norm));
  });
}

function resolveTrustDelta(record: DecisionRecord): number {
  return (
    record.appliedEffects.publicSatisfaction ??
    record.appliedEffects.trust ??
    0
  );
}

function resolveResourceDelta(record: DecisionRecord): number {
  const budget = record.appliedEffects.budget;
  if (budget != null && budget !== 0) return budget;
  const cost = record.appliedCosts?.budget;
  if (cost != null && cost !== 0) return -Math.abs(cost);
  return 0;
}

function resolveMoraleDelta(record: DecisionRecord): number {
  return record.appliedEffects.staffMorale ?? 0;
}

function buildTrustHighlight(
  decision: DecisionRecord,
  cityReaction?: PostDecisionCityReactionPresentation | null,
): HighlightCandidate {
  const delta = resolveTrustDelta(decision);
  const positive = delta >= 0;
  const district = decision.neighborhoodName ?? 'Mahalle';
  const label = decision.decisionLabel ?? 'Saha kararı';
  const sentence = cityReaction?.shortSummary
    ? clampLine(cityReaction.shortSummary)
    : clampLine(
        positive
          ? `${label} güven kaybını durdurdu; ${district} tepkisi yumuşadı.`
          : `${label} güven baskısını artırdı; ${district} sabrı zorlandı.`,
      );

  return {
    score: Math.abs(delta) * 10 + 20,
    sentence,
    impacts: [
      {
        key: 'trust',
        label: positive ? 'Güven toparlandı' : 'Güven baskısı arttı',
        tone: positive ? 'positive' : 'warning',
      },
      {
        key: 'readiness',
        label: resolveMoraleDelta(decision) < 0 ? 'Ekip yükü arttı' : 'Ekip dengesi korundu',
        tone: resolveMoraleDelta(decision) < 0 ? 'warning' : 'neutral',
      },
    ],
    badge: positive ? 'Güven kazanımı' : 'Güven riski',
    badgeTone: positive ? 'positive' : 'warning',
  };
}

function buildResourceHighlight(decision: DecisionRecord): HighlightCandidate {
  const delta = resolveResourceDelta(decision);
  const spent = delta < 0;
  const label = decision.decisionLabel ?? 'Operasyon kararı';
  return {
    score: Math.abs(delta) / 100 + 18,
    sentence: clampLine(
      spent
        ? `${label} hızlı sonuç verdi; kaynak baskısı yarına taşındı.`
        : `${label} kaynak dengesini korudu; tempo sınırlı kaldı.`,
    ),
    impacts: [
      {
        key: 'resource',
        label: spent ? 'Kaynak baskısı arttı' : 'Kaynak dengede',
        tone: spent ? 'warning' : 'neutral',
      },
      {
        key: 'trust',
        label: resolveTrustDelta(decision) >= 0 ? 'Güven korundu' : 'Güven zayıfladı',
        tone: resolveTrustDelta(decision) >= 0 ? 'positive' : 'warning',
      },
    ],
    badge: spent ? 'Bedelli müdahale' : 'Dengeli harcama',
    badgeTone: spent ? 'mixed' : 'neutral',
  };
}

function buildOperationHighlight(
  decision: DecisionRecord,
  cityReaction?: PostDecisionCityReactionPresentation | null,
): HighlightCandidate {
  const label = decision.decisionLabel ?? 'Saha müdahalesi';
  const lower = label.toLowerCase();
  let styleTag: string | null = null;
  if (lower.includes('hızlı') || lower.includes('acil')) {
    styleTag = 'Hızlı müdahale çizgisi';
  } else if (lower.includes('plan') || lower.includes('önley')) {
    styleTag = 'Önleyici plan çizgisi';
  }

  const sentence = cityReaction?.headline
    ? clampLine(cityReaction.headline)
    : clampLine(`${label} günün ana operasyon sonucunu belirledi.`);

  return {
    score: 25,
    sentence,
    impacts: [
      {
        key: 'operation',
        label: 'Operasyon sonucu netleşti',
        tone: 'neutral',
      },
      {
        key: 'field',
        label: cityReaction?.tone === 'positive' ? 'Saha etkisi güçlü' : 'Saha etkisi karma',
        tone: cityReaction?.tone === 'positive' ? 'positive' : 'neutral',
      },
    ],
    badge: 'Günün ana kararı',
    badgeTone: cityReaction?.tone === 'warning' ? 'warning' : 'positive',
    styleTag,
  };
}

function selectDailyHighlight(input: BuildDecisionStoryInput): HighlightCandidate | null {
  const decision =
    input.criticalDecision ??
    input.decisionsToday[input.decisionsToday.length - 1] ??
    null;
  if (!decision) return null;

  const trust = buildTrustHighlight(decision, input.cityReaction);
  const resource = buildResourceHighlight(decision);
  const operation = buildOperationHighlight(decision, input.cityReaction);

  const candidates = [trust, resource, operation];
  const best = candidates.sort((a, b) => b.score - a.score)[0];

  if (input.managementStyleLine) {
    const style = input.managementStyleLine.split('.')[0]?.trim();
    if (style && style.length <= 28) {
      best.styleTag = best.styleTag ?? style;
    }
  }

  return best;
}

export function buildEndOfDayDecisionStoryPresentation(
  input: BuildDecisionStoryInput,
): EndOfDayDecisionStoryPresentation {
  const avoid = input.avoidLines ?? [];
  const highlight = selectDailyHighlight(input);
  const decision =
    input.criticalDecision ??
    input.decisionsToday[input.decisionsToday.length - 1] ??
    null;

  if (!highlight || !decision) {
    if (input.day === 1) {
      return {
        visible: true,
        decisionSentence: 'İlk kararın şehirde iz bıraktı; etkisini yarın birlikte izleyeceğiz.',
        impactLines: [
          { key: 'trust', label: 'Güven izlendi', tone: 'neutral' },
          { key: 'learn', label: 'Öğretici kapanış', tone: 'positive' },
        ],
        outcomeBadge: 'İlk gün',
        outcomeBadgeTone: 'positive',
        playerStyleTag: null,
        decisionLabel: decision?.decisionLabel ?? null,
        districtName: decision?.neighborhoodName ?? null,
      };
    }
    return {
      visible: true,
      decisionSentence: clampLine(
        input.decisionImpactLine ??
          'Bugünkü operasyon temposu şehrin nabzını şekillendirdi; etki yarına taşınabilir.',
      ),
      impactLines: [
        { key: 'city', label: 'Şehir nabzı izlendi', tone: 'neutral' },
        { key: 'carry', label: 'Etki yarına taşınabilir', tone: 'warning' },
      ],
      outcomeBadge: 'Gün özeti',
      outcomeBadgeTone: 'neutral',
      playerStyleTag: null,
      decisionLabel: null,
      districtName: null,
    };
  }

  let sentence = highlight.sentence;
  if (input.decisionImpactLine && !lineDuplicatesAvoid(input.decisionImpactLine, [sentence])) {
    sentence = clampLine(input.decisionImpactLine);
  }
  if (lineDuplicatesAvoid(sentence, avoid)) {
    sentence = highlight.sentence;
  }

  return {
    visible: true,
    decisionSentence: sentence,
    impactLines: highlight.impacts.slice(0, 2),
    outcomeBadge: highlight.badge,
    outcomeBadgeTone: highlight.badgeTone,
    playerStyleTag: input.day >= 8 ? highlight.styleTag ?? null : null,
    decisionLabel: decision.decisionLabel ?? null,
    districtName: decision.neighborhoodName ?? null,
  };
}
