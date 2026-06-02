import {
  TEAM_SPECIALIZATION_CAPABILITY_LABELS,
  TEAM_SPECIALIZATION_FIT_LABELS,
  TEAM_SPECIALIZATION_FORBIDDEN_COPY_TERMS,
  TEAM_SPECIALIZATION_GROUP_LABELS,
  TEAM_SPECIALIZATION_MAX_VISIBLE_CHIPS,
  TEAM_SPECIALIZATION_STATUS_LABELS,
} from './teamSpecializationConstants';
import type {
  TeamSpecializationCapability,
  TeamSpecializationContext,
  TeamSpecializationFitLevel,
  TeamSpecializationFitResult,
  TeamSpecializationPresentationModel,
  TeamSpecializationStatus,
  TeamSpecializationTone,
} from './teamSpecializationTypes';

export type TeamSpecializationPresentationOptions = {
  compact?: boolean;
  surface?: 'assignment' | 'dispatch' | 'field' | 'district_operation' | 'report' | 'hub' | 'dev';
  includeRecommendation?: boolean;
};

export function teamSpecializationCopyContainsForbiddenTerms(text: string): string[] {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return TEAM_SPECIALIZATION_FORBIDDEN_COPY_TERMS.filter((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function buildTeamSpecializationFitLabel(fitLevel: TeamSpecializationFitLevel): string {
  return TEAM_SPECIALIZATION_FIT_LABELS[fitLevel];
}

export function buildTeamSpecializationStatusLabel(status: TeamSpecializationStatus): string {
  return TEAM_SPECIALIZATION_STATUS_LABELS[status];
}

export function buildTeamSpecializationCapabilityChips(
  result: TeamSpecializationFitResult,
): TeamSpecializationPresentationModel['capabilityChips'] {
  const capabilities =
    result.matchedCapabilities.length > 0
      ? result.matchedCapabilities
      : result.specialization.capabilities;

  return capabilities.slice(0, TEAM_SPECIALIZATION_MAX_VISIBLE_CHIPS).map((capability) => ({
    id: capability,
    label: TEAM_SPECIALIZATION_CAPABILITY_LABELS[capability],
    tone: result.tone,
    iconKey: result.specialization.iconKey,
  }));
}

export function buildTeamSpecializationCompactLine(
  result: TeamSpecializationFitResult,
): string {
  const groupLabel =
    TEAM_SPECIALIZATION_GROUP_LABELS[result.specialization.groupId] ??
    result.specialization.shortLabel;

  if (result.specialization.groupId === 'route_support_team') {
    return `${groupLabel} bu görevde güçlü uyum gösterir.`;
  }
  if (result.specialization.groupId === 'public_communication_team') {
    return `${groupLabel} sosyal güveni toparlamak için uygun.`;
  }
  if (result.specialization.groupId === 'technical_team') {
    return `${groupLabel} bakım ve konteyner ağı baskısını azaltabilir.`;
  }
  if (result.specialization.groupId === 'crisis_support_team') {
    return `${groupLabel} kriz eşiğinde koordinasyon desteği sağlar.`;
  }
  return `${groupLabel} saha uygulamasında dengeli uyum sunar.`;
}

export function buildTeamSpecializationWarningLine(
  result: TeamSpecializationFitResult,
): string | undefined {
  return result.pressureWarnings[0];
}

export function buildTeamSpecializationRecommendationLine(
  result: TeamSpecializationFitResult,
): string | undefined {
  const groupLabel =
    TEAM_SPECIALIZATION_GROUP_LABELS[result.specialization.groupId] ??
    result.specialization.shortLabel;

  if (result.sourceSignals.includes('district_trust') && result.specialization.groupId === 'public_communication_team') {
    return 'Mahalle güveni düşük olduğu için Halk İletişim Ekibi daha uygun.';
  }
  if (result.status === 'recommended' || result.status === 'active') {
    return `Bu operasyon için ${groupLabel} öneriliyor.`;
  }
  return undefined;
}

export function buildTeamSpecializationUnlockLine(
  context: TeamSpecializationContext = {},
): string {
  const permissions = context.unlockedPermissionIds ?? [];
  if (permissions.includes('team_specialization_preview')) {
    return 'İleri yetkilerle uzman ekip önerileri operasyonlara bağlanır.';
  }
  return 'Saha Koordinatörü yetkisiyle ekip uzmanlığı daha görünür olur.';
}

export function buildTeamSpecializationEmptyState(
  surface: TeamSpecializationPresentationOptions['surface'] = 'assignment',
): string {
  if (surface === 'dispatch') {
    return 'Ekip uzmanlığı, görev türü ve kaynak baskısı netleşince görünür.';
  }
  if (surface === 'field') {
    return 'Saha fazında ekip uzmanlığı görev bağlamına göre özetlenir.';
  }
  if (surface === 'district_operation') {
    return 'Mahalle özel operasyonu seçildiğinde uygun ekip önerisi hazırlanır.';
  }
  if (surface === 'report') {
    return 'Rapor gündeminde ekip uzmanlığı uyumu sonraki günlerde netleşir.';
  }
  if (surface === 'hub') {
    return 'Ekip uzmanlığı önerileri operasyon yetkisi ilerledikçe görünür.';
  }
  if (surface === 'dev') {
    return 'Team specialization foundation preview — assignment scoring değişmez.';
  }
  return 'Ekip uzmanlığı, görev türü ve kaynak baskısı netleşince görünür.';
}

export function buildTeamSpecializationPresentationModel(
  result: TeamSpecializationFitResult,
  options: TeamSpecializationPresentationOptions = {},
): TeamSpecializationPresentationModel {
  const compact = options.compact === true;

  return {
    id: result.specialization.id,
    title: result.specialization.title,
    subtitle: compact
      ? result.specialization.shortLabel
      : result.specialization.description,
    fitLabel: buildTeamSpecializationFitLabel(result.fitLevel),
    statusLabel: buildTeamSpecializationStatusLabel(result.status),
    tone: result.tone,
    compactLine: result.summaryLine || buildTeamSpecializationCompactLine(result),
    capabilityChips: buildTeamSpecializationCapabilityChips(result),
    warningLine: buildTeamSpecializationWarningLine(result),
    recommendationLine:
      options.includeRecommendation === false
        ? undefined
        : result.recommendationLine ?? buildTeamSpecializationRecommendationLine(result),
    unlockLine: result.isPreviewOnly ? buildTeamSpecializationUnlockLine() : undefined,
  };
}

export function buildTeamSpecializationAssignmentPreviewLine(
  result: TeamSpecializationFitResult,
): string {
  const fitLabel = buildTeamSpecializationFitLabel(result.fitLevel);
  const capability =
    result.matchedCapabilities[0] ?? result.specialization.capabilities[0];
  const capabilityLabel = capability
    ? TEAM_SPECIALIZATION_CAPABILITY_LABELS[capability as TeamSpecializationCapability]
    : result.specialization.shortLabel;
  return `Uzmanlık: ${capabilityLabel} · ${fitLabel}`;
}
