import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import type { EventDecision } from '@/core/models/EventCard';
import {
  DEFAULT_NEIGHBORHOOD_ID,
  NEIGHBORHOOD_IDENTITIES,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityConstants';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import {
  DOMAIN_LABELS,
  SIGNAL_COPY,
  SIGNAL_STATUS_LABELS,
} from './operationSignalConstants';
import {
  buildOperationImpactPreviewForDecision,
  buildOperationImpactPreviewForEvent,
  buildOperationSignalsEngineInputFromStore,
  deriveOperationSignalsFromGameState,
} from './operationSignalEngine';
import { getSignalStatus } from './operationSignalState';
import type {
  OperationImpactPreviewModel,
  OperationSignalDomain,
  OperationSignalStatus,
  OperationSignalsEngineInput,
  OperationSignalsHubModel,
  OperationSignalsHubRow,
  OperationSignalsReportModel,
  OperationSignalsState,
} from './operationSignalTypes';

export function getSignalStatusLabel(status: OperationSignalStatus): string {
  return SIGNAL_STATUS_LABELS[status];
}

export function getSignalStatusTone(
  status: OperationSignalStatus,
): 'positive' | 'neutral' | 'warning' | 'critical' {
  switch (status) {
    case 'stable':
      return 'positive';
    case 'watch':
      return 'neutral';
    case 'strained':
      return 'warning';
    case 'critical':
      return 'critical';
  }
}

export function getDomainIconKey(domain: OperationSignalDomain): string {
  switch (domain) {
    case 'personnel':
      return 'people';
    case 'vehicles':
      return 'car';
    case 'containers':
      return 'trash';
    case 'districts':
      return 'location';
    case 'overall':
      return 'pulse';
  }
}

function districtLine(priorityDistrictId: string): string {
  const id =
    normalizeNeighborhoodId(priorityDistrictId) ??
    DEFAULT_NEIGHBORHOOD_ID;
  const name = NEIGHBORHOOD_IDENTITIES[id]?.shortName ?? priorityDistrictId;
  return `Mahalle önceliği: ${name}`;
}

export function buildCompactSignalRows(
  state: OperationSignalsState,
): OperationSignalsHubRow[] {
  const domains: OperationSignalDomain[] = [
    'personnel',
    'vehicles',
    'containers',
    'districts',
  ];
  return domains.map((key) => {
    const signal = state[key];
    return {
      key,
      label: DOMAIN_LABELS[key],
      value: getSignalStatusLabel(signal.status),
      summary: signal.summary,
      tone: getSignalStatusTone(signal.status),
      iconKey: getDomainIconKey(key),
    };
  });
}

export function buildOperationSignalsHubModel(input: {
  engineInput: OperationSignalsEngineInput;
  compact?: boolean;
  postPilotLight?: boolean;
}): OperationSignalsHubModel {
  const signals = deriveOperationSignalsFromGameState(input.engineInput);
  const rows = buildCompactSignalRows(signals);
  const compact = input.compact === true;
  const visibleRows = compact ? rows.slice(0, 2) : rows;

  return {
    title: SIGNAL_COPY.hubTitle,
    subtitle: compact ? SIGNAL_COPY.hubSubtitle : SIGNAL_COPY.hubSubtitleLong,
    overallLabel: getSignalStatusLabel(signals.overall.status),
    overallTone: getSignalStatusTone(signals.overall.status),
    priorityLine: districtLine(signals.priorityDistrictId),
    rows: visibleRows,
    footerNote: compact
      ? SIGNAL_COPY.day1HubFooter
      : input.postPilotLight
        ? SIGNAL_COPY.postPilotReportLine
        : SIGNAL_COPY.hubFooter,
    compact,
  };
}

export function buildOperationSignalsReportModel(input: {
  engineInput: OperationSignalsEngineInput;
  report: DailyReport;
  postPilotLight?: boolean;
}): OperationSignalsReportModel {
  const signals = input.engineInput.operationSignals ??
    deriveOperationSignalsFromGameState(input.engineInput);

  if (input.engineInput.isDay1Tutorial) {
    return {
      title: SIGNAL_COPY.reportTitle,
      overallLabel: getSignalStatusLabel('watch'),
      overallTone: 'neutral',
      lines: [SIGNAL_COPY.day1ReportLine],
      footerNote: SIGNAL_COPY.reportFooter,
    };
  }

  if (input.postPilotLight) {
    return {
      title: SIGNAL_COPY.reportTitle,
      overallLabel: getSignalStatusLabel(signals.overall.status),
      overallTone: getSignalStatusTone(signals.overall.status),
      lines: [
        SIGNAL_COPY.postPilotReportLine,
        districtLine(signals.priorityDistrictId),
      ],
      footerNote: SIGNAL_COPY.reportFooter,
    };
  }

  const lines: string[] = [
    `Genel: ${getSignalStatusLabel(signals.overall.status)} — ${signals.overall.summary}`,
    `Personel: ${signals.personnel.summary}`,
    `Araç/Konteyner: ${signals.vehicles.summary} ${signals.containers.summary}`.slice(
      0,
      120,
    ),
    districtLine(signals.priorityDistrictId),
  ].slice(0, 3);

  return {
    title: SIGNAL_COPY.reportTitle,
    overallLabel: getSignalStatusLabel(signals.overall.status),
    overallTone: getSignalStatusTone(signals.overall.status),
    lines,
    footerNote: SIGNAL_COPY.reportFooter,
  };
}

export function buildOperationImpactPreviewModel(
  input: OperationSignalsEngineInput,
  event: EventCard,
  decision?: EventDecision,
): OperationImpactPreviewModel | null {
  if (input.isDay1Tutorial) {
    return null;
  }
  const preview = decision
    ? buildOperationImpactPreviewForDecision(input, event, decision)
    : buildOperationImpactPreviewForEvent(input, event);
  if (!preview.summary.trim()) {
    return null;
  }
  const maxAbs = Math.max(
    Math.abs(preview.personnelDelta),
    Math.abs(preview.vehicleDelta),
    Math.abs(preview.containerDelta),
    Math.abs(preview.districtDelta),
  );
  const tone =
    maxAbs >= 6 ? 'warning' : maxAbs >= 3 ? 'neutral' : 'positive';
  return {
    title: SIGNAL_COPY.impactTitle,
    summary: preview.summary,
    severityLabel: preview.severityLabel,
    tone,
  };
}

export function buildOperationSignalsEngineInput(
  state: Parameters<typeof buildOperationSignalsEngineInputFromStore>[0],
): OperationSignalsEngineInput {
  return buildOperationSignalsEngineInputFromStore(state);
}

export { deriveOperationSignalsFromGameState };
