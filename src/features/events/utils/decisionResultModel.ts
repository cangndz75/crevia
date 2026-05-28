import { createId } from '@/core/game/createId';
import { isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import { selectNeighborhoodContainerStatus } from '@/core/containers/containerSelectors';
import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { CityState } from '@/core/models/CityState';
import type {
  PersonnelDayAssignment,
  PersonnelState,
} from '@/core/personnel/personnelTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type {
  DecisionMetricChange,
  DecisionMetricKey,
  DecisionResultSnapshot,
  DecisionResultSummaryTone,
  DecisionResultTone,
  DecisionSubsystemOutcome,
} from '@/features/events/types/decisionResultTypes';

export type DecisionResultCitySlice = Pick<
  CityState,
  'publicSatisfaction' | 'budget' | 'morale' | 'riskScore'
>;

export type BuildDecisionResultSnapshotParams = {
  day: number;
  event: EventCard;
  decision: EventDecision;
  neighborhoodName?: string;
  gameStateBefore: DecisionResultCitySlice;
  gameStateAfter: DecisionResultCitySlice;
  personnelStateBefore: PersonnelState;
  personnelStateAfter: PersonnelState;
  containerStateBefore: ContainerState;
  containerStateAfter: ContainerState;
  vehicleStateBefore: VehicleState;
  vehicleStateAfter: VehicleState;
  socialPulseStateBefore: SocialPulseState;
  socialPulseStateAfter: SocialPulseState;
  personnelAssignment?: PersonnelDayAssignment | null;
};

const METRIC_LABELS: Record<DecisionMetricKey, string> = {
  publicSatisfaction: 'Halk Memnuniyeti',
  budget: 'Bütçe',
  personnelMorale: 'Personel Morali',
  operationRisk: 'Operasyon Riski',
};

const SUMMARY_TITLES: Record<DecisionResultSummaryTone, string[]> = {
  positive: [
    'Müdahale sahada karşılık buldu',
    'Karar kısa vadede rahatlama sağladı',
  ],
  mixed: [
    'Sonuç dengeli ama izleme gerekiyor',
    'Sorun hafifledi, yeni baskılar oluştu',
  ],
  negative: [
    'Karar beklenenden daha riskli sonuçlandı',
    'Operasyon baskısı arttı',
  ],
  neutral: ['Karar kayda alındı', 'Etkiler sınırlı kaldı'],
};

function pickDeterministic<T>(items: readonly T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) | 0;
  }
  return items[Math.abs(hash) % items.length]!;
}

