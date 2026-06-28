import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type {
  DecisionMetricChange,
  DecisionResultSnapshot,
  DecisionResultSummaryTone,
  DecisionSubsystemOutcome,
} from '@/features/events/types/decisionResultTypes';

export type CityReactionTone = 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';

export type CityReactionImpact = {
  id: 'public' | 'resource' | 'risk';
  label: string;
  valueText: string;
  tone: CityReactionTone;
  line: string;
};

export type CityReactionEcho = {
  id: string;
  title: string;
  statusLabel: string;
  tone: CityReactionTone;
  line: string;
};

export type PostDecisionCityReactionPresentation = {
  reactionId: string;
  eventId: string;
  districtId?: string;
  districtName: string;
  tone: CityReactionTone;
  headline: string;
  shortSummary: string;
  mapReaction: string;
  socialEcho: {
    sourceLabel: string;
    line: string;
    tone: CityReactionTone;
  };
  resourceEchoes: CityReactionEcho[];
  impactItems: CityReactionImpact[];
  advisorNote: string;
  recentImpactCard: {
    title: string;
    subtitle: string;
    chips: Array<{ id: string; label: string; valueText: string; tone: CityReactionTone }>;
  };
  reportMemoryLine: string;
  nextRiskHint: string;
};

type MetricLike = Pick<DecisionMetricChange, 'key' | 'delta' | 'isGood'>;

type BuildFromRecordInput = {
  record: DecisionRecord;
  day?: number;
};

function clampLine(value: string, limit = 118): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function districtName(input?: string | null): string {
  return input?.trim() || 'Merkez';
}

function toneFromResult(
  tone: DecisionResultSummaryTone,
  outcomes: DecisionSubsystemOutcome[] = [],
): CityReactionTone {
  if (outcomes.some((outcome) => outcome.status === 'critical')) return 'critical';
  if (tone === 'positive') return 'positive';
  if (tone === 'mixed') return 'mixed';
  if (tone === 'negative') return 'warning';
  return 'neutral';
}

function toneFromDelta(metric: MetricLike | undefined): CityReactionTone {
  if (!metric || metric.delta === 0) return 'neutral';
  if (metric.isGood) return 'positive';
  return Math.abs(metric.delta) >= 6 ? 'warning' : 'mixed';
}

function findMetric(
  metrics: DecisionMetricChange[],
  key: DecisionMetricChange['key'],
): DecisionMetricChange | undefined {
  return metrics.find((metric) => metric.key === key);
}

function formatDelta(delta: number | undefined, fallback: string): string {
  if (!delta) return fallback;
  return `${delta > 0 ? '+' : ''}${Math.round(delta)}`;
}

function buildHeadline(tone: CityReactionTone, district: string): string {
  switch (tone) {
    case 'positive':
      return `${district} karara olumlu tepki verdi`;
    case 'mixed':
      return `${district} rahatladı, baskı tamamen bitmedi`;
    case 'warning':
      return `${district} üzerinde yeni baskı oluştu`;
    case 'critical':
      return `${district} kritik izleme gerektiriyor`;
    default:
      return `${district} kararı kayda aldı`;
  }
}

function buildSocialEcho(
  district: string,
  tone: CityReactionTone,
): PostDecisionCityReactionPresentation['socialEcho'] {
  if (tone === 'positive') {
    return {
      sourceLabel: 'Vatandaş yorumu',
      line: `${district} hızlı müdahaleyi olumlu karşıladı.`,
      tone,
    };
  }
  if (tone === 'warning' || tone === 'critical') {
    return {
      sourceLabel: 'Mahalle gündemi',
      line: `${district} çevresinde beklenti ve sosyal baskı yükseldi.`,
      tone,
    };
  }
  if (tone === 'mixed') {
    return {
      sourceLabel: 'Saha geri bildirimi',
      line: `${district} güven toparladı ama operasyon baskısı sürüyor.`,
      tone,
    };
  }
  return {
    sourceLabel: 'Basın notu',
    line: `${district} kararı sakin bir etkiyle karşıladı.`,
    tone: 'neutral',
  };
}

