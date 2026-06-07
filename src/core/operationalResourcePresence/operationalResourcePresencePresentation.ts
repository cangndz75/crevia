import type {
  OperationalResourcePresenceDetailCard,
  OperationalResourcePresenceHubPresentation,
  OperationalResourcePresenceLiteInput,
  OperationalResourcePresenceLiteModel,
} from './operationalResourcePresenceTypes';
import {
  isOperationalResourcePresenceDuplicate,
  shouldShowOperationalResourcePresenceLite,
} from './operationalResourcePresenceModel';
import {
  OPERATIONAL_RESOURCE_PRESENCE_LITE_DETAIL_MAX_LINES,
  OPERATIONAL_RESOURCE_PRESENCE_LITE_HUB_MAX_LINES,
  TEAM_GROUP_STATUS_LABELS,
  VEHICLE_GROUP_STATUS_LABELS,
} from './operationalResourcePresenceConstants';

function toneFromPriority(
  priority: 'low' | 'medium' | 'high',
): OperationalResourcePresenceDetailCard['tone'] {
  if (priority === 'high') return 'warning';
  if (priority === 'medium') return 'neutral';
  return 'positive';
}

export function buildOperationalResourcePresenceHubPresentation(
  model: OperationalResourcePresenceLiteModel | null | undefined,
  existingLines: string[] = [],
): OperationalResourcePresenceHubPresentation | null {
  if (!shouldShowOperationalResourcePresenceLite(model)) return null;

  const guard = [...existingLines];
  let summaryLine = model!.hubLine ?? model!.primaryPressureLine;
  if (isOperationalResourcePresenceDuplicate(summaryLine, guard)) {
    summaryLine = model!.primaryPressureLine;
  }
  guard.push(summaryLine);

  let secondaryLine: string | undefined;
  const alt =
    model!.vehicleGroups[0]?.line !== summaryLine
      ? model!.vehicleGroups[0]?.line
      : model!.teamGroups[0]?.line;
  if (alt && !isOperationalResourcePresenceDuplicate(alt, guard)) {
    secondaryLine = alt;
  }

  const vehiclePressure = model!.vehicleGroups.some((v) => v.priority === 'high');
  const teamPressure = model!.teamGroups.some((t) => t.priority === 'high');
  const containerPressure = model!.sourceSignals.containerPressure;

  let defaultTab: OperationalResourcePresenceHubPresentation['defaultTab'] = 'personnel';
  if (vehiclePressure && !teamPressure) defaultTab = 'vehicles';
  else if (containerPressure && !vehiclePressure && !teamPressure) defaultTab = 'containers';
  else if (vehiclePressure && teamPressure) {
    defaultTab =
      model!.vehicleGroups[0]?.priority === 'high' ? 'vehicles' : 'personnel';
  }

  return {
    summaryLine,
    secondaryLine:
      model!.visibility === 'compact'
        ? undefined
        : secondaryLine,
    defaultTab,
  };
}

export function buildOperationalResourcePresenceDetailTeamCards(
  model: OperationalResourcePresenceLiteModel | null | undefined,
): OperationalResourcePresenceDetailCard[] {
  if (!shouldShowOperationalResourcePresenceLite(model)) return [];

  return model!.teamGroups.map((group) => ({
    id: group.id,
    label: group.label,
    statusLabel: TEAM_GROUP_STATUS_LABELS[group.status],
    lines: [group.line, group.detailLine].filter(Boolean).slice(0, OPERATIONAL_RESOURCE_PRESENCE_LITE_DETAIL_MAX_LINES) as string[],
    iconKey: group.iconKey,
    tone: toneFromPriority(group.priority),
  }));
}

export function buildOperationalResourcePresenceDetailVehicleCards(
  model: OperationalResourcePresenceLiteModel | null | undefined,
): OperationalResourcePresenceDetailCard[] {
  if (!shouldShowOperationalResourcePresenceLite(model)) return [];

  return model!.vehicleGroups.map((group) => ({
    id: group.id,
    label: group.label,
    statusLabel: VEHICLE_GROUP_STATUS_LABELS[group.status],
    lines: [group.line, group.detailLine].filter(Boolean).slice(0, OPERATIONAL_RESOURCE_PRESENCE_LITE_DETAIL_MAX_LINES) as string[],
    iconKey: group.iconKey,
    tone: toneFromPriority(group.priority),
  }));
}

