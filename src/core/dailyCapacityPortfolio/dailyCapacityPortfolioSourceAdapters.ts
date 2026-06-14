import type {
  DailyCapacitySourceKind,
  OperationPortfolioConfidence,
  OperationPortfolioDeferRisk,
  OperationPortfolioItemKind,
  OperationPortfolioOpportunityValue,
  OperationPortfolioPressureLevel,
  OperationPortfolioUrgency,
} from './dailyCapacityPortfolioTypes';

export type PortfolioAdapterDraft = {
  id: string;
  kind: OperationPortfolioItemKind;
  title: string;
  subtitle?: string;
  districtId?: string;
  districtName?: string;
  pressureLevel: OperationPortfolioPressureLevel;
  urgency: OperationPortfolioUrgency;
  opportunityValue: OperationPortfolioOpportunityValue;
  deferRisk: OperationPortfolioDeferRisk;
  recommendedReason: string;
  selectBenefitLine?: string;
  mapLine?: string;
  sourceIds: string[];
  sourceKinds: DailyCapacitySourceKind[];
  confidence: OperationPortfolioConfidence;
  isActionable: boolean;
  isMapRecommended: boolean;
  isFollowUp: boolean;
  isSelectedCandidate: boolean;
  isWatchOnlyCandidate: boolean;
  isLockedCandidate: boolean;
  hasTomorrowRiskSource: boolean;
  hasTrustSource: boolean;
  hasResourceSource: boolean;
  hasRouteSource: boolean;
  hasSocialSource: boolean;
  hasOpportunitySource: boolean;
  hasMemorySource: boolean;
  districtCriterionHigh?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function criterionBand(
  profile: Record<string, unknown>,
  criterionId: string,
): 'low' | 'medium' | 'high' | undefined {
  const criteria = asArray(profile.criteria);
  for (const entry of criteria) {
    if (!isRecord(entry)) continue;
    if (asString(entry.id) !== criterionId) continue;
    const band = asString(entry.band);
    if (band === 'low' || band === 'medium' || band === 'high') return band;
  }
  return undefined;
}

function clampPriorityBase(score: number): OperationPortfolioPressureLevel {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function signalUrgency(status: string | undefined, score?: number): OperationPortfolioUrgency {
  if (status === 'critical') return 'high';
  if (status === 'strained') return 'medium';
  if (typeof score === 'number' && score >= 70) return 'high';
  if (typeof score === 'number' && score >= 45) return 'medium';
  return 'low';
}

export function adaptActiveEvents(
  day: number,
  activeEvents: unknown[] | undefined,
): PortfolioAdapterDraft[] {
  const events = asArray(activeEvents);
  if (events.length === 0) return [];

  const maxItems = day <= 1 ? 1 : events.length;
  const drafts: PortfolioAdapterDraft[] = [];

  for (const [index, raw] of events.slice(0, maxItems).entries()) {
    if (!isRecord(raw)) continue;
    const eventId = asString(raw.id) ?? `active_event_${index}`;
    const title = asString(raw.title) ?? 'Aktif operasyon';
    const districtName = asString(raw.district) ?? asString(raw.neighborhoodId);
    const districtId = asString(raw.neighborhoodId) ?? asString(raw.districtId);

    drafts.push({
      id: `portfolio_active_operation_${eventId}`,
      kind: 'active_operation',
      title,
      subtitle: districtName ? `${districtName} sahasi` : undefined,
      districtId,
      districtName,
      pressureLevel: 'medium',
      urgency: day <= 1 ? 'medium' : 'high',
      opportunityValue: 'none',
      deferRisk: 'none',
      recommendedReason: day <= 1 ? 'Gunun ana operasyonu.' : 'Aktif operasyon slotunu dolduruyor.',
      selectBenefitLine: 'Operasyonu bugun tamamlamak kapasiteyi netlestirir.',
      sourceIds: uniqueStrings([eventId, `active_event_day_${day}`]),
      sourceKinds: ['active_events'],
      confidence: 'high',
      isActionable: true,
      isMapRecommended: false,
      isFollowUp: false,
      isSelectedCandidate: true,
      isWatchOnlyCandidate: false,
      isLockedCandidate: false,
      hasTomorrowRiskSource: false,
      hasTrustSource: false,
      hasResourceSource: false,
      hasRouteSource: false,
      hasSocialSource: false,
      hasOpportunitySource: false,
      hasMemorySource: false,
    });
  }

  return drafts;
}

export function adaptOperationSignals(
  operationSignals: unknown,
): PortfolioAdapterDraft[] {
  if (!isRecord(operationSignals)) return [];

  const drafts: PortfolioAdapterDraft[] = [];
  const priorityDistrictId = asString(operationSignals.priorityDistrictId);
  const domains: Array<{
    key: string;
    kind: OperationPortfolioItemKind;
    hasRoute: boolean;
    hasSocial: boolean;
    hasResource: boolean;
  }> = [
    { key: 'vehicles', kind: 'route_pressure', hasRoute: true, hasSocial: false, hasResource: false },
    { key: 'containers', kind: 'container_pressure', hasRoute: false, hasSocial: false, hasResource: true },
    { key: 'districts', kind: 'district_pressure', hasRoute: false, hasSocial: false, hasResource: false },
    { key: 'personnel', kind: 'resource_pressure', hasRoute: false, hasSocial: false, hasResource: true },
    { key: 'overall', kind: 'risk_signal', hasRoute: false, hasSocial: false, hasResource: false },
  ];

  for (const domain of domains) {
    const signal = operationSignals[domain.key];
    if (!isRecord(signal)) continue;
    const status = asString(signal.status);
    const score = asNumber(signal.score) ?? 0;
    if (status === 'stable' && score < 45) continue;

    const title = asString(signal.title) ?? 'Operasyon sinyali';
    const summary = asString(signal.summary) ?? 'Saha sinyali izleniyor.';
    const urgency = signalUrgency(status, score);
    const watchOnly = status === 'watch' && score < 55;

    drafts.push({
      id: `portfolio_operation_signal_${domain.key}`,
      kind: domain.kind,
      title,
      subtitle: summary,
      districtId: priorityDistrictId,
      pressureLevel: clampPriorityBase(score),
      urgency,
      opportunityValue: 'none',
      deferRisk: 'none',
      recommendedReason: summary,
      sourceIds: uniqueStrings([
        `operation_signal_${domain.key}`,
        ...(asArray(signal.sourceTags).map((tag) => asString(tag) ?? '').filter(Boolean)),
      ]),
      sourceKinds: ['operation_signals'],
      confidence: status === 'critical' || status === 'strained' ? 'high' : 'medium',
      isActionable: !watchOnly,
      isMapRecommended: false,
      isFollowUp: false,
      isSelectedCandidate: false,
      isWatchOnlyCandidate: watchOnly,
      isLockedCandidate: false,
      hasTomorrowRiskSource: false,
      hasTrustSource: domain.key === 'districts',
      hasResourceSource: domain.hasResource,
      hasRouteSource: domain.hasRoute,
      hasSocialSource: domain.hasSocial,
      hasOpportunitySource: false,
      hasMemorySource: false,
    });
  }

  return drafts;
}

export function adaptDistrictPersonalityProfiles(
  profiles: unknown[] | undefined,
): PortfolioAdapterDraft[] {
  const drafts: PortfolioAdapterDraft[] = [];

  for (const raw of asArray(profiles)) {
    if (!isRecord(raw)) continue;
    const districtId = asString(raw.districtId) ?? asString(raw.id);
    if (!districtId) continue;
    const districtName = asString(raw.districtName) ?? asString(raw.name) ?? districtId;
    const sourceIds = uniqueStrings([
      districtId,
      ...(asArray(raw.sourceIds).map((id) => asString(id) ?? '').filter(Boolean)),
    ]);
    const sourceKinds: DailyCapacitySourceKind[] = ['district_personality'];
    const highCriteria: string[] = [];

    const pushDraft = (
      kind: OperationPortfolioItemKind,
      title: string,
      reason: string,
      flags: Partial<PortfolioAdapterDraft>,
    ) => {
      drafts.push({
        id: `portfolio_personality_${districtId}_${kind}`,
        kind,
        title,
        subtitle: districtName,
        districtId,
        districtName,
        pressureLevel: 'medium',
        urgency: 'medium',
        opportunityValue: kind.includes('opportunity') ? 'medium' : 'none',
        deferRisk: 'none',
        recommendedReason: reason,
        sourceIds,
        sourceKinds,
        confidence: sourceIds.length > 1 ? 'high' : 'medium',
        isActionable: kind !== 'memory_trace',
        isMapRecommended: false,
        isFollowUp: kind === 'follow_up_candidate' || kind === 'memory_trace',
        isSelectedCandidate: false,
        isWatchOnlyCandidate: false,
        isLockedCandidate: false,
        hasTomorrowRiskSource: false,
        hasTrustSource: kind === 'district_pressure' || kind === 'social_pressure',
        hasResourceSource: kind === 'resource_pressure' || kind === 'container_pressure',
        hasRouteSource: kind === 'route_pressure',
        hasSocialSource: kind === 'social_pressure',
        hasOpportunitySource: kind === 'recovery_opportunity' || kind === 'positive_opportunity',
        hasMemorySource: kind === 'memory_trace',
        districtCriterionHigh: highCriteria,
        ...flags,
      });
    };

    const social = criterionBand(raw, 'social_sensitivity');
    const route = criterionBand(raw, 'route_difficulty');
    const container = criterionBand(raw, 'container_density');
    const trust = criterionBand(raw, 'trust_fragility');
    const recovery = criterionBand(raw, 'recovery_potential');
    const neglect = criterionBand(raw, 'neglect_risk');
    const maintenance = criterionBand(raw, 'maintenance_exposure');
    const history = criterionBand(raw, 'operation_history_weight');

    if (social === 'high') {
      highCriteria.push('social_sensitivity');
      pushDraft('social_pressure', `${districtName} sosyal hassasiyet`, 'Mahalle tepkisi daha gorunur olabilir.', {
        pressureLevel: 'high',
        urgency: 'medium',
        hasSocialSource: true,
      });
    }
    if (route === 'high') {
      highCriteria.push('route_difficulty');
      pushDraft('route_pressure', `${districtName} rota baskisi`, 'Rota daralmasi operasyonu yavaslatabilir.', {
        hasRouteSource: true,
      });
    }
    if (container === 'high') {
      highCriteria.push('container_density');
      pushDraft('container_pressure', `${districtName} konteyner hatti`, 'Konteyner agi ek kaynak isteyebilir.', {
        hasResourceSource: true,
      });
    }
    if (trust === 'high') {
      highCriteria.push('trust_fragility');
      pushDraft('district_pressure', `${districtName} guven baskisi`, 'Guven etkisi daha hassas izlenmeli.', {
        hasTrustSource: true,
      });
    }
    if (recovery === 'high') {
      highCriteria.push('recovery_potential');
      pushDraft('recovery_opportunity', `${districtName} toparlanma firsati`, 'Iyilesme penceresi acik olabilir.', {
        opportunityValue: 'high',
        urgency: 'medium',
        hasOpportunitySource: true,
      });
    }
    if (neglect === 'high') {
      highCriteria.push('neglect_risk');
      pushDraft('follow_up_candidate', `${districtName} takip adayi`, 'Erteleme ihmal riskini buyutebilir.', {
        isFollowUp: true,
        urgency: 'medium',
      });
    }
    if (maintenance === 'high') {
      highCriteria.push('maintenance_exposure');
      pushDraft('maintenance_warning', `${districtName} bakim uyarisi`, 'Arac ve bakim baskisi gorunur.', {
        urgency: 'medium',
      });
    }
    if (history === 'high') {
      highCriteria.push('operation_history_weight');
      pushDraft('memory_trace', `${districtName} operasyon izi`, 'Onceki kararlarin etkisi suruyor.', {
        isFollowUp: true,
        isWatchOnlyCandidate: true,
        hasMemorySource: true,
        confidence: sourceIds.some((id) => id.includes('memory') || id.includes('archive'))
          ? 'high'
          : 'medium',
      });
    }
  }

  return drafts;
}

const PRESSURE_TO_KIND: Record<string, OperationPortfolioItemKind> = {
  route_pressure: 'route_pressure',
  social_sensitivity: 'social_pressure',
  resource_pressure: 'resource_pressure',
  vehicle_maintenance_pressure: 'maintenance_warning',
  container_network_pressure: 'container_pressure',
  opportunity_window: 'positive_opportunity',
  tomorrow_risk_pressure: 'risk_signal',
  district_trust_pressure: 'district_pressure',
};

export function adaptEventGameplayVarietyProfiles(
  profiles: unknown[] | undefined,
): PortfolioAdapterDraft[] {
  const drafts: PortfolioAdapterDraft[] = [];

  for (const raw of asArray(profiles)) {
    if (!isRecord(raw)) continue;
    const eventId = asString(raw.eventId);
    if (!eventId) continue;

    const primary = asString(raw.primaryPressure);
    const secondary = asArray(raw.secondaryPressures)
      .map((value) => asString(value))
      .filter((value): value is string => Boolean(value));
    const pressures = primary ? [primary, ...secondary] : secondary;

    const sourceIds = uniqueStrings([
      eventId,
      ...(asArray(raw.sourceIds).map((id) => asString(id) ?? '').filter(Boolean)),
    ]);

    for (const pressure of pressures) {
      const kind = PRESSURE_TO_KIND[pressure];
      if (!kind) continue;
      const line = asString(raw.playerFacingLine) ?? 'Event baskisi gorunur.';

      drafts.push({
        id: `portfolio_variety_${eventId}_${kind}`,
        kind,
        title: line.slice(0, 44),
        subtitle: asString(raw.sourceLabel),
        pressureLevel: 'medium',
        urgency: pressure === 'tomorrow_risk_pressure' ? 'medium' : 'low',
        opportunityValue: kind === 'positive_opportunity' || kind === 'recovery_opportunity' ? 'medium' : 'none',
        deferRisk: 'none',
        recommendedReason: asString(raw.planHintLine) ?? line,
        sourceIds,
        sourceKinds: ['event_gameplay_variety'],
        confidence: 'medium',
        isActionable: kind !== 'risk_signal',
        isMapRecommended: false,
        isFollowUp: false,
        isSelectedCandidate: false,
        isWatchOnlyCandidate: kind === 'risk_signal',
        isLockedCandidate: false,
        hasTomorrowRiskSource: pressure === 'tomorrow_risk_pressure',
        hasTrustSource: pressure === 'district_trust_pressure' || pressure === 'social_sensitivity',
        hasResourceSource: pressure === 'resource_pressure' || pressure === 'container_network_pressure',
        hasRouteSource: pressure === 'route_pressure',
        hasSocialSource: pressure === 'social_sensitivity',
        hasOpportunitySource: pressure === 'opportunity_window',
        hasMemorySource: false,
      });
    }
  }

  return drafts;
}

const MAP_ROLE_TO_KIND: Record<string, OperationPortfolioItemKind> = {
  operation_tracker: 'active_operation',
  risk_reader: 'district_pressure',
  resource_board: 'resource_pressure',
  route_support: 'route_pressure',
  district_memory: 'memory_trace',
  result_trace: 'follow_up_candidate',
};

export function adaptMapGameplayBindings(
  bindings: unknown[] | undefined,
): PortfolioAdapterDraft[] {
  const drafts: PortfolioAdapterDraft[] = [];

  for (const raw of asArray(bindings)) {
    if (!isRecord(raw)) continue;
    const bindingId = asString(raw.id);
    const role = asString(raw.role);
    if (!bindingId || !role) continue;
    if (asString(raw.visibilityLevel) === 'hidden') continue;

    const kind = MAP_ROLE_TO_KIND[role];
    if (!kind) continue;

    const sourceIds = uniqueStrings([
      bindingId,
      ...(asArray(raw.sourceIds).map((id) => asString(id) ?? '').filter(Boolean)),
    ]);
    const sourceKindsRaw = asArray(raw.sourceKinds).map((kind) => asString(kind) ?? '');
    if (sourceIds.length === 0 || sourceKindsRaw.includes('fallback')) continue;

    drafts.push({
      id: `portfolio_map_binding_${bindingId}`,
      kind,
      title: asString(raw.playerFacingTitle) ?? asString(raw.title) ?? 'Harita sinyali',
      subtitle: asString(raw.playerFacingLine) ?? asString(raw.summaryLine),
      mapLine: asString(raw.mapLine) ?? asString(raw.playerFacingLine),
      pressureLevel: 'medium',
      urgency: 'medium',
      opportunityValue: 'none',
      deferRisk: 'none',
      recommendedReason: asString(raw.supportedDecisionLine) ?? 'Harita bu sinyali oneriyor.',
      sourceIds,
      sourceKinds: ['map_gameplay_binding'],
      confidence: asString(raw.confidence) === 'high' ? 'high' : 'medium',
      isActionable: raw.isActionable === true,
      isMapRecommended: true,
      isFollowUp: kind === 'follow_up_candidate' || kind === 'memory_trace',
      isSelectedCandidate: false,
      isWatchOnlyCandidate: false,
      isLockedCandidate: false,
      hasTomorrowRiskSource: false,
      hasTrustSource: kind === 'district_pressure',
      hasResourceSource: kind === 'resource_pressure',
      hasRouteSource: kind === 'route_pressure',
      hasSocialSource: false,
      hasOpportunitySource: false,
      hasMemorySource: kind === 'memory_trace',
    });
  }

  return drafts;
}

export function adaptActiveOperationMapBindings(
  bindings: unknown[] | undefined,
): PortfolioAdapterDraft[] {
  const raw = asArray(bindings)[0];
  if (!isRecord(raw)) return [];
  if (asString(raw.visibilityLevel) === 'hidden') return [];

  const bindingId = asString(raw.id) ?? asString(raw.eventId) ?? 'active_operation_map';
  const sourceIds = uniqueStrings([
    bindingId,
    ...(asArray(raw.sourceIds).map((id) => asString(id) ?? '').filter(Boolean)),
  ]);
  if (sourceIds.length === 0) return [];

  const phase = asString(raw.phase);
  const kind: OperationPortfolioItemKind =
    phase === 'result_trace' ? 'follow_up_candidate' : 'active_operation';

  return [
    {
      id: `portfolio_active_map_${bindingId}`,
      kind,
      title: asString(raw.title) ?? 'Aktif operasyon haritada',
      subtitle: asString(raw.districtLine) ?? asString(raw.pressureLine),
      mapLine: asString(raw.mapLine),
      districtId: asString(raw.districtId),
      districtName: asString(raw.districtName),
      pressureLevel: 'medium',
      urgency: phase === 'dispatch_ready' ? 'high' : 'medium',
      opportunityValue: 'none',
      deferRisk: 'none',
      recommendedReason: asString(raw.focusLine) ?? 'Haritada aktif operasyon izleniyor.',
      sourceIds,
      sourceKinds: ['active_operation_map_binding'],
      confidence: 'high',
      isActionable: raw.isActionable !== false,
      isMapRecommended: true,
      isFollowUp: kind === 'follow_up_candidate',
      isSelectedCandidate: kind === 'active_operation',
      isWatchOnlyCandidate: false,
      isLockedCandidate: false,
      hasTomorrowRiskSource: false,
      hasTrustSource: false,
      hasResourceSource: false,
      hasRouteSource: Boolean(asString(raw.routeLine)),
      hasSocialSource: false,
      hasOpportunitySource: false,
      hasMemorySource: kind === 'follow_up_candidate',
    },
  ];
}

export function adaptTomorrowRiskSignals(
  tomorrowRiskSignals: unknown,
): PortfolioAdapterDraft[] {
  const risks = Array.isArray(tomorrowRiskSignals)
    ? tomorrowRiskSignals
    : isRecord(tomorrowRiskSignals)
      ? [tomorrowRiskSignals]
      : [];

  const drafts: PortfolioAdapterDraft[] = [];

  for (const raw of risks) {
    if (!isRecord(raw)) continue;
    const riskId = asString(raw.id);
    const title = asString(raw.title);
    const mainLine = asString(raw.mainLine);
    if (!riskId || !title || !mainLine) continue;

    const sourceSignals = asArray(raw.sourceSignals)
      .map((signal) => asString(signal) ?? '')
      .filter(Boolean);
    if (sourceSignals.includes('fallback') && sourceSignals.length === 1) continue;

    const domain = asString(raw.relatedDomain);
    const kind: OperationPortfolioItemKind =
      domain === 'route'
        ? 'route_pressure'
        : domain === 'social'
          ? 'social_pressure'
          : domain === 'resource' || domain === 'container'
            ? 'resource_pressure'
            : 'risk_signal';

    drafts.push({
      id: `portfolio_tomorrow_risk_${riskId}`,
      kind,
      title,
      subtitle: mainLine,
      districtId: asString(raw.relatedDistrictId),
      pressureLevel:
        asString(raw.priority) === 'high'
          ? 'high'
          : asString(raw.priority) === 'medium'
            ? 'medium'
            : 'low',
      urgency: asString(raw.priority) === 'high' ? 'high' : 'medium',
      opportunityValue: asString(raw.tone) === 'opportunity' ? 'medium' : 'none',
      deferRisk: 'none',
      recommendedReason: mainLine,
      sourceIds: uniqueStrings([riskId, ...sourceSignals.map((signal) => `tomorrow_${signal}`)]),
      sourceKinds: ['tomorrow_risk'],
      confidence: sourceSignals.length > 0 ? 'high' : 'medium',
      isActionable: true,
      isMapRecommended: false,
      isFollowUp: false,
      isSelectedCandidate: false,
      isWatchOnlyCandidate: false,
      isLockedCandidate: false,
      hasTomorrowRiskSource: true,
      hasTrustSource: domain === 'district' || domain === 'social',
      hasResourceSource: domain === 'resource' || domain === 'container',
      hasRouteSource: domain === 'route',
      hasSocialSource: domain === 'social',
      hasOpportunitySource: asString(raw.tone) === 'opportunity' || asString(raw.tone) === 'recovery',
      hasMemorySource: false,
    });
  }

  return drafts;
}

export function adaptDecisionConsequenceThreads(
  threads: unknown[] | undefined,
): PortfolioAdapterDraft[] {
  const drafts: PortfolioAdapterDraft[] = [];

  for (const raw of asArray(threads)) {
    if (!isRecord(raw)) continue;
    const threadId = asString(raw.id);
    const title = asString(raw.title);
    const summary = asString(raw.summary) ?? asString(raw.causalLine);
    if (!threadId || !title || !summary) continue;

    const consequenceType = asString(raw.consequenceType);
    const sourceIds = uniqueStrings([
      threadId,
      ...(asArray(raw.sourceIds).map((id) => asString(id) ?? '').filter(Boolean)),
    ]);
    if (sourceIds.length === 0) continue;

    const kind: OperationPortfolioItemKind =
      consequenceType === 'district_memory' || consequenceType === 'city_archive'
        ? 'memory_trace'
        : consequenceType === 'tomorrow_risk'
          ? 'risk_signal'
          : 'follow_up_candidate';

    drafts.push({
      id: `portfolio_consequence_${threadId}`,
      kind,
      title,
      subtitle: summary,
      pressureLevel: asString(raw.strength) === 'high' ? 'high' : 'medium',
      urgency: asString(raw.timeScope) === 'immediate' ? 'high' : 'medium',
      opportunityValue: 'none',
      deferRisk: 'none',
      recommendedReason: asString(raw.nextActionHint) ?? summary,
      sourceIds,
      sourceKinds: ['decision_consequence'],
      confidence: 'high',
      isActionable: kind === 'follow_up_candidate',
      isMapRecommended: false,
      isFollowUp: true,
      isSelectedCandidate: false,
      isWatchOnlyCandidate: kind === 'memory_trace',
      isLockedCandidate: false,
      hasTomorrowRiskSource: consequenceType === 'tomorrow_risk',
      hasTrustSource: consequenceType === 'social_echo',
      hasResourceSource: consequenceType === 'resource_pressure',
      hasRouteSource: false,
      hasSocialSource: consequenceType === 'social_echo',
      hasOpportunitySource: false,
      hasMemorySource:
        consequenceType === 'district_memory' ||
        consequenceType === 'city_archive' ||
        consequenceType === 'carry_over',
    });
  }

  return drafts;
}

function adaptGenericPressureSignal(
  raw: unknown,
  kind: OperationPortfolioItemKind,
  sourceKind: DailyCapacitySourceKind,
  idPrefix: string,
  titleFallback: string,
): PortfolioAdapterDraft | null {
  if (!isRecord(raw)) return null;
  const signalId = asString(raw.id) ?? idPrefix;
  const title = asString(raw.title) ?? asString(raw.summary) ?? titleFallback;
  const line = asString(raw.summary) ?? asString(raw.line) ?? title;
  const score = asNumber(raw.score);
  if (!title || score === undefined && !asString(raw.summary)) return null;

  return {
    id: `portfolio_${idPrefix}_${signalId}`,
    kind,
    title,
    subtitle: line,
    districtId: asString(raw.districtId) ?? asString(raw.relatedDistrictId),
    districtName: asString(raw.districtName),
    pressureLevel: clampPriorityBase(score ?? 50),
    urgency: signalUrgency(asString(raw.status), score),
    opportunityValue: 'none',
    deferRisk: 'none',
    recommendedReason: line,
    sourceIds: uniqueStrings([
      signalId,
      ...(asArray(raw.sourceIds).map((id) => asString(id) ?? '').filter(Boolean)),
    ]),
    sourceKinds: [sourceKind],
    confidence: score !== undefined ? 'high' : 'medium',
    isActionable: true,
    isMapRecommended: false,
    isFollowUp: false,
    isSelectedCandidate: false,
    isWatchOnlyCandidate: score !== undefined && score < 45,
    isLockedCandidate: false,
    hasTomorrowRiskSource: false,
    hasTrustSource: sourceKind === 'district_trust',
    hasResourceSource: sourceKind === 'resource_pressure',
    hasRouteSource: false,
    hasSocialSource: sourceKind === 'social_pulse',
    hasOpportunitySource: false,
    hasMemorySource: sourceKind === 'district_memory',
  };
}

export function adaptResourceSignals(resourceSignals: unknown): PortfolioAdapterDraft[] {
  const draft = adaptGenericPressureSignal(
    resourceSignals,
    'resource_pressure',
    'resource_pressure',
    'resource',
    'Kaynak baskisi',
  );
  return draft ? [draft] : [];
}

export function adaptVehicleMaintenanceSignals(
  vehicleMaintenanceSignals: unknown,
): PortfolioAdapterDraft[] {
  const draft = adaptGenericPressureSignal(
    vehicleMaintenanceSignals,
    'maintenance_warning',
    'vehicle_maintenance',
    'vehicle_maintenance',
    'Bakim uyarisi',
  );
  if (draft) {
    draft.hasRouteSource = true;
  }
  return draft ? [draft] : [];
}

export function adaptSocialPulseSignals(socialPulseSignals: unknown): PortfolioAdapterDraft[] {
  const draft = adaptGenericPressureSignal(
    socialPulseSignals,
    'social_pressure',
    'social_pulse',
    'social_pulse',
    'Sosyal tepki',
  );
  return draft ? [draft] : [];
}

export function adaptDistrictTrustSignals(districtTrustSignals: unknown): PortfolioAdapterDraft[] {
  const draft = adaptGenericPressureSignal(
    districtTrustSignals,
    'district_pressure',
    'district_trust',
    'district_trust',
    'Bolge guveni',
  );
  return draft ? [draft] : [];
}

export function adaptDistrictMemorySignals(districtMemorySignals: unknown): PortfolioAdapterDraft[] {
  const draft = adaptGenericPressureSignal(
    districtMemorySignals,
    'memory_trace',
    'district_memory',
    'district_memory',
    'Bolge hafizasi',
  );
  if (draft) {
    draft.isFollowUp = true;
    draft.isWatchOnlyCandidate = true;
    draft.hasMemorySource = true;
  }
  return draft ? [draft] : [];
}

export function adaptRewardComebackSignals(
  rewardComebackSignals: unknown,
): PortfolioAdapterDraft[] {
  if (!isRecord(rewardComebackSignals)) return [];
  const signalId = asString(rewardComebackSignals.id) ?? 'reward_comeback';
  const title = asString(rewardComebackSignals.title) ?? asString(rewardComebackSignals.summary);
  const line = asString(rewardComebackSignals.summary) ?? asString(rewardComebackSignals.line);
  if (!title || !line) return [];

  const tone = asString(rewardComebackSignals.tone);
  const kind: OperationPortfolioItemKind =
    tone === 'recovery' || tone === 'comeback' ? 'recovery_opportunity' : 'positive_opportunity';

  return [
    {
      id: `portfolio_reward_${signalId}`,
      kind,
      title,
      subtitle: line,
      districtId: asString(rewardComebackSignals.districtId),
      districtName: asString(rewardComebackSignals.districtName),
      pressureLevel: 'low',
      urgency: 'medium',
      opportunityValue: 'high',
      deferRisk: 'none',
      recommendedReason: line,
      sourceIds: uniqueStrings([
        signalId,
        ...(asArray(rewardComebackSignals.sourceIds)
          .map((id) => asString(id) ?? '')
          .filter(Boolean)),
      ]),
      sourceKinds: ['reward_comeback'],
      confidence: 'high',
      isActionable: true,
      isMapRecommended: false,
      isFollowUp: false,
      isSelectedCandidate: false,
      isWatchOnlyCandidate: false,
      isLockedCandidate: false,
      hasTomorrowRiskSource: false,
      hasTrustSource: false,
      hasResourceSource: false,
      hasRouteSource: false,
      hasSocialSource: false,
      hasOpportunitySource: true,
      hasMemorySource: false,
    },
  ];
}

export function adaptFallbackWatchItem(day: number): PortfolioAdapterDraft[] {
  if (day > 1) return [];
  return [
    {
      id: `portfolio_fallback_watch_day_${day}`,
      kind: 'risk_signal',
      title: 'Sehir sinyalleri izleniyor',
      subtitle: 'Kapasite tek operasyona odakli.',
      pressureLevel: 'low',
      urgency: 'low',
      opportunityValue: 'none',
      deferRisk: 'safe_to_watch',
      recommendedReason: 'Bugun tek operasyon yeterli; diger sinyaller izlemede.',
      sourceIds: [`fallback_watch_day_${day}`],
      sourceKinds: ['fallback'],
      confidence: 'low',
      isActionable: false,
      isMapRecommended: false,
      isFollowUp: false,
      isSelectedCandidate: false,
      isWatchOnlyCandidate: true,
      isLockedCandidate: false,
      hasTomorrowRiskSource: false,
      hasTrustSource: false,
      hasResourceSource: false,
      hasRouteSource: false,
      hasSocialSource: false,
      hasOpportunitySource: false,
      hasMemorySource: false,
    },
  ];
}

export function collectPortfolioDrafts(input: {
  day: number;
  activeEvents?: unknown[];
  operationSignals?: unknown;
  districtPersonalityProfiles?: unknown[];
  eventGameplayVarietyProfiles?: unknown[];
  mapGameplayBindings?: unknown[];
  activeOperationMapBindings?: unknown[];
  decisionConsequenceThreads?: unknown[];
  tomorrowRiskSignals?: unknown;
  resourceSignals?: unknown;
  vehicleMaintenanceSignals?: unknown;
  socialPulseSignals?: unknown;
  districtTrustSignals?: unknown;
  districtMemorySignals?: unknown;
  rewardComebackSignals?: unknown;
}): PortfolioAdapterDraft[] {
  const drafts = [
    ...adaptActiveEvents(input.day, input.activeEvents),
    ...adaptOperationSignals(input.operationSignals),
    ...adaptDistrictPersonalityProfiles(input.districtPersonalityProfiles),
    ...adaptEventGameplayVarietyProfiles(input.eventGameplayVarietyProfiles),
    ...adaptMapGameplayBindings(input.mapGameplayBindings),
    ...adaptActiveOperationMapBindings(input.activeOperationMapBindings),
    ...adaptTomorrowRiskSignals(input.tomorrowRiskSignals),
    ...adaptDecisionConsequenceThreads(input.decisionConsequenceThreads),
    ...adaptResourceSignals(input.resourceSignals),
    ...adaptVehicleMaintenanceSignals(input.vehicleMaintenanceSignals),
    ...adaptSocialPulseSignals(input.socialPulseSignals),
    ...adaptDistrictTrustSignals(input.districtTrustSignals),
    ...adaptDistrictMemorySignals(input.districtMemorySignals),
    ...adaptRewardComebackSignals(input.rewardComebackSignals),
  ];

  if (drafts.length === 0) {
    return adaptFallbackWatchItem(input.day);
  }

  return drafts;
}