function buildImpactItems(
  snapshot: DecisionResultSnapshot,
): CityReactionImpact[] {
  const publicMetric = findMetric(snapshot.metricChanges, 'publicSatisfaction');
  const budgetMetric = findMetric(snapshot.metricChanges, 'budget');
  const moraleMetric = findMetric(snapshot.metricChanges, 'personnelMorale');
  const riskMetric = findMetric(snapshot.metricChanges, 'operationRisk');
  const resourceMetric =
    budgetMetric && budgetMetric.delta !== 0 ? budgetMetric : moraleMetric;

  return [
    {
      id: 'public',
      label: 'Halk / güven',
      valueText: formatDelta(publicMetric?.delta, 'Dengeli'),
      tone: toneFromDelta(publicMetric),
      line:
        publicMetric && publicMetric.delta > 0
          ? 'Mahalle güveni toparlandı.'
          : publicMetric && publicMetric.delta < 0
            ? 'Güven artışı sınırlı kaldı.'
            : 'Kamu tepkisi dengeli seyrediyor.',
    },
    {
      id: 'resource',
      label: 'Kaynak / ekip',
      valueText: formatDelta(resourceMetric?.delta, 'İzle'),
      tone: toneFromDelta(resourceMetric),
      line:
        budgetMetric && budgetMetric.delta < 0
          ? 'Bütçe baskısı yarına taşınabilir.'
          : moraleMetric && moraleMetric.delta < 0
            ? 'Ekip yorgunluğu izlenmeli.'
            : 'Kaynak etkisi kontrol altında.',
    },
    {
      id: 'risk',
      label: 'Risk / baskı',
      valueText: formatDelta(riskMetric?.delta, 'Sabit'),
      tone: toneFromDelta(riskMetric),
      line:
        riskMetric && riskMetric.delta < 0
          ? 'Operasyon riski geriledi.'
          : riskMetric && riskMetric.delta > 0
            ? 'Operasyon baskısı arttı.'
            : 'Risk seviyesi değişmedi.',
    },
  ];
}

function systemName(key: DecisionSubsystemOutcome['key'] | 'economy' | 'district'): string {
  switch (key) {
    case 'personnel':
      return 'Ekip';
    case 'vehicle':
      return 'Araç';
    case 'container':
      return 'Konteyner';
    case 'social':
      return 'Sosyal nabız';
    case 'economy':
      return 'Ekonomi';
    default:
      return 'Mahalle';
  }
}

function echoTone(status: DecisionSubsystemOutcome['status']): CityReactionTone {
  if (status === 'good') return 'positive';
  if (status === 'critical') return 'critical';
  if (status === 'warning') return 'warning';
  return 'neutral';
}

function buildResourceEchoes(snapshot: DecisionResultSnapshot): CityReactionEcho[] {
  const echoes: CityReactionEcho[] = snapshot.subsystemOutcomes.slice(0, 5).map((outcome) => ({
    id: outcome.key,
    title: systemName(outcome.key),
    statusLabel:
      outcome.status === 'good'
        ? 'Rahatladı'
        : outcome.status === 'critical'
          ? 'Kritik'
          : outcome.status === 'warning'
            ? 'İzle'
            : 'Dengeli',
    tone: echoTone(outcome.status),
    line: clampLine(outcome.primaryText, 92),
  }));

  const budget = findMetric(snapshot.metricChanges, 'budget');
  if (budget && Math.abs(budget.delta) > 0 && echoes.length < 6) {
    echoes.push({
      id: 'economy',
      title: systemName('economy'),
      statusLabel: budget.delta < 0 ? 'Baskı' : 'Rahat',
      tone: budget.delta < 0 ? 'warning' : 'positive',
      line:
        budget.delta < 0
          ? 'Bütçe baskısı rapora not edildi.'
          : 'Ekonomi tarafında kısa vadeli rahatlama var.',
    });
  }

  if (echoes.length < 6) {
    echoes.push({
      id: 'district-memory',
      title: systemName('district'),
      statusLabel: 'Hafıza',
      tone: snapshot.resultTone === 'positive' ? 'positive' : 'neutral',
      line: `${districtName(snapshot.neighborhoodName)} bu kararı şehir hafızasına ekledi.`,
    });
  }

  return echoes.slice(0, 6);
}