function metricDirection(delta: number): 'up' | 'down' | 'flat' {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

function isMetricChangeGood(key: DecisionMetricKey, delta: number): boolean {
  if (delta === 0) return true;
  if (key === 'operationRisk') return delta < 0;
  return delta > 0;
}

function roundMetric(value: number, key: DecisionMetricKey): number {
  if (key === 'budget') return Math.round(value);
  return Math.round(value);
}

export function buildMetricChanges(
  before: DecisionResultCitySlice,
  after: DecisionResultCitySlice,
): DecisionMetricChange[] {
  const pairs: Array<{
    key: DecisionMetricKey;
    beforeVal: number;
    afterVal: number;
  }> = [
    {
      key: 'publicSatisfaction',
      beforeVal: before.publicSatisfaction,
      afterVal: after.publicSatisfaction,
    },
    { key: 'budget', beforeVal: before.budget, afterVal: after.budget },
    {
      key: 'personnelMorale',
      beforeVal: before.morale,
      afterVal: after.morale,
    },
    {
      key: 'operationRisk',
      beforeVal: before.riskScore,
      afterVal: after.riskScore,
    },
  ];

  return pairs.map(({ key, beforeVal, afterVal }) => {
    const delta = roundMetric(afterVal - beforeVal, key);
    return {
      key,
      label: METRIC_LABELS[key],
      before: roundMetric(beforeVal, key),
      after: roundMetric(afterVal, key),
      delta,
      direction: metricDirection(delta),
      isGood: isMetricChangeGood(key, delta),
    };
  });
}

export function inferDecisionTone(decision: EventDecision): DecisionResultTone {
  const pilot = decision.decisionStyle;
  if (pilot === 'resource_saving') return 'resource_saving';
  if (pilot === 'communication') return 'supportive';
  if (pilot === 'risk') return 'risky';
  if (pilot === 'fast') return 'bold';

  switch (decision.style) {
    case 'cautious':
      return 'safe';
    case 'balanced':
      return 'balanced';
    case 'bold':
      return 'bold';
    case 'risky':
      return 'risky';
    default:
      return 'unknown';
  }
}

export type InferResultToneContext = {
  decision?: EventDecision;
  dailyPriorityImpact?: {
    tone: 'supportive' | 'balanced' | 'risky' | 'neutral';
    scoreDelta?: number;
  };
  hasButterflyHint?: boolean;
};

function decisionStyleKey(decision?: EventDecision): string | undefined {
  return decision?.decisionStyle ?? decision?.style;
}

function isMeaningfulBadMetric(m: DecisionMetricChange): boolean {
  if (m.isGood || m.delta === 0) return false;
  if (m.key === 'budget' && m.delta > -1500) return false;
  if (m.key === 'operationRisk' && m.delta < 4) return false;
  if (m.key === 'personnelMorale' && m.delta > -4) return false;
  if (m.key === 'publicSatisfaction' && m.delta > -3) return false;
  return true;
}

function isSoftPersonnelWarning(outcome: DecisionSubsystemOutcome): boolean {
  if (outcome.key !== 'personnel' || outcome.status !== 'warning') {
    return false;
  }
  const text = outcome.primaryText.toLowerCase();
  return (
    text.includes('kısmen') ||
    text.includes('yorgunluk') ||
    text.includes('sınırlı kaldı')
  );
}

function hasMeaningfulSubsystemWarning(
  outcomes: DecisionSubsystemOutcome[],
): boolean {
  return outcomes.some(
    (o) =>
      o.status === 'critical' ||
      (o.status === 'warning' && !isSoftPersonnelWarning(o)),
  );
}

function computeToneScore(
  metricChanges: DecisionMetricChange[],
  subsystemOutcomes: DecisionSubsystemOutcome[],
  context?: InferResultToneContext,
): number {
  let score = 0;

  for (const m of metricChanges) {
    if (m.delta === 0) continue;
    const weight =
      m.key === 'operationRisk' ? 3 : m.key === 'publicSatisfaction' ? 2 : 1;
    score += (m.isGood ? 1 : -1) * weight;
  }

  for (const o of subsystemOutcomes) {
    if (o.status === 'critical') score -= 5;
    else if (o.status === 'warning') score -= 2;
    else if (o.status === 'good') score += 2;
  }

  const style = decisionStyleKey(context?.decision);
  if (style === 'fast' || style === 'bold') score += 1;
  if (style === 'planned' || style === 'resource_saving') score -= 1;
  if (style === 'risk') score -= 2;

  if (context?.dailyPriorityImpact?.tone === 'supportive') score += 2;
  if (context?.dailyPriorityImpact?.tone === 'risky') score -= 3;
  if (context?.hasButterflyHint) score -= 1;

  return score;
}

export function inferResultTone(
  metricChanges: DecisionMetricChange[],
  subsystemOutcomes: DecisionSubsystemOutcome[],
  context?: InferResultToneContext,
): DecisionResultSummaryTone {
  const hasCritical = subsystemOutcomes.some((o) => o.status === 'critical');
  const hasWarning = hasMeaningfulSubsystemWarning(subsystemOutcomes);

  const goodDeltas = metricChanges.filter((m) => m.delta !== 0 && m.isGood).length;
  const badDeltas = metricChanges.filter((m) => isMeaningfulBadMetric(m)).length;

  const satisfaction = metricChanges.find((m) => m.key === 'publicSatisfaction');
  const risk = metricChanges.find((m) => m.key === 'operationRisk');
  const morale = metricChanges.find((m) => m.key === 'personnelMorale');
  const budget = metricChanges.find((m) => m.key === 'budget');

  const style = decisionStyleKey(context?.decision);

  if (context?.dailyPriorityImpact?.tone === 'risky' && (badDeltas > 0 || hasWarning)) {
    return hasCritical ? 'negative' : 'mixed';
  }

  if (hasCritical || (risk && risk.delta >= 8) || (morale && morale.delta <= -10)) {
    return 'negative';
  }

  if (
    satisfaction &&
    satisfaction.delta <= -5 &&
    (badDeltas > 0 || hasWarning)
  ) {
    return 'negative';
  }

  if (style === 'permanent') {
    const satUp = satisfaction && satisfaction.delta > 0;
    const budgetDown = budget && budget.delta < 0;
    if (satUp && !hasCritical) {
      return hasWarning || budgetDown ? 'mixed' : 'positive';
    }
  }

  const toneScore = computeToneScore(metricChanges, subsystemOutcomes, context);

  if (style === 'fast' && goodDeltas > 0) {
    if (badDeltas > 0 || hasWarning) {
      if (toneScore >= 3 && !hasCritical) return 'positive';
      return 'mixed';
    }
    if (!hasCritical) return 'positive';
  }

  if (
    (style === 'planned' || style === 'resource_saving') &&
    metricChanges.every((m) => Math.abs(m.delta) <= 4) &&
    !hasCritical
  ) {
    if (goodDeltas === 0 && badDeltas === 0 && !hasWarning) return 'neutral';
    if (toneScore <= 0 && !hasWarning && badDeltas === 0) return 'neutral';
    if (hasWarning || badDeltas > 0) return toneScore >= 2 ? 'mixed' : 'neutral';
  }

  if (
    context?.dailyPriorityImpact?.tone === 'supportive' &&
    goodDeltas > 0 &&
    !hasCritical
  ) {
    if (badDeltas > 0 || hasWarning) return 'mixed';
    return 'positive';
  }

  if (
    goodDeltas >= 2 &&
    badDeltas === 0 &&
    !hasCritical &&
    !hasWarning &&
    satisfaction &&
    satisfaction.delta > 0
  ) {
    return 'positive';
  }

  if (goodDeltas > 0 && badDeltas > 0) {
    if (toneScore >= 4 && !hasCritical) return 'positive';
    return 'mixed';
  }

  if (goodDeltas > 0 && hasWarning && !hasCritical) {
    if (toneScore >= 4) return 'positive';
    if (toneScore <= -2) return 'negative';
    return 'mixed';
  }

  if (goodDeltas > 0 && badDeltas === 0 && !hasWarning && !hasCritical) {
    return toneScore >= 2 ? 'positive' : 'mixed';
  }

  if (
    metricChanges.every((m) => Math.abs(m.delta) <= 2) &&
    subsystemOutcomes.every(
      (o) => o.status === 'neutral' || isSoftPersonnelWarning(o),
    ) &&
    !hasWarning &&
    !hasCritical
  ) {
    return 'neutral';
  }

  if (metricChanges.every((m) => m.delta === 0) && subsystemOutcomes.length === 0) {
    return 'neutral';
  }

  if (badDeltas > 0) {
    if (toneScore <= -4 || hasCritical) return 'negative';
    return 'mixed';
  }

  if (toneScore >= 4) return 'positive';
  if (toneScore <= -4) return 'negative';
  if (toneScore <= -1 && hasWarning) return 'mixed';
  if (toneScore >= 2) return 'positive';
  if (toneScore >= 1) return 'mixed';

  return 'neutral';
}

function buildSummaryText(
  resultTone: DecisionResultSummaryTone,
  decision: EventDecision,
  metricChanges: DecisionMetricChange[],
  outcomes: DecisionSubsystemOutcome[],
  seed: string,
): string {
  if (decision.resultText?.trim()) {
    return decision.resultText.trim();
  }

  const social = outcomes.find((o) => o.key === 'social');
  const personnel = outcomes.find((o) => o.key === 'personnel');
  const satisfaction = metricChanges.find((m) => m.key === 'publicSatisfaction');
  const risk = metricChanges.find((m) => m.key === 'operationRisk');

  if (resultTone === 'positive') {
    if (satisfaction && satisfaction.delta > 0) {
      return 'Seçilen müdahale mahalledeki baskıyı azalttı; saha geri bildirimi olumlu.';
    }
    return 'Operasyon kısa vadede toparlandı, ekipler görevi sürdürebildi.';
  }

  if (resultTone === 'negative') {
    if (risk && risk.delta > 0) {
      return 'Karar uygulandı ancak operasyon riski yükseldi; takip önerilir.';
    }
    return 'Müdahale beklenen rahatlamayı sağlamadı, baskı devam ediyor.';
  }

  if (resultTone === 'mixed') {
    if (personnel?.status === 'warning' && social) {
      return 'Operasyon kısa vadede toparlandı fakat sosyal gündem tamamen kapanmadı.';
    }
    return 'Seçilen müdahale mahalledeki baskıyı azalttı, ancak ekip yorgunluğu takip edilmeli.';
  }

  return pickDeterministic(
    [
      'Karar operasyon kaydına işlendi; etkiler sınırlı kaldı.',
      'Saha müdahalesi tamamlandı, belirgin metrik kayması görülmedi.',
    ],
    seed,
  );
}

function buildHighlightAndRiskLines(
  metricChanges: DecisionMetricChange[],
  outcomes: DecisionSubsystemOutcome[],
): { highlights: string[]; risks: string[] } {
  const highlights: string[] = [];
  const risks: string[] = [];

  for (const m of metricChanges) {
    if (m.delta === 0) continue;
    if (m.isGood) {
      highlights.push(`${m.label} ${m.delta > 0 ? '+' : ''}${m.delta}`);
    } else {
      risks.push(`${m.label} ${m.delta > 0 ? '+' : ''}${m.delta}`);
    }
  }

  for (const o of outcomes) {
    if (o.status === 'good') {
      highlights.push(o.primaryText);
    } else if (o.status === 'warning' || o.status === 'critical') {
      risks.push(o.primaryText);
    }
  }

  return {
    highlights: highlights.slice(0, 2),
    risks: risks.slice(0, 2),
  };
}

function buildNextSuggestion(
  event: EventCard,
  outcomes: DecisionSubsystemOutcome[],
  resultTone: DecisionResultSummaryTone,
): string | undefined {
  const container = outcomes.find((o) => o.key === 'container');
  const social = outcomes.find((o) => o.key === 'social');
  const neighborhood = event.district?.trim();

  if (container?.status === 'warning' || container?.status === 'critical') {
    const where = neighborhood ? `${neighborhood} haritasındaki` : 'bölgedeki';
    return `Öneri: Gün bitmeden ${where} taşma riskini kontrol et.`;
  }

  if (social?.status === 'warning' && neighborhood) {
    return `Öneri: ${neighborhood} için sosyal nabzı gün içinde tekrar kontrol et.`;
  }

  if (resultTone === 'negative' && neighborhood) {
    return `Öneri: ${neighborhood} operasyonunu haritadan izlemeye devam et.`;
  }

  return undefined;
}

function maxTeamFatigue(state: PersonnelState): number {
  if (!state.teams?.length) return 0;
  return Math.max(...state.teams.map((t) => t.fatigue ?? 0));
}

function avgTeamMorale(state: PersonnelState): number {
  if (!state.teams?.length) return 0;
  const sum = state.teams.reduce((acc, t) => acc + (t.morale ?? 0), 0);
  return sum / state.teams.length;
}

export function buildPersonnelOutcome(
  params: BuildDecisionResultSnapshotParams,
): DecisionSubsystemOutcome | null {
  const {
    day,
    event,
    personnelStateBefore,
    personnelStateAfter,
    personnelAssignment,
  } = params;

  const incidentsBefore = personnelStateBefore.dayIncidents?.length ?? 0;
  const incidentsAfter = personnelStateAfter.dayIncidents?.length ?? 0;
  const newIncidents = personnelStateAfter.dayIncidents?.slice(incidentsBefore) ?? [];

  const fatigueBefore = maxTeamFatigue(personnelStateBefore);
  const fatigueAfter = maxTeamFatigue(personnelStateAfter);
  const moraleBefore = avgTeamMorale(personnelStateBefore);
  const moraleAfter = avgTeamMorale(personnelStateAfter);

  const assignment =
    personnelAssignment ??
    personnelStateAfter.dayAssignments?.find(
      (a) => a.day === day && a.eventId === event.id,
    ) ??
    null;

  if (!assignment && fatigueAfter - fatigueBefore < 2 && moraleAfter - moraleBefore > -2) {
    if (incidentsAfter === incidentsBefore) {
      return {
        key: 'personnel',
        title: 'Personel',
        status: 'neutral',
        primaryText: 'Personel etkisi oluşmadı.',
        iconName: 'people-outline',
      };
    }
  }

  const team = personnelStateAfter.teams.find((t) => t.id === assignment?.teamId);
  const teamName = team?.name ?? 'Saha ekibi';

  if (newIncidents.length > 0) {
    const line = newIncidents[0]?.reportLine ?? 'Kısa süreli aksaklık riski oluştu.';
    return {
      key: 'personnel',
      title: 'Personel',
      status: 'warning',
      primaryText: `${teamName}: ${line}`,
      secondaryText:
        fatigueAfter > fatigueBefore
          ? 'Yorgunluk seviyesi arttı.'
          : undefined,
      iconName: 'people-outline',
    };
  }

  if (assignment) {
    const outcomeLabel =
      assignment.outcome === 'success'
        ? 'görevi tamamladı'
        : assignment.outcome === 'partial'
          ? 'görevi kısmen tamamladı'
          : 'görevde zorlandı';

    const status =
      assignment.outcome === 'success'
        ? 'good'
        : assignment.outcome === 'failed'
          ? 'critical'
          : 'warning';

    return {
      key: 'personnel',
      title: 'Personel',
      status,
      primaryText: `${teamName} ${outcomeLabel}.`,
      secondaryText:
        fatigueAfter > fatigueBefore + 3
          ? 'Ekip yorgunluğu arttı, dinlenme planı düşünülmeli.'
          : moraleAfter < moraleBefore - 2
            ? 'Moral hafif geriledi.'
            : undefined,
      iconName: 'people-outline',
    };
  }

  if (fatigueAfter > fatigueBefore + 4) {
    return {
      key: 'personnel',
      title: 'Personel',
      status: 'warning',
      primaryText: 'Ekip yorgunluğu arttı, dinlenme ihtiyacı izlenmeli.',
      iconName: 'people-outline',
    };
  }

  return {
    key: 'personnel',
    title: 'Personel',
    status: 'neutral',
    primaryText: 'Ekip dinlenmede olduğu için personel etkisi sınırlı kaldı.',
    iconName: 'people-outline',
  };
}

export function buildContainerOutcome(
  params: BuildDecisionResultSnapshotParams,
): DecisionSubsystemOutcome | null {
  const { event, containerStateBefore, containerStateAfter } = params;

  if (
    !isContainerRelevantEvent({
      id: event.id,
      title: event.title,
      category: event.category,
      eventType: event.eventType,
      neighborhoodId: event.neighborhoodId,
      tags: event.filterTags,
    })
  ) {
    return null;
  }

  const neighborhoodId = normalizeContainerNeighborhoodId(
    event.neighborhoodId ?? event.district,
  );
  if (!neighborhoodId) {
    return null;
  }

  const before = selectNeighborhoodContainerStatus(
    containerStateBefore,
    neighborhoodId,
  );
  const after = selectNeighborhoodContainerStatus(
    containerStateAfter,
    neighborhoodId,
  );

  if (!before && !after) {
    return null;
  }

  const fillDelta =
    (after?.averageFillRate ?? 0) - (before?.averageFillRate ?? 0);
  const odorDelta = (after?.odorPressure ?? 0) - (before?.odorPressure ?? 0);
  const maintDelta =
    (after?.maintenancePressure ?? 0) - (before?.maintenancePressure ?? 0);

  if (
    Math.abs(fillDelta) < 1 &&
    Math.abs(odorDelta) < 2 &&
    Math.abs(maintDelta) < 2
  ) {
    return null;
  }

  const displayName = event.district?.trim() || neighborhoodId;

  if (fillDelta <= -3 || odorDelta <= -3) {
    return {
      key: 'container',
      title: 'Konteyner',
      status: 'good',
      primaryText: `${displayName}'de doluluk baskısı azaldı.`,
      secondaryText:
        maintDelta > 2 ? 'Bakım ihtiyacı hâlâ izlenmeli.' : undefined,
      iconName: 'trash-outline',
    };
  }

  const criticalBefore = before?.criticalContainerCount ?? 0;
  const criticalAfter = after?.criticalContainerCount ?? 0;

  if (fillDelta >= 4 || odorDelta >= 4 || criticalAfter > criticalBefore) {
    return {
      key: 'container',
      title: 'Konteyner',
      status: criticalAfter > criticalBefore ? 'critical' : 'warning',
      primaryText: `${displayName}'de toplama gecikmesi riski devam ediyor.`,
      secondaryText: after?.statusLabel
        ? `Durum: ${after.statusLabel}`
        : undefined,
      iconName: 'trash-outline',
    };
  }

  return {
    key: 'container',
    title: 'Konteyner',
    status: 'neutral',
    primaryText: 'Konteyner operasyonu güncellendi.',
    iconName: 'trash-outline',
  };
}

export function buildVehicleOutcome(
  params: BuildDecisionResultSnapshotParams,
): DecisionSubsystemOutcome | null {
  const { day, event, vehicleStateBefore, vehicleStateAfter } = params;

  const workloadDelta =
    vehicleStateAfter.aggregates.averageWorkload -
    vehicleStateBefore.aggregates.averageWorkload;
  const riskDelta =
    vehicleStateAfter.aggregates.averageBreakdownRisk -
    vehicleStateBefore.aggregates.averageBreakdownRisk;
  const assignedAfter = vehicleStateAfter.units.filter(
    (u) => u.assignedEventId === event.id && u.lastAssignedDay === day,
  );

  if (
    Math.abs(workloadDelta) < 2 &&
    Math.abs(riskDelta) < 2 &&
    assignedAfter.length === 0
  ) {
    return null;
  }

  const primaryUnit = assignedAfter[0];
  const unitLabel = primaryUnit?.name ?? 'Filo aracı';

  if (primaryUnit) {
    return {
      key: 'vehicle',
      title: 'Araç Filosu',
      status: primaryUnit.breakdownRisk >= 55 ? 'warning' : 'good',
      primaryText: `${unitLabel} yoğun kullanıldı.`,
      secondaryText:
        workloadDelta >= 5
          ? 'Rota yükü arttı, bakım ihtiyacı izlenmeli.'
          : undefined,
      iconName: 'car-outline',
    };
  }

  if (riskDelta >= 5) {
    return {
      key: 'vehicle',
      title: 'Araç Filosu',
      status: 'warning',
      primaryText: 'Araç arıza riski yükseldi.',
      secondaryText: 'Rota planı gözden geçirilmeli.',
      iconName: 'car-outline',
    };
  }

  if (workloadDelta <= -3) {
    return {
      key: 'vehicle',
      title: 'Araç Filosu',
      status: 'good',
      primaryText: 'Filo yükü hafifledi.',
      iconName: 'car-outline',
    };
  }

  return null;
}

function pickTodaySocialOutcome(
  state: SocialPulseState,
  day: number,
): { title: string; description: string; pulseDelta: number } | null {
  const history = Array.isArray(state.outcomeHistory) ? state.outcomeHistory : [];
  const today = history.filter((e) => e?.createdDay === day);
  if (today.length === 0) return null;
  const entry = today[today.length - 1]!;
  return {
    title: entry.title,
    description: entry.description,
    pulseDelta: entry.pulseDelta,
  };
}

export function buildSocialOutcome(
  params: BuildDecisionResultSnapshotParams,
): DecisionSubsystemOutcome | null {
  const { day, socialPulseStateBefore, socialPulseStateAfter } = params;

  const scoreBefore = socialPulseStateBefore.globalPulseScore;
  const scoreAfter = socialPulseStateAfter.globalPulseScore;
  const delta = scoreAfter - scoreBefore;
  const todayOutcome = pickTodaySocialOutcome(socialPulseStateAfter, day);

  if (!todayOutcome && Math.abs(delta) < 2) {
    return null;
  }

  if (todayOutcome) {
    const improved = todayOutcome.pulseDelta > 0 || delta > 0;
    return {
      key: 'social',
      title: 'Sosyal Nabız',
      status: improved ? 'good' : todayOutcome.pulseDelta < 0 ? 'warning' : 'neutral',
      primaryText:
        todayOutcome.pulseDelta > 0
          ? 'Şikayet ısısı hafifledi.'
          : todayOutcome.pulseDelta < 0
            ? 'Sosyal gündem sakinleşmedi, takip öneriliyor.'
            : todayOutcome.description,
      secondaryText: todayOutcome.title,
      iconName: 'chatbubbles-outline',
    };
  }

  if (delta >= 3) {
    return {
      key: 'social',
      title: 'Sosyal Nabız',
      status: 'good',
      primaryText: `Sosyal nabız ${scoreBefore} → ${scoreAfter} seviyesine çıktı.`,
      iconName: 'chatbubbles-outline',
    };
  }

  if (delta <= -3) {
    return {
      key: 'social',
      title: 'Sosyal Nabız',
      status: 'warning',
      primaryText: 'Sosyal baskı arttı, kamuoyu takibi önerilir.',
      iconName: 'chatbubbles-outline',
    };
  }

  return null;
}

export function buildSubsystemOutcomes(
  params: BuildDecisionResultSnapshotParams,
): DecisionSubsystemOutcome[] {
  const outcomes: DecisionSubsystemOutcome[] = [];

  const personnel = buildPersonnelOutcome(params);
  if (personnel) outcomes.push(personnel);

  const container = buildContainerOutcome(params);
  if (container) outcomes.push(container);

  const vehicle = buildVehicleOutcome(params);
  if (vehicle) outcomes.push(vehicle);

  const social = buildSocialOutcome(params);
  if (social) outcomes.push(social);

  if (outcomes.length === 0) {
    outcomes.push({
      key: 'personnel',
      title: 'Operasyon',
      status: 'neutral',
      primaryText: 'Operasyon kaydı oluşturuldu.',
      iconName: 'document-text-outline',
    });
  }

  return outcomes;
}

export function buildDecisionSummary(
  resultTone: DecisionResultSummaryTone,
  decision: EventDecision,
  metricChanges: DecisionMetricChange[],
  subsystemOutcomes: DecisionSubsystemOutcome[],
  seed: string,
): { summaryTitle: string; summaryText: string } {
  return {
    summaryTitle: pickDeterministic(SUMMARY_TITLES[resultTone], seed),
    summaryText: buildSummaryText(
      resultTone,
      decision,
      metricChanges,
      subsystemOutcomes,
      seed,
    ),
  };
}

export function buildDecisionResultSnapshot(
  params: BuildDecisionResultSnapshotParams,
): DecisionResultSnapshot {
  const { day, event, decision, neighborhoodName } = params;
  const seed = `${event.id}:${decision.id}:${day}`;

  const metricChanges = buildMetricChanges(
    params.gameStateBefore,
    params.gameStateAfter,
  );
  const subsystemOutcomes = buildSubsystemOutcomes(params);
  const resultTone = inferResultTone(metricChanges, subsystemOutcomes, {
    decision,
  });
  const { summaryTitle, summaryText } = buildDecisionSummary(
    resultTone,
    decision,
    metricChanges,
    subsystemOutcomes,
    seed,
  );
  const { highlights, risks } = buildHighlightAndRiskLines(
    metricChanges,
    subsystemOutcomes,
  );

  return {
    id: createId('decision_result'),
    day,
    eventId: event.id,
    eventTitle: event.title,
    eventType: event.eventType,
    neighborhoodId: event.neighborhoodId,
    neighborhoodName: neighborhoodName ?? event.district,
    decisionId: decision.id,
    decisionTitle: decision.title,
    decisionTone: inferDecisionTone(decision),
    createdAt: Date.now(),
    summaryTitle,
    summaryText,
    resultTone,
    metricChanges,
    subsystemOutcomes,
    highlightLines: highlights,
    riskLines: risks,
    nextSuggestion: buildNextSuggestion(event, subsystemOutcomes, resultTone),
  };
}

export function buildDecisionResultCitySlice(
  city: CityState,
): DecisionResultCitySlice {
  return {
    publicSatisfaction: city.publicSatisfaction,
    budget: city.budget,
    morale: city.morale,
    riskScore: city.riskScore,
  };
}

export function createEmptyDecisionResultFallback(): DecisionResultSnapshot {
  return {
    id: 'missing',
    day: 1,
    eventId: '',
    eventTitle: '',
    decisionId: '',
    decisionTitle: '',
    decisionTone: 'unknown',
    createdAt: 0,
    summaryTitle: 'Son karar sonucu bulunamadı',
    summaryText: 'Bu oturumda kayıtlı bir karar sonucu yok.',
    resultTone: 'neutral',
    metricChanges: [],
    subsystemOutcomes: [],
    highlightLines: [],
    riskLines: [],
  };
}