export function buildOperationalResourcePresenceMapLine(
  model: OperationalResourcePresenceLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!shouldShowOperationalResourcePresenceLite(model) || (model!.day ?? 1) <= 2) return null;
  const line = model!.mapPresenceLine;
  if (!line || isOperationalResourcePresenceDuplicate(line, existingLines)) return null;
  return line;
}

export function buildOperationalResourcePresenceReportLine(
  model: OperationalResourcePresenceLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!shouldShowOperationalResourcePresenceLite(model) || (model!.day ?? 1) <= 3) return null;
  const line = model!.reportLine;
  if (!line || isOperationalResourcePresenceDuplicate(line, existingLines)) return null;
  return line;
}

export function buildOperationalResourcePresenceDecisionImpactHint(
  model: OperationalResourcePresenceLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!model) return null;
  const vehicle = model.vehicleGroups.find(
    (v) => v.status === 'fatigue_watch' || v.status === 'route_pressure',
  );
  if (!vehicle) return null;
  const line = `Rota önceliği saha hattını rahatlattı, fakat ${vehicle.label.toLocaleLowerCase('tr-TR')} izleme notu bıraktı.`;
  if (isOperationalResourcePresenceDuplicate(line, existingLines)) return null;
  return line;
}

export function buildOperationalResourcePresenceTomorrowRiskHint(
  model: OperationalResourcePresenceLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!model || model.day < 4) return null;
  const district = model.vehicleGroups[0]?.districtFocus ?? model.teamGroups[0]?.districtFocus;
  if (!district) return null;
  const line = `Yarın ${district}'de araç temposu tekrar izlenebilir.`;
  if (isOperationalResourcePresenceDuplicate(line, existingLines)) return null;
  return line;
}

export function buildOperationalResourcePresenceCityEchoHint(
  model: OperationalResourcePresenceLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!model?.eceLine) return null;
  if (isOperationalResourcePresenceDuplicate(model.eceLine, existingLines)) return null;
  return model.eceLine;
}

export function buildOperationalResourcePresenceLiteInputFromEngine(params: {
  day: number;
  isPostPilot?: boolean;
  accessMode?: 'none' | 'limited' | 'full';
  operationalResources: unknown;
  operationSignals: OperationalResourcePresenceLiteInput['operationSignals'];
  contentPackMeta?: OperationalResourcePresenceLiteInput['contentPackMeta'];
  decisionImpact?: OperationalResourcePresenceLiteInput['decisionImpact'];
  tomorrowRisk?: OperationalResourcePresenceLiteInput['tomorrowRisk'];
  cityEcho?: OperationalResourcePresenceLiteInput['cityEcho'];
  existingLines?: string[];
  focusDistrictId?: string | null;
  resourceFatigueSummaryLine?: string | null;
  mapResourceOverlayLine?: string | null;
}): OperationalResourcePresenceLiteInput {
  return {
    day: params.day,
    isPostPilot: params.isPostPilot,
    accessMode: params.accessMode,
    operationalResources: params.operationalResources as OperationalResourcePresenceLiteInput['operationalResources'],
    operationSignals: params.operationSignals,
    contentPackMeta: params.contentPackMeta,
    decisionImpact: params.decisionImpact,
    tomorrowRisk: params.tomorrowRisk,
    cityEcho: params.cityEcho,
    existingLines: params.existingLines,
    focusDistrictId: params.focusDistrictId,
    resourceFatigueSummaryLine: params.resourceFatigueSummaryLine,
    mapResourceOverlayLine: params.mapResourceOverlayLine,
  };
}

export function collectOperationalResourcePresenceHubLines(
  model: OperationalResourcePresenceLiteModel | null | undefined,
): string[] {
  const presentation = buildOperationalResourcePresenceHubPresentation(model, []);
  if (!presentation) return [];
  return [presentation.summaryLine, presentation.secondaryLine ?? ''].filter(Boolean).slice(
    0,
    OPERATIONAL_RESOURCE_PRESENCE_LITE_HUB_MAX_LINES,
  );
}