function pickRiskHint(snapshot: DecisionResultSnapshot, tone: CityReactionTone): string {
  const riskLine = snapshot.riskLines[0]?.trim();
  if (riskLine) return clampLine(riskLine, 110);
  const riskMetric = findMetric(snapshot.metricChanges, 'operationRisk');
  const moraleMetric = findMetric(snapshot.metricChanges, 'personnelMorale');
  if (riskMetric && riskMetric.delta > 0) return 'Risk düşmedi; yarın aynı bölge izlenmeli.';
  if (moraleMetric && moraleMetric.delta < 0) return 'Ekip yorgunluğu yarın kapasiteyi zorlayabilir.';
  if (tone === 'positive') return 'Olumlu etki kalıcı olsun diye bölge nabzı izlenmeli.';
  return 'Yarınki ilk kontrolde bu kararın izi tekrar okunmalı.';
}

export function buildPostDecisionCityReactionPresentation(
  snapshot: DecisionResultSnapshot | null | undefined,
): PostDecisionCityReactionPresentation | null {
  if (!snapshot?.eventId) return null;

  const district = districtName(snapshot.neighborhoodName);
  const tone = toneFromResult(snapshot.resultTone, snapshot.subsystemOutcomes);
  const impactItems = buildImpactItems(snapshot);
  const socialEcho = buildSocialEcho(district, tone);
  const nextRiskHint = pickRiskHint(snapshot, tone);
  const strongestImpact =
    impactItems.find((item) => item.tone === 'positive' || item.tone === 'warning') ??
    impactItems[0];

  return {
    reactionId: `city-reaction-${snapshot.eventId}-${snapshot.decisionId}`,
    eventId: snapshot.eventId,
    districtId: snapshot.neighborhoodId,
    districtName: district,
    tone,
    headline: buildHeadline(tone, district),
    shortSummary: clampLine(snapshot.summaryText || snapshot.summaryTitle, 116),
    mapReaction:
      tone === 'positive'
        ? `${district} çevresinde güven toparlandı.`
        : tone === 'warning' || tone === 'critical'
          ? `${district} çevresinde risk halkası görünür kaldı.`
          : `${district} çevresinde karar izi kayda geçti.`,
    socialEcho,
    resourceEchoes: buildResourceEchoes(snapshot),
    impactItems,
    advisorNote:
      tone === 'positive'
        ? 'Bu karar güveni hızlı toparladı; yine de kaynak baskısını raporda kontrol etmek gerekir.'
        : tone === 'warning' || tone === 'critical'
          ? 'Karar sahayı kapattı ama yarına taşınan baskı var. Önceliği erken kontrol etmek iyi olur.'
          : 'Dengeli karar şehirde panik yaratmadan etki bıraktı. Yarın sinyali tekrar okuyalım.',
    recentImpactCard: {
      title: snapshot.decisionTitle || snapshot.eventTitle,
      subtitle: `${district} · ${socialEcho.line}`,
      chips: impactItems.slice(0, 2).map((item) => ({
        id: item.id,
        label: item.label.replace(/ \/ .*/, ''),
        valueText: item.valueText,
        tone: item.tone,
      })),
    },
    reportMemoryLine: clampLine(
      `${district} ${strongestImpact.line.toLocaleLowerCase('tr-TR')} ${nextRiskHint}`,
      142,
    ),
    nextRiskHint,
  };
}

export function buildPostDecisionCityReactionFromRecord({
  record,
}: BuildFromRecordInput): PostDecisionCityReactionPresentation | null {
  if (!record?.eventId) return null;
  const district = districtName(record.neighborhoodName ?? record.neighborhoodId);
  const publicDelta = record.appliedEffects.publicSatisfaction ?? record.appliedEffects.trust ?? 0;
  const riskDelta = record.appliedEffects.risk ?? 0;
  const budgetDelta = record.appliedEffects.budget ?? -(record.appliedCosts?.budget ?? 0);
  const moraleDelta = record.appliedEffects.staffMorale ?? -(record.appliedCosts?.morale ?? 0);
  const tone: CityReactionTone =
    riskDelta < 0 || publicDelta > 0
      ? budgetDelta < -2500 || moraleDelta < -4
        ? 'mixed'
        : 'positive'
      : riskDelta > 0 || publicDelta < 0
        ? 'warning'
        : 'neutral';

  const socialEcho = buildSocialEcho(district, tone);
  const budgetChip = budgetDelta
    ? { id: 'budget', label: 'Bütçe', valueText: formatDelta(budgetDelta, 'Sabit'), tone }
    : { id: 'risk', label: 'Risk', valueText: formatDelta(riskDelta, 'Sabit'), tone };
  const trustChip = {
    id: 'trust',
    label: 'Güven',
    valueText: formatDelta(publicDelta, 'Dengeli'),
    tone: publicDelta > 0 ? 'positive' : publicDelta < 0 ? 'warning' : 'neutral',
  } satisfies PostDecisionCityReactionPresentation['recentImpactCard']['chips'][number];

  const headline = buildHeadline(tone, district);
  const nextRiskHint =
    moraleDelta < 0
      ? 'Ekip yorgunluğu yarın kapasiteyi zorlayabilir.'
      : riskDelta > 0
        ? 'Risk düşmedi; yarın aynı bölge izlenmeli.'
        : 'Yarınki ilk kontrolde bu kararın izi tekrar okunmalı.';

  return {
    reactionId: `city-reaction-record-${record.id}`,
    eventId: record.eventId,
    districtId: record.neighborhoodId,
    districtName: district,
    tone,
    headline,
    shortSummary: `${record.decisionLabel} kararı ${district} üzerinde görünür iz bıraktı.`,
    mapReaction:
      tone === 'positive'
        ? `${district} çevresinde güven toparlandı.`
        : tone === 'warning'
          ? `${district} çevresinde operasyon baskısı sürüyor.`
          : `${district} çevresinde karar izi kayda geçti.`,
    socialEcho,
    resourceEchoes: [
      {
        id: 'social',
        title: 'Sosyal nabız',
        statusLabel: tone === 'warning' ? 'İzle' : 'Yankı',
        tone,
        line: socialEcho.line,
      },
      {
        id: 'economy',
        title: 'Ekonomi',
        statusLabel: budgetDelta < 0 ? 'Baskı' : 'Dengeli',
        tone: budgetDelta < 0 ? 'warning' : 'neutral',
        line:
          budgetDelta < 0
            ? 'Bütçe baskısı rapora taşındı.'
            : 'Ekonomi etkisi kontrol altında kaldı.',
      },
    ],
    impactItems: [
      {
        id: 'public',
        label: 'Halk / güven',
        valueText: formatDelta(publicDelta, 'Dengeli'),
        tone: trustChip.tone,
        line: publicDelta > 0 ? 'Mahalle güveni toparlandı.' : 'Kamu tepkisi izleniyor.',
      },
      {
        id: 'resource',
        label: 'Kaynak / ekip',
        valueText: formatDelta(budgetDelta || moraleDelta, 'İzle'),
        tone: budgetDelta < 0 || moraleDelta < 0 ? 'warning' : 'neutral',
        line: budgetDelta < 0 || moraleDelta < 0 ? 'Kaynak baskısı izlenmeli.' : 'Kaynak etkisi dengeli.',
      },
      {
        id: 'risk',
        label: 'Risk / baskı',
        valueText: formatDelta(riskDelta, 'Sabit'),
        tone: riskDelta < 0 ? 'positive' : riskDelta > 0 ? 'warning' : 'neutral',
        line: riskDelta < 0 ? 'Operasyon riski geriledi.' : 'Risk seviyesi izleniyor.',
      },
    ],
    advisorNote:
      tone === 'positive'
        ? 'Bu karar güveni hızlı toparladı ama kaynak etkisini yarın tekrar okuyalım.'
        : 'Kararın izi var; sosyal tepki ve kaynak baskısını raporda izlemek gerekir.',
    recentImpactCard: {
      title: record.decisionLabel || record.eventTitle,
      subtitle: `${district} · ${socialEcho.line}`,
      chips: [trustChip, budgetChip],
    },
    reportMemoryLine: `${headline}. ${nextRiskHint}`,
    nextRiskHint,
  };
}
